/* ケロちゃん あたま ぐんぐん — ケロはかせ's voice.
   In Japanese the fixed lines are recorded voice clips made with VOICEVOX (VOICEVOX:ずんだもん), listed in
   js/voice-clips.js (made by tools/voice/make.js). A line is said as a list of parts, e.g.
   ['はなこちゃん、', 'こんにちは！']: each part plays its clip, one after another; a part without a clip
   (a nickname) is read by the phone's own text-to-speech, slowly.
   In the other languages (js/lang.js) every part is read by the phone's text-to-speech in that language;
   a part written in Japanese letters (a nickname in kana) is read by the phone's Japanese voice.
   The clips play through Web Audio (js/sound.js), which also turns the music down while ケロはかせ talks. */
var Voice = (function () {
  'use strict';
  // Silent on the PC (localhost) like the sound effects, unless the address has ?sound=1.
  var quiet = (function () {
    try {
      var q = location.search, h = location.hostname;
      if (/[?&]sound=1/.test(q)) return false;
      return /[?&]mute=1/.test(q) || h === 'localhost' || h === '127.0.0.1';
    } catch (e) { return false; }
  }());
  var clips = typeof VOICE_CLIPS !== 'undefined' ? VOICE_CLIPS : { files: {} };
  var sound = typeof Sound !== 'undefined' ? Sound : null;
  var synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  var LOCALE = { ja: 'ja-JP', vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' };
  var JA = /[぀-ヿ㐀-鿿]/, JA_RUN = /([぀-ヿ㐀-鿿]+)/;   // kana and kanji
  var voices = {}, listed = 0, on = true, primed = false, gen = 0, src = null;
  var bytes = {};    // clip file → its bytes (small; decoded again each time it is said)
  var misses = {};   // Japanese parts that had no clip (for checking that only names are read by the phone)
  var canPlay = (function () {
    try { return !!document.createElement('audio').canPlayType(clips.type || 'audio/ogg; codecs="opus"'); } catch (e) { return false; }
  }());

  function lang() { return typeof Lang !== 'undefined' && LOCALE[Lang.cur] ? Lang.cur : 'ja'; }

  // The phone's voice for each language: one on the phone itself first, then the exact country (en-US), then any.
  function pickVoices() {
    if (!synth) return;
    var vs = [];
    try { vs = synth.getVoices() || []; } catch (e) { vs = []; }
    listed = vs.length;
    Object.keys(LOCALE).forEach(function (id) {
      var tag = function (v) { return String(v.lang || '').replace('_', '-').toLowerCase(); };
      var all = vs.filter(function (v) { return tag(v).split('-')[0] === id; });
      var exact = all.filter(function (v) { return tag(v) === LOCALE[id].toLowerCase(); });
      var local = function (list) { return list.filter(function (v) { return v.localService; })[0]; };
      voices[id] = local(exact) || local(all) || exact[0] || all[0] || null;
    });
  }
  if (synth) {
    pickVoices();
    try { synth.addEventListener('voiceschanged', pickVoices); } catch (e) { synth.onvoiceschanged = pickVoices; }
  }

  // The key of a line: spaces and line breaks made even, marks that are not read left out.
  function norm(text) {
    return String(text).replace(/[★☆●○×♪〜～]/g, ' ').replace(/[\s　]+/g, ' ').trim();
  }
  function clipOf(text) { return clips.files[norm(text)] || null; }

  // The phone's voice in language `id`, slower and at its natural pitch. When the phone lists its voices
  // but has none for the language, the part is left out (another language's voice would read it badly).
  function tts(text, id, done, my) {
    if (!synth || quiet) { done(); return; }
    if (!voices[id]) pickVoices();
    if (listed && !voices[id]) { done(); return; }
    try {
      var u = new SpeechSynthesisUtterance(norm(text));
      u.lang = LOCALE[id];
      if (voices[id]) u.voice = voices[id];
      u.rate = 0.85; u.pitch = 1.0; u.volume = 1;
      var finished = false;
      var end = function () { if (!finished) { finished = true; if (my === gen) done(); } };
      u.onend = end; u.onerror = end;
      synth.speak(u);
      setTimeout(end, 600 + norm(text).length * 260);   // in case the phone never reports the end
    } catch (e) { done(); }
  }
  function load(url) {
    if (!bytes[url]) {
      bytes[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error('clip ' + r.status); return r.arrayBuffer(); });
      bytes[url].catch(function () { delete bytes[url]; });
    }
    return bytes[url];
  }
  // A recorded clip; if it cannot be played, the phone reads the line instead.
  function play(url, text, done, my) {
    if (quiet) { done(); return; }
    var instead = function () { if (my === gen) tts(text, 'ja', done, my); };
    if (!sound || !sound.ready()) { instead(); return; }
    load(url).then(function (b) { return sound.decode(b.slice(0)); }).then(function (buf) {
      if (my !== gen) return;
      src = sound.voice(buf, function () { if (my === gen) { src = null; done(); } });
      if (!src) instead();
    }).catch(instead);
  }

  // Outside Japanese, a part is cut where Japanese letters start or end ('はなこ ơi,' → 'はなこ', 'ơi,'),
  // so the name and the rest each get the right voice; bits with nothing to read (',') are left out.
  function pieces(list) {
    var out = [];
    list.forEach(function (t) {
      t.split(JA_RUN).forEach(function (p) { p = p.trim(); if (/[\p{L}\p{N}]/u.test(p)) out.push(p); });
    });
    return out;
  }

  // parts: a string or a list of strings, said in order (what was being said before stops).
  // They come already in the chosen language (L() in js/lang.js).
  function say(parts) {
    var list = (Array.isArray(parts) ? parts : [parts]).map(norm).filter(function (t) { return t; });
    var id = lang();
    if (id === 'ja') list.forEach(function (t) { if (!clips.files[t]) misses[t] = true; });
    else list = pieces(list);
    if (!on || !list.length) return;
    stop();
    var my = gen;
    (function next(i) {
      if (my !== gen || i >= list.length) return;
      var t = list[i], go = function () { next(i + 1); };
      var url = id === 'ja' ? clipOf(t) : null;
      if (url && canPlay) play(url, t, go, my);
      else tts(t, id === 'ja' || JA.test(t) ? 'ja' : id, go, my);
    }(0));
  }

  function stop() {
    gen++;
    if (src) { try { src.stop(); } catch (e) { /* ignore */ } src = null; }
    if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } }
  }

  // Chrome only lets a page speak after the player has touched it once.
  function prime() {
    if (primed || quiet) return;
    primed = true;
    pickVoices();
    if (synth) { try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ } }
  }

  function set(value) { on = !!value; if (!on) stop(); }
  // The phone's own voice for a language (the chosen one when none is given):
  // 'ok', 'none' (no voice for it installed) or 'no' (no text-to-speech in this browser).
  function phoneVoice(id) {
    id = id || lang();
    if (!voices[id]) pickVoices();
    return !synth ? 'no' : voices[id] ? 'ok' : 'none';
  }

  return {
    say: say, stop: stop, prime: prime, set: set, phoneVoice: phoneVoice, quiet: quiet,
    norm: norm, hasClip: function (t) { return !!clipOf(t); }, misses: misses, credit: clips.credit || ''
  };
}());
