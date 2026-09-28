/* ケロちゃん あたま ぐんぐん — sound effects, the piano and music, synthesised with Web Audio
   (no audio files, so the game stays tiny and works offline). The engine is the one from
   ケロちゃん ぴよぴよポン. */
var Sound = (function () {
  'use strict';
  var ac = null, master, sfxBus, musicBus, noiseBuf;
  var on = { sfx: true, music: true };
  var MUSIC_VOL = 0.18;
  // Silent while the game is tried on the PC (localhost), so testing never makes a sound;
  // add ?sound=1 to the address to hear it there.
  var QUIET = (function () {
    try {
      var q = location.search, h = location.hostname;
      if (/[?&]sound=1/.test(q)) return false;
      return /[?&]mute=1/.test(q) || h === 'localhost' || h === '127.0.0.1';
    } catch (e) { return false; }
  }());

  function init() {
    if (QUIET) return;
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = on.sfx ? 0.8 : 0; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = on.music ? MUSIC_VOL : 0; musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (music.want) startMusic();
  }

  function ready() { return ac && ac.state === 'running'; }

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  // o: { f, f2, type, vol, a, d, when, bus, at }
  function tone(o) {
    if (!ac) return;
    var t = (o.at || ac.currentTime) + (o.when || 0), a = o.a || 0.008, d = o.d || 0.2;
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + a + d);
    env(g, t, a, o.vol || 0.3, d);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + a + d + 0.05);
  }

  // o: { type, f, f2, q, vol, a, d, when, bus, at }
  function noise(o) {
    if (!ac) return;
    var t = (o.at || ac.currentTime) + (o.when || 0), a = o.a || 0.004, d = o.d || 0.1;
    var src = ac.createBufferSource(); src.buffer = noiseBuf;
    var flt = ac.createBiquadFilter(); flt.type = o.type || 'bandpass';
    flt.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) flt.frequency.exponentialRampToValueAtTime(o.f2, t + a + d);
    flt.Q.value = o.q || 1;
    var g = ac.createGain(); env(g, t, a, o.vol || 0.3, d);
    src.connect(flt); flt.connect(g); g.connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + a + d + 0.05);
  }

  function semi(f, n) { return f * Math.pow(2, n / 12); }

  // "ぴよっ": a quick chirp up and down
  function peep(f, vol, when) {
    tone({ f: f, f2: f * 1.4, type: 'sine', vol: vol, d: 0.05, when: when });
    tone({ f: f * 1.4, f2: f * 1.15, type: 'sine', vol: vol * 0.8, d: 0.06, when: (when || 0) + 0.055 });
  }

  // the piano: ど れ み ふぁ そ ら し ど
  var KEYF = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
  function pianoNote(i, len, when, bus) {
    var f = KEYF[i] || KEYF[0], d = Math.max(0.35, Math.min(1.4, len || 0.7));
    tone({ f: f, type: 'triangle', vol: 0.3, a: 0.004, d: d, when: when, bus: bus });
    tone({ f: f * 2, type: 'sine', vol: 0.09, a: 0.004, d: d * 0.6, when: when, bus: bus });
    tone({ f: f * 3, type: 'sine', vol: 0.035, a: 0.003, d: 0.18, when: when, bus: bus });
  }

  var fx = {
    click: function () { tone({ f: 880, f2: 1320, type: 'triangle', vol: 0.14, d: 0.06 }); },
    // quiz-show "ピンポーン" and a soft "ブブッ"
    ok: function () {
      tone({ f: 1318.5, type: 'triangle', vol: 0.2, d: 0.13 });
      tone({ f: 1046.5, type: 'triangle', vol: 0.2, d: 0.32, when: 0.12 });
      tone({ f: 2093, type: 'sine', vol: 0.04, d: 0.25, when: 0.12 });
    },
    ng: function () {
      tone({ f: 196, type: 'square', vol: 0.045, d: 0.1 });
      tone({ f: 196, type: 'triangle', vol: 0.2, d: 0.1 });
      tone({ f: 185, type: 'square', vol: 0.045, d: 0.2, when: 0.15 });
      tone({ f: 185, type: 'triangle', vol: 0.2, d: 0.2, when: 0.15 });
    },
    tick: function () {
      tone({ f: 1250, type: 'triangle', vol: 0.18, d: 0.05 });
      noise({ type: 'highpass', f: 3000, vol: 0.06, d: 0.02 });
    },
    go: function () {
      [0, 4, 7, 12].forEach(function (s, i) { tone({ f: semi(784, s), type: 'triangle', vol: 0.16, d: 0.14, when: i * 0.05 }); });
    },
    pop: function () {
      noise({ type: 'bandpass', f: 1800, q: 0.9, vol: 0.4, d: 0.07 });
      tone({ f: 900, f2: 260, type: 'sine', vol: 0.2, d: 0.1 });
    },
    hop: function () { tone({ f: 380, f2: 950, type: 'sine', vol: 0.18, d: 0.12 }); },
    land: function () { noise({ type: 'lowpass', f: 700, vol: 0.14, d: 0.05 }); },
    flip: function () { tone({ f: 980, f2: 620, type: 'triangle', vol: 0.1, d: 0.06 }); },
    crack: function (i) {
      noise({ type: 'highpass', f: 3200, vol: 0.18, d: 0.035 });
      peep(semi(1500, Math.min(14, (i || 0) * 1.6)), 0.11, 0.03);
    },
    peep: function () { peep(1800 + Math.random() * 400, 0.1); },
    door: function () {
      noise({ type: 'lowpass', f: 500, vol: 0.2, d: 0.06 });
      tone({ f: 330, f2: 250, type: 'triangle', vol: 0.08, d: 0.08, when: 0.02 });
    },
    step: function () { tone({ f: 700 + Math.random() * 200, type: 'sine', vol: 0.04, d: 0.03 }); },
    whoosh: function () { noise({ type: 'bandpass', f: 500, f2: 2400, q: 1.2, vol: 0.14, d: 0.22 }); },
    select: function () { tone({ f: 740, type: 'triangle', vol: 0.12, d: 0.05 }); },
    place: function () {
      tone({ f: 523.25, f2: 784, type: 'triangle', vol: 0.13, d: 0.08 });
      noise({ type: 'lowpass', f: 900, vol: 0.1, d: 0.04 });
    },
    jump: function () { tone({ f: 300, f2: 760, type: 'sine', vol: 0.16, d: 0.16 }); },
    bump: function () {
      noise({ type: 'lowpass', f: 420, vol: 0.3, d: 0.12 });
      tone({ f: 160, f2: 80, type: 'sine', vol: 0.25, d: 0.18 });
    },
    thud: function () { noise({ type: 'lowpass', f: 320, vol: 0.2, d: 0.07 }); },
    stamp: function () {
      tone({ f: 260, f2: 110, type: 'sine', vol: 0.45, d: 0.18 });
      noise({ type: 'lowpass', f: 600, vol: 0.3, d: 0.08 });
      [0, 4, 7].forEach(function (s, i) { tone({ f: semi(1568, s), type: 'triangle', vol: 0.08, d: 0.25, when: 0.12 + i * 0.07 }); });
    },
    drum: function () {
      for (var i = 0; i < 22; i++) noise({ type: 'bandpass', f: 1400, q: 0.7, vol: 0.05 + i * 0.006, d: 0.035, when: i * 0.05 });
    },
    unlock: function () {
      [0, 4, 7, 12, 16, 19].forEach(function (s, i) { tone({ f: semi(1046.5, s), type: 'sine', vol: 0.1, d: 0.2, when: i * 0.06 }); });
    },
    star: function (i) {
      tone({ f: semi(784, (i || 0) * 4), type: 'triangle', vol: 0.2, d: 0.25 });
      tone({ f: semi(1568, (i || 0) * 4), type: 'sine', vol: 0.08, d: 0.35 });
    },
    cheer: function () { for (var i = 0; i < 3; i++) peep(1700 + i * 200, 0.08, i * 0.11); },
    win: function () {
      [0, 4, 7, 12].forEach(function (s, i) { tone({ f: semi(523.25, s), type: 'triangle', vol: 0.2, d: 0.2, when: 0.2 + i * 0.11 }); });
      [0, 4, 7].forEach(function (s) { tone({ f: semi(1046.5, s), type: 'triangle', vol: 0.1, d: 0.6, when: 0.65 }); });
    },
    soft: function () {
      tone({ f: 523.25, f2: 587, type: 'triangle', vol: 0.14, d: 0.2 });
      tone({ f: 659.25, type: 'triangle', vol: 0.12, d: 0.35, when: 0.18 });
    },
    fanfare: function () {
      var seq = [0, 4, 7, 12, 7, 12, 16];
      seq.forEach(function (s, i) { tone({ f: semi(523.25, s), type: 'triangle', vol: 0.18, d: 0.18, when: i * 0.12 }); });
      [0, 4, 7, 12].forEach(function (s) { tone({ f: semi(523.25, s), type: 'triangle', vol: 0.09, d: 0.9, when: seq.length * 0.12 }); });
    },
    piano: function (i) { pianoNote(i, 0.8); }
  };

  function play(name, arg) {
    if (!ac || !on.sfx || !fx[name]) return;
    try { fx[name](arg); } catch (e) { /* audio is best-effort */ }
  }

  // ---------------------------------------------------------------- music (menus only)
  // Eighth-note grid; "-" holds the previous note, "." is a rest. Bass is in quarter notes.
  var SONG = {
    bpm: 104,
    lead: ('C5 - E5 - G5 - E5 - F5 - A5 - G5 - - - E5 - G5 - C6 - B5 A5 G5 - - - . . . . ' +
           'A5 - G5 - F5 - E5 - D5 - E5 - F5 - - - E5 - D5 - C5 - D5 E5 C5 - - - . . . . ' +
           'E5 F5 G5 - G5 - A5 G5 F5 - E5 - D5 - - - D5 E5 F5 - F5 - G5 F5 E5 - D5 - C5 - - - ' +
           'C5 - E5 - G5 - C6 - B5 - A5 - G5 - - - A5 - G5 - F5 - D5 - C5 - - - . . . .').split(' '),
    bass: ('C3 G3 E3 G3 F2 C3 C3 G3 C3 G3 A2 E3 G2 D3 G2 D3 ' +
           'F2 C3 F2 C3 D3 A3 G2 D3 C3 G3 G2 D3 C3 G3 C3 . ' +
           'C3 G3 C3 G3 F2 C3 G2 D3 D3 A3 G2 D3 C3 G3 C3 G3 ' +
           'C3 G3 E3 G3 G2 D3 G2 D3 F2 C3 G2 D3 C3 G3 C3 .').split(' ')
  };
  var NOTE = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function freq(n) {
    var m = /^([A-G])(#?)(\d)$/.exec(n);
    if (!m) return 0;
    return 440 * Math.pow(2, (NOTE[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) - 4) * 12) / 12);
  }

  var music = { want: false, timer: null, next: 0, step: 0 };

  function scheduleMusic() {
    if (!ac) return;
    var eighth = 60 / SONG.bpm / 2;
    while (music.next < ac.currentTime + 0.25) {
      var s = music.step, t = music.next, n = SONG.lead[s];
      if (n !== '-' && n !== '.') {
        var len = 1;
        while (SONG.lead[(s + len) % SONG.lead.length] === '-') len++;
        tone({ f: freq(n), type: 'triangle', vol: 0.26, a: 0.01, d: Math.min(0.9, eighth * len * 0.95), at: t, bus: musicBus });
        tone({ f: freq(n) * 2, type: 'sine', vol: 0.04, a: 0.01, d: eighth * 0.8, at: t, bus: musicBus });
      }
      if (s % 2 === 0) {
        var b = SONG.bass[(s / 2) % SONG.bass.length];
        if (b !== '.') tone({ f: freq(b), type: 'sine', vol: 0.4, a: 0.01, d: eighth * 1.7, at: t, bus: musicBus });
      } else {
        noise({ type: 'highpass', f: 7000, vol: 0.035, d: 0.03, at: t, bus: musicBus });
      }
      music.next += eighth;
      music.step = (s + 1) % SONG.lead.length;
    }
  }

  function startMusic() {
    music.want = true;
    if (!ac || music.timer) return;
    music.next = ac.currentTime + 0.1;
    music.step = 0;
    music.timer = setInterval(scheduleMusic, 60);
  }

  function stopMusic() {
    music.want = false;
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
  }

  function set(kind, value) {
    on[kind] = value;
    if (!ac) return;
    var now = ac.currentTime;
    if (kind === 'sfx') sfxBus.gain.setTargetAtTime(value ? 0.8 : 0, now, 0.02);
    if (kind === 'music') musicBus.gain.setTargetAtTime(musicLevel(), now, 0.05);
  }

  // ケロはかせ's recorded voice (js/voice.js): a decoded clip plays at the master volume,
  // and the music steps back while he talks.
  var talking = 0;
  function musicLevel() { return on.music ? (talking ? MUSIC_VOL * 0.35 : MUSIC_VOL) : 0; }
  function decode(bytes) {
    return new Promise(function (ok, ng) {
      if (!ac) { ng(new Error('no audio')); return; }
      try { var p = ac.decodeAudioData(bytes, ok, ng); if (p && p.catch) p.catch(ng); } catch (e) { ng(e); }
    });
  }
  function voice(buf, done) {
    if (!ac || ac.state !== 'running') return null;
    var s = ac.createBufferSource();
    s.buffer = buf;
    s.connect(master);
    talking++;
    musicBus.gain.setTargetAtTime(musicLevel(), ac.currentTime, 0.08);
    s.onended = function () {
      talking = Math.max(0, talking - 1);
      musicBus.gain.setTargetAtTime(musicLevel(), ac.currentTime, 0.25);
      if (done) done();
    };
    s.start();
    return s;
  }

  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }

  // The piano of the piano training is the training itself, not an effect: it sounds even with effects off.
  function piano(i, len) { if (ac) { try { pianoNote(i, len, 0, master); } catch (e) { /* ignore */ } } }

  return { init: init, ready: ready, play: play, piano: piano, set: set, startMusic: startMusic, stopMusic: stopMusic, suspend: suspend, resume: resume, decode: decode, voice: voice };
}());
