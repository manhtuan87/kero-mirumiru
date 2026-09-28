// Makes ケロはかせ's recorded voice with VOICEVOX (VOICEVOX:ずんだもん) and ffmpeg:
//   1. start the VOICEVOX app (its engine listens on http://127.0.0.1:50021)
//   2. node tools/voice/make.js [--ffmpeg path\to\ffmpeg.exe] [--force]
// Every line in tools/voice/lines.js becomes voice/<hash>.ogg (Ogg Opus, small), and js/voice-clips.js
// is written with the list. Clips that already exist are kept (--force makes them again), and clips that
// are no longer used are removed.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), http = require('http');
const { execFileSync } = require('child_process');
const { lines } = require('./lines.js');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'voice');
const LIST = path.join(ROOT, 'js', 'voice-clips.js');
const ENGINE = { host: '127.0.0.1', port: 50021 };
const SPEAKER = 3;            // ずんだもん（ノーマル）
const CREDIT = 'VOICEVOX:ずんだもん';
const TUNE = { speedScale: 0.9, pitchScale: 0, intonationScale: 1.1, volumeScale: 1.0, prePhonemeLength: 0.05, postPhonemeLength: 0.12 };
const args = process.argv.slice(2);
const force = args.includes('--force');

function findFfmpeg() {
  const i = args.indexOf('--ffmpeg');
  if (i >= 0) return args[i + 1];
  const tools = path.join(ROOT, '..', '_tools');
  if (fs.existsSync(tools)) {
    for (const d of fs.readdirSync(tools)) {
      const f = path.join(tools, d, 'bin', 'ffmpeg.exe');
      if (fs.existsSync(f)) return f;
    }
  }
  return 'ffmpeg';
}

function post(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : Buffer.alloc(0);
    const req = http.request({ ...ENGINE, method: 'POST', path: pathname,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) reject(new Error(pathname + ' → ' + res.statusCode + ' ' + buf.toString().slice(0, 200)));
        else resolve(buf);
      });
    });
    req.on('error', reject);
    req.end(data);
  });
}

async function wavOf(read) {
  const q = JSON.parse((await post('/audio_query?speaker=' + SPEAKER + '&text=' + encodeURIComponent(read))).toString());
  Object.assign(q, TUNE, { outputSamplingRate: 24000, outputStereo: false });
  return post('/synthesis?speaker=' + SPEAKER, q);
}
// The engine sometimes drops a connection (e.g. while it restarts): wait and try again.
async function wavRetry(read) {
  for (let n = 1; ; n++) {
    try { return await wavOf(read); }
    catch (e) { if (n >= 5) throw e; process.stdout.write('(retry)'); await new Promise(r => setTimeout(r, 3000 * n)); }
  }
}

// The file name comes from the text and the way it is read, so a changed reading makes a new file
// (and the phones fetch it again instead of keeping the old one).
function fileOf(line) {
  const h = crypto.createHash('sha1').update(SPEAKER + '|' + JSON.stringify(TUNE) + '|' + line.read).digest('hex').slice(0, 12);
  return 'v-' + h + '.ogg';
}

async function main() {
  try { await new Promise((ok, ng) => http.get({ ...ENGINE, path: '/version' }, r => { r.resume(); r.on('end', ok); }).on('error', ng)); }
  catch (e) { console.error('VOICEVOX is not running (start the VOICEVOX app first).'); process.exit(1); }
  const ffmpeg = findFfmpeg();
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(os.tmpdir(), 'kero-voice-' + process.pid + '.wav');
  const files = {}, used = {};
  let made = 0;
  for (const line of lines) {
    const name = fileOf(line), dest = path.join(OUT, name);
    files[line.text] = 'voice/' + name;
    used[name] = true;
    if (fs.existsSync(dest) && !force) continue;
    fs.writeFileSync(tmp, await wavRetry(line.read));
    execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-c:a', 'libopus', '-b:a', '28k', '-application', 'voip', '-vbr', 'on', '-f', 'ogg', dest + '.part']);
    fs.renameSync(dest + '.part', dest);   // (a clip is only there once it is whole)
    made++;
    process.stdout.write('.');
  }
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  let removed = 0;
  for (const f of fs.readdirSync(OUT)) if (/^v-.*\.ogg(\.part)?$/.test(f) && !used[f]) { fs.unlinkSync(path.join(OUT, f)); removed++; }

  const body = Object.keys(files).map(k => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(files[k])).join(',\n');
  fs.writeFileSync(LIST, '/* The recorded voice of ケロはかせ, made by tools/voice/make.js (do not edit by hand).\n' +
    '   ' + CREDIT + ' — https://voicevox.hiroshiba.jp/ */\n' +
    'var VOICE_CLIPS = {\n  credit: ' + JSON.stringify(CREDIT) + ',\n  type: \'audio/ogg; codecs="opus"\',\n  files: {\n' + body + '\n  }\n};\n');
  let bytes = 0;
  for (const f of Object.keys(used)) bytes += fs.statSync(path.join(OUT, f)).size;
  console.log('\n' + lines.length + ' lines, ' + made + ' made, ' + removed + ' removed, ' + Math.round(bytes / 1024) + ' KB in voice/');
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
