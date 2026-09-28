/* ケロちゃん みるみる — screens, the daily eye check, results, the eye stretch, the eye facts,
   stamps, records, the shop, grown-up settings and the main loop. The trainings themselves are in js/tr/. */
(function () {
  'use strict';
  var D = window.Draw, A = window.Art, S = window.Sound, V = window.Voice;
  var C = window.Core, DATA = window.Data, T = window.Trainings;
  var W = 360, H = 640;
  var $ = function (id) { return document.getElementById(id); };
  var LS = (function () { try { return window.localStorage; } catch (e) { return null; } }());
  var NOSTORE = { getItem: function () { return null; }, setItem: function () {} };

  // ---------------------------------------------------------------- language (js/lang.js, js/lang-text.js)
  // The names and lines in the data are put into the chosen language once, here at the start (the Node
  // tools keep the Japanese data). Everything ケロはかせ says goes through L() too: in Japanese it is the key of
  // a recorded clip, in the other languages the phone reads it (js/voice.js).
  (function localize() {
    if (Lang.cur === 'ja') return;
    var tx = function (s) { return L(s); };
    T.list.forEach(function (tr) { tr.name = L(tr.name); if (tr.help) tr.help = L(tr.help); });
    DATA.CATS.forEach(function (c) { c.name = L(c.name); if (c.sub) c.sub = L(c.sub); });
    DATA.LEVELS.forEach(function (l) { l.name = L(l.name); if (l.short) l.short = L(l.short); });
    DATA.ANIMALS.forEach(function (a) { a.name = L(a.name); a.fact = L(a.fact); });
    DATA.CHECK.forEach(function (c) { c.name = L(c.name); c.good = L(c.good); });
    Object.keys(DATA.LINES).forEach(function (k) { var v = DATA.LINES[k]; DATA.LINES[k] = Array.isArray(v) ? v.map(tx) : L(v); });
    DATA.TIPS.forEach(function (t, i) { DATA.TIPS[i] = L(t); });
    DATA.STRETCH.forEach(function (st) { st[0] = L(st[0]); });
  }());

  // ---------------------------------------------------------------- save data

  var save = C.load(LS || NOSTORE);
  function store() { C.store(LS || NOSTORE, save); }
  function ud() { return C.udata(save); }
  function me() { return C.user(save); }
  function isAdult() { return me().type === 'adult'; }
  if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* ignore */ } }

  function trOf(id) { return T.byId[id]; }
  function catOf(id) {
    var t = C.trainingInfo(id);
    for (var i = 0; i < DATA.CATS.length; i++) if (t && DATA.CATS[i].id === t.cat) return DATA.CATS[i];
    return DATA.CATS[0];
  }
  function levelName(lv) {
    for (var i = 0; i < DATA.LEVELS.length; i++) if (DATA.LEVELS[i].id === lv) return DATA.LEVELS[i].name;
    return lv === 'endless' ? L('きろくに ちょうせん') : L('チェック');
  }
  function levelsFor() { return DATA.LEVELS.filter(function (l) { return !l.adult || isAdult(); }); }
  function isAdultLevel(lv) { return lv === 'testA' || DATA.LEVELS.some(function (l) { return l.id === lv && l.adult; }); }
  function animalName(rank) { return DATA.ANIMALS[Math.max(0, Math.min(6, rank - 1))].name; }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];   // (English calendar)
  function paren(t) { return t ? L('（{t}）', { t: t }) : ''; }
  function nameHead(n) { return n ? L('{name}、', { name: n }) : ''; }
  // A run's result in words. Trainings give a small object (U.res in trainings.js), kept as JSON in the
  // records so it reads right in any language; old saves kept the Japanese text itself.
  function resText(x) {
    if (!x) return '';
    if (typeof x === 'string') {
      if (x.charAt(0) !== '{') return Lang.cur === 'ja' || !Lang.hasJapanese(x) ? x : '';
      try { x = JSON.parse(x); } catch (e) { return ''; }
    }
    var time = function (t) { return L('{s}びょう', { s: (+t || 0).toFixed(1) }); };
    if (x.k === 'time') return time(x.t) + (x.m ? L('・まちがい {n}', { n: x.m }) : '');
    if (x.k === 'right') return L('{a}もん せいかい（{b}もん）', { a: x.a, b: x.b });
    if (x.k === 'hit') return L('{a} / {b} せいこう', { a: x.a, b: x.b });
    if (x.k === 'endless') return L('つづけて {a}かい', { a: x.a });
    return '';
  }
  function resKeep(x) { return x && typeof x === 'object' ? JSON.stringify(x) : (x || ''); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  // The nickname set in ケロちゃん ランド (shared by every game on the site) stands in for the first user's name
  // when that user has none of its own.
  function landName() { try { return (localStorage.getItem('kero-name') || '').trim().slice(0, C.NAME_MAX); } catch (e) { return ''; } }
  function nameOf(u) { return u.name || (u === save.users[0] ? landName() : ''); }
  function initial(u) { var n = nameOf(u); return n ? n.charAt(0) : '★'; }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }

  // ---------------------------------------------------------------- view (the 360 x 640 stage, scaled to fit)

  var canvas = $('game'), ctx = canvas.getContext('2d'), stageEl = $('stage');
  var view = { cw: 1, ch: 1, dpr: 1, s: 1, ox: 0, oy: 0 };
  var bg = { canvas: null, theme: -1 };

  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    var s = Math.min(cw / W, ch / H);
    view = { cw: cw, ch: ch, dpr: dpr, s: s, ox: (cw - W * s) / 2, oy: (ch - H * s) / 2 };
    stageEl.style.transform = 'translate(' + view.ox + 'px,' + view.oy + 'px) scale(' + s + ')';
    bg.canvas = null;
  }
  function worldTransform(c) { c.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, view.dpr * view.ox, view.dpr * view.oy); }
  function visible() {
    var x0 = -view.ox / view.s, y0 = -view.oy / view.s;
    return { x0: x0, y0: y0, x1: x0 + view.cw / view.s, y1: y0 + view.ch / view.s };
  }
  function drawBackground(theme) {
    if (!(view.s > 0)) return;   // (a window with no size yet)
    if (!bg.canvas || bg.theme !== theme) {
      bg.canvas = document.createElement('canvas');
      bg.canvas.width = canvas.width; bg.canvas.height = canvas.height;
      var b = bg.canvas.getContext('2d'), v = visible();
      worldTransform(b);
      D.background(b, theme, v.x0, v.y0, v.x1, v.y1);
      bg.theme = theme;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg.canvas, 0, 0);
  }
  function toWorld(e) { return { x: (e.clientX - view.ox) / view.s, y: (e.clientY - view.oy) / view.s }; }

  // ---------------------------------------------------------------- effects: sparkles, confetti, ○ ×, big words

  var fx = [], marks = [], words = [];
  function burst(x, y, kind, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
      fx.push({ kind: kind, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 3 + Math.random() * 4, color: color, rot: Math.random() * 6 });
    }
  }
  function ring(x, y, color) { fx.push({ kind: 'ring', x: x, y: y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 10, color: color }); }
  function confetti(n) {
    for (var i = 0; i < n; i++) {
      fx.push({ kind: 'confetti', x: Math.random() * W, y: -20 - Math.random() * 180, vx: (Math.random() - 0.5) * 80, vy: 40 + Math.random() * 60, life: 2.8, max: 2.8, size: 4 + Math.random() * 3, rot: Math.random() * 6, color: ['#ff7fb5', '#ffd93d', '#7fd3ff', '#8ff08f', '#c79cff'][i % 5] });
    }
  }
  function addMark(kind, x, y, r) { marks.push({ kind: kind, x: x, y: y, r: r || 34, t: 0 }); }
  function addWord(text, x, y, size, color, dur) { words.push({ text: text, x: x, y: y, size: size || 40, color: color || '#ffd23d', t: 0, dur: dur || 1.1 }); }
  function updateFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) {
      var p = fx[i];
      p.life -= dt;
      if (p.life <= 0) { fx.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'confetti' || p.kind === 'dot') p.vy += 500 * dt;
      if (p.kind === 'confetti') { p.vx *= 0.99; p.rot += dt * 8; }
      if (p.kind === 'heart') p.vx = Math.sin(p.life * 6) * 25;
    }
    for (i = marks.length - 1; i >= 0; i--) { marks[i].t += dt; if (marks[i].t > 0.65) marks.splice(i, 1); }
    for (i = words.length - 1; i >= 0; i--) { words[i].t += dt; if (words[i].t > words[i].dur) words.splice(i, 1); }
  }
  function drawFx(c) {
    for (var i = 0; i < fx.length; i++) {
      var p = fx[i], a = Math.max(0, Math.min(1, p.life / (p.max * 0.6)));
      c.globalAlpha = a;
      if (p.kind === 'spark') D.sparkle(c, p.x, p.y, p.size * 1.6, p.color);
      else if (p.kind === 'dot') { D.circle(c, p.x, p.y, p.size * 0.8); D.paint(c, p.color); }
      else if (p.kind === 'heart') D.heart(c, p.x, p.y, p.size);
      else if (p.kind === 'ring') { var k = 1 - p.life / p.max; D.circle(c, p.x, p.y, p.size + k * 40); D.paint(c, null, p.color, 5 * (1 - k)); }
      else if (p.kind === 'confetti') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color; c.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8); c.restore(); }
    }
    c.globalAlpha = 1;
    marks.forEach(function (m) {
      var k = m.t / 0.65, s = k < 0.2 ? 0.6 + k / 0.2 * 0.5 : k < 0.3 ? 1.1 - (k - 0.2) : 1, a = k > 0.7 ? (1 - k) / 0.3 : 1;
      if (m.kind === 'maru') A.maru(c, m.x, m.y, m.r * s, a); else A.batsu(c, m.x, m.y, m.r * 0.78 * s, a);
    });
    words.forEach(function (w) { D.word(c, w.text, w.x, w.y, w.size, w.color, w.t / w.dur); });
  }

  // ---------------------------------------------------------------- ケロはかせ's speech bubble and voice

  var tipTimer = null;
  // o: { x, y: where the tail points, w: width, below: bubble under the point, dur: ms (0 = stays) }
  function bubble(text, o) {
    o = o || {};
    var el = $('tip'), w = o.w || 300, x = o.x != null ? o.x : W / 2, y = o.y != null ? o.y : 300;
    var left = Math.max(8, Math.min(W - 8 - w, x - w / 2));
    el.textContent = text;
    el.style.width = w + 'px'; el.style.left = left + 'px';
    el.classList.remove('below', 'free');
    if (o.free) el.classList.add('free');
    if (o.below) { el.classList.add('below'); el.style.top = (y + 14) + 'px'; el.style.bottom = ''; }
    else { el.style.top = ''; el.style.bottom = (H - y + 14) + 'px'; }
    el.style.setProperty('--tail', Math.max(24, Math.min(w - 24, x - left)) + 'px');
    el.classList.add('on');
    clearTimeout(tipTimer);
    if (o.dur !== 0) tipTimer = setTimeout(hideWhenSaid, o.dur || 6500);
  }
  function hideBubble() { clearTimeout(tipTimer); $('tip').classList.remove('on'); }
  // (a bubble stays while its line is still being said)
  function hideWhenSaid() { if (V.busy()) tipTimer = setTimeout(hideWhenSaid, 400); else hideBubble(); }
  function speak(text) { if (save.voice) V.say(text); }   // (text in the chosen language: L())
  // Seconds since ケロはかせ stopped talking (0 while he talks). What moves on by itself (the cards after a result,
  // the steps of the stretch) waits for this, so a line is never cut off by the next one.
  var hush = 0;
  function quietFor(sec) { return hush >= sec; }

  // ---------------------------------------------------------------- small pictures for the lists

  function makeCanvas(cssW, cssH, cls) {
    var cv = document.createElement('canvas');
    cv.width = Math.round(cssW * 2); cv.height = Math.round(cssH * 2);
    if (cls) cv.className = cls;
    return cv;
  }
  function iconCanvas(tr, size, cls) {
    var cv = makeCanvas(size, size, cls), g = cv.getContext('2d');
    g.scale(size * 2 / 100, size * 2 / 100);
    if (tr && tr.icon) tr.icon(g, 0);
    return cv;
  }
  function animalCanvas(rank, w, h) {
    var cv = makeCanvas(w, h), g = cv.getContext('2d'), s = Math.min(w / 125, h / 105) * 2;
    g.lineJoin = 'round';
    A.animal(g, rank, w, h * 2 - 3, s, 0.3, {});
    return cv;
  }
  function stars(n, max) {
    var h = '<span class="mini-stars">';
    for (var k = 0; k < (max || 3); k++) h += '<i class="' + (k < n ? 'got' : '') + '">' + icon('star') + '</i>';
    return h + '</span>';
  }
  var STAMP_IMG = {};
  function makeStampImages() {
    ['kero', 'hana'].forEach(function (k) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 96;
      A.stamp(cv.getContext('2d'), 48, 48, 44, k);
      STAMP_IMG[k] = cv.toDataURL();
    });
  }
  function stampImg() { return '<img src="' + STAMP_IMG.kero + '" alt="">'; }

  // ---------------------------------------------------------------- screens and the phone's back button

  var SCREENS = ['who', 'title', 'list', 'intro', 'play', 'result', 'check', 'stamps', 'records', 'shop', 'stretch', 'tips'];
  var QUIET = { play: 1, result: 1, stretch: 1 };   // no background music here
  var screen = 'title', clock = 0, navTarget = null;

  function show(name) {
    screen = name;
    SCREENS.forEach(function (id) { $(id).classList.toggle('on', id === name); });
    hideBubble();
    if (name !== 'play' && name !== 'stretch') releaseWake();
    if (QUIET[name] || (name === 'check' && check && check.stage === 'result')) S.stopMusic();
    else if (save.music) S.startMusic();
  }
  function forward(fn) { history.pushState({ miru: 1 }, ''); fn(); }
  function back() { S.play('click'); history.back(); }
  // Go back in history to a screen further up (the popstate handler then shows `target`).
  function backTo(target, steps) { navTarget = target; history.go(-(steps || 1)); }

  function go(name, arg) {
    ['graph', 'buy', 'pass', 'parent', 'users', 'uedit'].forEach(hidePanel);
    if (name === 'title') { show('title'); enterTitle(); }
    else if (name === 'who') { buildWho(); show('who'); }
    else if (name === 'list') { buildList(); show('list'); }
    else if (name === 'intro') openIntro(arg || intro.tr);
    else if (name === 'stamps') { cal.month = null; buildStamps(); show('stamps'); }
    else if (name === 'records') { buildRecords(); show('records'); }
    else if (name === 'shop') { buildShop(); show('shop'); }
    else if (name === 'check') startCheck();
    else if (name === 'stretch') startStretch();
    else if (name === 'tips') { buildTips(); show('tips'); }
  }

  window.addEventListener('popstate', function () {
    ['graph', 'buy', 'pass', 'parent', 'users', 'uedit'].forEach(hidePanel);
    if (navTarget) {
      var tgt = navTarget; navTarget = null;
      if (run) stopRun();
      go(tgt);
      return;
    }
    if (screen === 'play' && run) {
      if (run.state === 'paused') { quitRun(); return; }
      pauseRun();
      history.pushState({ miru: 1 }, '');
      return;
    }
    if (screen === 'stretch') stretch = null;
    if (screen === 'result') { go('intro', result && result.tr); return; }
    if (screen === 'intro') { go('list'); return; }
    if (screen === 'check' && check) { check = null; }
    go('title');
  });

  // ---------------------------------------------------------------- title

  var title = { syms: [], crit: { mode: 'idle', mt: 0, blink: false, blinkT: 2 } };
  var SYMS = ['C', '○', '☆', 'C', '△', '□', 'C', '○', '◇', 'C', '☆', '○'];
  var SYM_COLORS = ['#ff8fc0', '#6cc6ff', '#ffb347', '#86d65c', '#b58cff', '#ffd23d'];
  for (var si = 0; si < 11; si++) {
    title.syms.push({ ch: SYMS[si], x: 16 + Math.random() * 328, y: 60 + Math.random() * 600, vy: 9 + Math.random() * 10, size: 20 + Math.random() * 14, col: SYM_COLORS[si % 6], seed: Math.random() * 6 });
  }
  function hakasePos() { return ud().chara !== 'frog' ? { x: 150, y: 350 } : { x: 180, y: 350 }; }

  function refreshTitle() {
    var done = C.checkedToday(save);
    $('check-done').hidden = !done;
    $('btn-check').classList.toggle('glow', !done);
    var chip = $('btn-user'), u = me();
    chip.hidden = save.users.length < 2 && !nameOf(u);
    chip.classList.toggle('single', save.users.length < 2);
    chip.innerHTML = '<i style="background:' + C.COLORS[u.color] + '"></i>' + esc(nameOf(u) || L('なまえなし'));
    $('shop-badge').innerHTML = icon('star') + C.wallet(ud());
    $('credit').textContent = V.credit ? L(Lang.cur === 'ja' ? 'こえ：{credit}' : '日本語の こえ：{credit}', { credit: V.credit }) : '';
    refreshToggles();
  }

  function enterTitle() {
    refreshTitle();
    var u = me(), hr = new Date().getHours();
    var hello = hr >= 4 && hr < 10 ? DATA.LINES.morning : hr < 17 ? DATA.LINES.day : DATA.LINES.night;
    var text, parts;
    if (!save.intro) { text = DATA.LINES.first; parts = [text]; save.intro = true; store(); }
    else {
      var nm = nameOf(u), line = C.checkedToday(save) ? pick(DATA.LINES.title) : DATA.LINES.checkFirst;
      text = nameHead(nm) + hello + '\n' + line;
      parts = [hello, line];   // (the name is only written: ケロはかせ does not say it, the phone's voice for it sounded out of place)
    }
    setTimeout(function () {
      if (screen !== 'title') return;
      var p = hakasePos();
      bubble(text, { x: p.x, y: 276, w: 318 });
      speak(parts);
    }, 350);
  }

  function updateTitle(dt) {
    title.syms.forEach(function (s) {
      s.y -= s.vy * dt;
      if (s.y < 30) { s.y = 660 + Math.random() * 60; s.x = 16 + Math.random() * 328; }
    });
    var f = title.crit;
    f.mt += dt;
    if (f.mode === 'happy' && f.mt > 1.2) f.mode = 'idle';
    f.blinkT -= dt;
    if (f.blinkT < 0) { f.blink = true; if (f.blinkT < -0.13) { f.blink = false; f.blinkT = 2 + Math.random() * 3; } }
  }
  function drawTitle(c) {
    worldTransform(c);
    title.syms.forEach(function (s) {
      c.save(); c.globalAlpha = 0.42;
      A.text(c, s.ch, s.x + Math.sin(clock * 0.8 + s.seed) * 8, s.y, s.size, s.col, { lw: s.size * 0.16 });
      c.restore();
    });
    var f = title.crit, p = hakasePos(), partner = ud().chara;
    if (partner !== 'frog') {
      c.save(); c.translate(282, 368); c.scale(0.62, 0.62);
      D.critter(c, { x: 0, y: 0, t: clock + 1.3, kind: partner, look: { x: -200, y: -30 }, mode: f.mode === 'happy' ? 'happy' : 'idle', mt: f.mt, blink: f.blink });
      c.restore();
    }
    D.critter(c, { x: p.x, y: p.y, t: clock, kind: 'frog', look: null, mode: f.mode, mt: f.mt, blink: f.blink, wear: A.hakase });
    drawFx(c);
  }
  function titleTap(p) {
    var h = hakasePos();
    if (Math.abs(p.x - h.x) < 60 && p.y > h.y - 80 && p.y < h.y + 60) {
      title.crit.mode = 'happy'; title.crit.mt = 0;
      S.play('peep');
      var line = pick(DATA.LINES.title);
      bubble(line, { x: h.x, y: 276, w: 300 });
      speak(line);
    }
  }

  // ---------------------------------------------------------------- who plays (family mode)

  function buildWho() {
    var list = $('who-list');
    list.innerHTML = '';
    save.users.forEach(function (u) {
      var b = document.createElement('button');
      b.className = 'btn who-btn';
      b.innerHTML = '<span class="udot" style="background:' + C.COLORS[u.color] + '">' + esc(initial(u)) + '</span>' +
        '<span>' + esc(nameOf(u) || L('なまえなし')) + '</span><small>' + L(u.type === 'adult' ? 'おとな' : 'こども') + '</small>';
      b.addEventListener('click', function () {
        S.play('click'); save.cur = u.id; store();
        if (history.state && history.state.miru) backTo('title'); else go('title');
      });
      list.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- training list

  function bestOf(id) {
    var r = ud().rec[id], best = null;
    if (!r) return null;
    Object.keys(r).forEach(function (lv) {
      if (!best || r[lv].rank > best.rank) best = { rank: r[lv].rank, stars: r[lv].stars };
      else if (r[lv].rank === best.rank) best.stars = Math.max(best.stars, r[lv].stars);
    });
    return best;
  }

  function buildList() {
    var body = $('list-body'), have = C.stampCount(ud()), recs = recommended();
    body.innerHTML = '';
    $('list-stamps').innerHTML = stampImg() + have;
    DATA.CATS.forEach(function (cat) {
      var items = DATA.TRAININGS.filter(function (t) { return t.cat === cat.id && T.byId[t.id]; });
      if (!items.length) return;
      var head = document.createElement('div');
      head.className = 'cat-head'; head.style.setProperty('--c', cat.c1); head.textContent = cat.name;
      if (cat.sub) head.insertAdjacentHTML('beforeend', '<small>' + esc(cat.sub) + '</small>');
      body.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'tr-grid';
      items.forEach(function (info) {
        var tr = T.byId[info.id], open = C.isOpen(save, info.id), b = document.createElement('button');
        b.className = 'tr-card' + (open ? '' : ' locked');
        b.style.setProperty('--c1', cat.c1); b.style.setProperty('--c2', cat.c2);
        b.appendChild(iconCanvas(tr, 84, 'icon'));
        var nm = document.createElement('div');
        nm.className = 'tr-name' + (tr.name.length > 8 ? ' long' : ''); nm.textContent = tr.name;
        b.appendChild(nm);
        var row = document.createElement('div'), best = bestOf(info.id);
        row.className = 'tr-best';
        if (best) { row.appendChild(animalCanvas(best.rank, 34, 24)); row.insertAdjacentHTML('beforeend', stars(best.stars)); }
        b.appendChild(row);
        if (!open) {
          b.insertAdjacentHTML('beforeend', '<div class="tr-lock">' + icon('lock') + '<span>' + L('スタンプ あと {n}こ', { n: info.unlock - have }) + '</span></div>');
        } else if (!ud().seen[info.id]) b.insertAdjacentHTML('beforeend', '<span class="tr-new">' + L('あたらしい') + '</span>');
        else if (recs.indexOf(info.id) >= 0) b.insertAdjacentHTML('beforeend', '<span class="tr-new rec">' + L('おすすめ') + '</span>');
        b.addEventListener('click', function () {
          if (!C.isOpen(save, info.id)) { S.play('ng'); shake(b); speak(L('スタンプを あつめると あそべるよ')); return; }
          S.play('click'); forward(function () { openIntro(tr); });
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);
    });
  }

  // きょうの おすすめ: the two trainings of the weakest eye power in the last check (or the least played ones).
  function recommended() {
    var c = C.lastCheck(save), ids = [];
    if (c && c.ranks.length === DATA.CHECK.length) {
      var worst = 0;
      c.ranks.forEach(function (r, i) { if (r < c.ranks[worst]) worst = i; });
      ids = DATA.CHECK[worst].tests.filter(function (id) { return C.isOpen(save, id); });
    }
    if (!ids.length) {
      var plays = function (id) { var r = ud().rec[id] || {}, n = 0; Object.keys(r).forEach(function (lv) { n += r[lv].plays; }); return n; };
      ids = DATA.TRAININGS.filter(function (t) { return C.isOpen(save, t.id) && ud().seen[t.id]; })
        .map(function (t) { return t.id; }).sort(function (a, b) { return plays(a) - plays(b); });
    }
    return ids.slice(0, 2);
  }

  // ---------------------------------------------------------------- explanation before a training

  var intro = { tr: null, level: 'e', t: 0 };

  function openIntro(tr) {
    if (!tr) { go('list'); return; }
    intro.tr = tr; intro.t = 0;
    var ids = levelsFor().filter(function (l) { return !l.hard || C.hardOpen(save, tr.id, l.id); }).map(function (l) { return l.id; }), last = ud().lv[tr.id];
    intro.level = ids.indexOf(last) >= 0 ? last : (isAdult() ? 'a' : 'e');
    $('intro-name').textContent = tr.name;
    $('intro-help').textContent = tr.help;
    buildLevels();
    var eb = $('intro-endless');
    eb.hidden = !tr.sport;
    if (tr.sport) {
      var best = ud().endless[tr.id] || 0;
      $('intro-endless-label').textContent = best ? L('きろくに ちょうせん（さいこう {n}）', { n: best }) : L('きろくに ちょうせん');
    }
    $('intro-start-label').textContent = L('はじめる');
    show('intro');
    setTimeout(function () { if (screen === 'intro' && intro.tr === tr) speak(tr.help); }, 300);
  }

  function buildLevels() {
    var box = $('intro-levels'), rec = ud().rec[intro.tr.id] || {};
    box.innerHTML = '';
    box.classList.toggle('six', levelsFor().length > 3);   // (grown-ups: the children's row, then the grown-ups' row)
    levelsFor().forEach(function (l) {
      var b = document.createElement('button'), locked = l.hard && !C.hardOpen(save, intro.tr.id, l.id);
      b.className = 'lv-btn' + (l.adult ? ' adult' : '') + (intro.level === l.id ? ' on' : '') + (locked ? ' locked' : '');
      b.innerHTML = '<i class="dots">' + '●●●'.slice(0, l.dots) + '</i>' + (l.adult ? '<small>' + L('おとな') + '</small>' + l.short : l.name);
      if (locked) b.insertAdjacentHTML('beforeend', icon('lock'));
      else if (rec[l.id]) b.appendChild(animalCanvas(rec[l.id].rank, 34, 24));
      else b.insertAdjacentHTML('beforeend', '<span class="noanimal"></span>');
      b.addEventListener('click', function () {
        if (locked) {
          S.play('ng'); shake(b);
          $('intro-note').classList.remove('best');
          $('intro-note').textContent = L('「{level}」は「{from}」で {animal} いじょう か、スタンプ {n}こで あくよ',
            { level: l.name, from: levelName(l.hard), animal: animalName(DATA.HARD_RANK), n: DATA.HARD_STAMPS });
          return;
        }
        S.play('select'); intro.level = l.id; buildLevels();
      });
      box.appendChild(b);
    });
    // under the levels: the best so far at the chosen level (or the practice note the first time)
    var cur = rec[intro.level];
    $('intro-note').textContent = !ud().seen[intro.tr.id] ? DATA.LINES.practice :
      cur ? L('いちばん：{best}', { best: animalName(cur.rank) + paren(resText(cur.bt)) }) : '';
    $('intro-note').classList.toggle('best', !!(cur && ud().seen[intro.tr.id]));
  }

  function drawIntroDemo(dt) {
    intro.t += dt;
    var cv = $('intro-demo'), g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    if (!intro.tr) return;
    if (intro.tr.demo) { intro.tr.demo(g, intro.t, cv.width, cv.height); return; }
    var s = cv.height / 100;
    g.setTransform(s, 0, 0, s, (cv.width - cv.height) / 2, 0);
    intro.tr.icon(g, intro.t);
  }

  // ---------------------------------------------------------------- playing a training

  var run = null;

  function startRun(tr, level, opts) {
    opts = opts || {};
    if (run) stopRun();
    var params = Object.assign({}, tr.levels[level] || tr.levels.n);
    if (opts.practice) Object.assign(params, tr.levels.practice || {}, { practice: true });
    params.adult = isAdultLevel(level);
    if (tr.pool) params.recent = C.recentOf(save, tr.pool);   // (what was shown lately comes last)
    run = {
      tr: tr, level: level, params: params, practice: !!opts.practice, check: opts.check || null, endless: level === 'endless',
      state: 'count', countT: 0, t: 0, session: null, hand: null, done: false
    };
    fx.length = 0; marks.length = 0; words.length = 0;
    $('p-name').innerHTML = '<span class="nm">' + esc(tr.name) + '</span>' + (run.practice ? '<small>' + L('れんしゅう') + '</small>' : '');
    setDots(0, 0);
    clearCtrl();
    $('ctrl').classList.add('wait');
    hidePanel('pause');
    show('play');
    run.session = tr.start(makeApi(run), params) || {};
    requestWake();
    S.play('tick');
  }

  function makeApi(r) {
    function live() { return r === run && !r.done; }
    return {
      W: W, H: H, level: r.level, practice: r.practice, adult: r.params.adult, partner: ud().chara,
      rnd: Math.random, U: T.U,
      used: function (ids) { if (r.tr.pool) { C.addRecent(save, r.tr.pool, ids); store(); } },   // (what this run shows)
      live: live,
      playing: function () { return live() && r.state === 'play'; },
      progress: function (i, n) { if (live()) setDots(i, n); },
      ok: function (x, y, rr) { S.play('ok'); addMark('maru', x, y, rr); },
      ng: function (x, y, rr) { S.play('ng'); addMark('batsu', x, y, rr); vibrate(25); },
      mark: addMark,
      word: addWord,
      burst: function (x, y, n, color, kind) { burst(x, y, kind || 'spark', n || 8, color || '#fff6a8'); },
      ring: ring,
      confetti: confetti,
      sfx: function (name, arg) { S.play(name, arg); },
      piano: function (i, len) { S.piano(i, len); },
      say: function (text, o) { if (!live()) return; if (o !== false) bubble(text, o || { x: W / 2, y: 120, w: 300, below: true, free: true, dur: 2600 }); speak(text); },
      speak: function (text, opts) { if (live()) speak(text, opts); },
      hush: function () { hideBubble(); },
      hand: function (x, y) { r.hand = x == null ? null : { x: x, y: y }; },
      answerPad: function (o) { return makeAnswerPad(r, o); },
      choices: function (items, onTap, o) { return makeChoices(r, items, onTap, o); },
      bigButton: function (label, onDown, o) { return makeBigButton(r, label, onDown, o); },
      clearControls: clearCtrl,
      // A time limit for an answer, as in the original (a bar at the top); when it runs out, fn() counts it as wrong.
      // Never in practice. timer(0) stops it.
      timer: function (sec, fn) { r.timer = sec > 0 && !r.practice && live() ? { left: sec, total: sec, fn: fn } : null; },
      finish: function (res) {
        if (!live()) return;
        r.done = true; r.hand = null; r.timer = null;
        setTimeout(function () { if (r === run) finishRun(res); }, res.delay != null ? res.delay : 650);
      }
    };
  }

  function updateRun(dt) {
    var r = run;
    if (!r || r.state === 'paused') return;
    if (r.countT < 3) {
      var before = r.countT;
      r.countT += dt;
      [0.75, 1.5].forEach(function (m) { if (before < m && r.countT >= m) S.play('tick'); });
      if (r.state === 'count' && r.countT >= 2.25) {
        r.state = 'play';
        S.play('go');
        $('ctrl').classList.remove('wait');
        if (r.session.begin) r.session.begin();
      }
    }
    r.t += dt;
    if (r.session.update) r.session.update(dt, r.state === 'play' && !r.done);
    if (r.timer && r.state === 'play' && !r.done) {
      r.timer.left -= dt;
      if (r.timer.left <= 0) { var fn = r.timer.fn; r.timer = null; fn(); }   // (the training marks it wrong, with the ブブッ)
    }
  }

  function drawRun(c) {
    var r = run, se = r.session;
    drawBackground(se.theme != null ? se.theme : catOf(r.tr.id).theme);
    worldTransform(c);
    if (se.draw) se.draw(c, clock);
    drawFx(c);
    if (r.hand) D.hand(c, r.hand.x, r.hand.y, 1, Math.sin(clock * 8) > 0);
    if (r.timer) drawTimer(c, Math.max(0, r.timer.left / r.timer.total));
    if (r.countT < 2.95) {
      var labels = ['3', '2', '1', L('スタート！')], idx = Math.min(3, Math.floor(r.countT / 0.75)), k = (r.countT - idx * 0.75) / 0.75;
      if (idx < 3) { c.save(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-200, -200, W + 400, H + 400); c.restore(); }
      D.word(c, labels[idx], W / 2, H / 2 - 30, idx === 3 ? 54 : 104, ['#ff8fc0', '#ffb347', '#6cc6ff', '#86d65c'][idx], Math.min(0.74, k));
    }
  }

  // The time left for an answer: a bar under the top buttons, green, then yellow, then red.
  function drawTimer(c, k) {
    D.roundRect(c, 70, 58, 220, 14, 7); D.paint(c, 'rgba(255,255,255,.85)', D.INK, 2.5);
    if (k > 0.01) { D.roundRect(c, 72, 60, 216 * k, 10, 5); D.paint(c, k > 0.5 ? '#86d65c' : k > 0.25 ? '#ffc21a' : '#ff5a5a'); }
  }

  function setDots(i, n) {
    var el = $('p-dots');
    if (!n) { el.innerHTML = ''; return; }
    if (n > 5) { el.innerHTML = '<b>' + Math.min(i, n) + ' / ' + n + '</b>'; return; }
    var h = '';
    for (var k = 0; k < n; k++) h += '<i class="' + (k < i ? 'on' : '') + '"></i>';
    el.innerHTML = h;
  }

  function pauseRun() {
    if (!run || run.state === 'paused' || run.done) return;
    run.prev = run.state; run.state = 'paused';
    showPanel('pause');
    V.stop();
  }
  function resumeRun() {
    if (!run || run.state !== 'paused') return;
    run.state = run.prev || 'play';
    hidePanel('pause');
  }
  // End the session and remove its buttons.
  function stopRun() {
    if (!run) return;
    if (run.session && run.session.end) { try { run.session.end(); } catch (e) { /* ignore */ } }
    run.done = true;
    clearCtrl(); hideBubble(); V.stop();
    hidePanel('pause');
    run = null;
  }
  function quitRun() {
    var r = run;
    stopRun();
    if (r && r.check) { check = null; go('title'); }
    else if (r) openIntro(r.tr);
    else go('title');
  }

  function finishRun(res) {
    var r = run;
    hideBubble();
    if (r.session && r.session.end) { try { r.session.end(); } catch (e) { /* ignore */ } }
    clearCtrl();
    if (r.practice) {
      ud().seen[r.tr.id] = true; store();
      queueOverlay({ kind: 'practice', after: function () { startRun(r.tr, r.level, { check: r.check }); } });
      return;
    }
    ud().seen[r.tr.id] = true;
    if (r.check) { run = null; checkNext(r, res); return; }
    if (r.endless) {
      var eo = C.addEndless(save, r.tr.id, res.score);
      store();
      run = null;
      showEndless(r, res, eo);
      return;
    }
    var out = C.addRun(save, { id: r.tr.id, level: r.level, kind: r.tr.kind, cuts: r.tr.ranks[r.level], score: res.score, acc: res.acc, text: resKeep(res.text) });
    store();
    run = null;
    showResult(r, res, out);
  }

  // --- buttons the trainings put on the screen

  function ctrlAdd(el) { $('ctrl').appendChild(el); return el; }
  function clearCtrl() { $('ctrl').innerHTML = ''; }
  function press(b) { b.classList.add('press'); setTimeout(function () { b.classList.remove('press'); }, 110); }
  function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function tapOk(r) { return r === run && r.state === 'play' && !r.done; }

  /* Number pad. Children tap the answer (0-10). Grown-ups type digits (phone layout);
     the answer is judged as soon as it has as many digits as the right answer (like the original's handwriting).
     o: { top, expect: function () -> the right answer, onAnswer: function (value), show: the digits typed so far
     are shown above the keys (for answers of several digits) } */
  function makeAnswerPad(r, o) {
    var adult = !!r.params.adult, el = document.createElement('div'), btns = {}, bufEl = null;
    var pad = { buf: '', el: el, off: false };
    el.className = 'kpad' + (adult ? ' adult' : '');
    el.style.top = (o.top != null ? o.top : (adult ? 448 : 472)) + 'px';
    function paintBuf() {
      if (!bufEl) return;
      var want = String(o.expect()).length, cells = pad.buf.split('');
      while (cells.length < want) cells.push('–');
      bufEl.textContent = cells.join(' ');
    }
    function key(k) {
      if (!tapOk(r) || pad.off) return;
      if (!adult) { o.onAnswer(k); return; }
      var want = String(o.expect());
      if (k === 'del') { pad.buf = pad.buf.slice(0, -1); S.play('select'); paintBuf(); return; }
      if (pad.buf.length >= Math.max(3, want.length)) return;
      pad.buf += String(k);
      S.play('select');
      paintBuf();
      if (pad.buf.length >= want.length) { var v = parseInt(pad.buf, 10); pad.buf = ''; o.onAnswer(v); }
    }
    function mk(k, cls) {
      var b = document.createElement('button');
      b.className = 'nkey' + (cls ? ' ' + cls : '');
      b.textContent = k === 'del' ? L('けす') : String(k);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(b); key(k); });
      btns[k] = b;
      return b;
    }
    if (adult) {
      if (o.show) { bufEl = document.createElement('div'); bufEl.className = 'kbuf'; el.appendChild(bufEl); }
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (k) { el.appendChild(mk(k)); });
      el.appendChild(mk('del', 'del')); el.appendChild(mk(0)); el.appendChild(document.createElement('span'));
    } else {
      [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10]].forEach(function (keys) {
        var row = document.createElement('div'); row.className = 'krow';
        keys.forEach(function (k) { row.appendChild(mk(k, k === 10 ? 'ten' : '')); });
        el.appendChild(row);
      });
    }
    ctrlAdd(el);
    pad.hint = function (v) { Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('hint', v != null && String(k) === String(v)); }); };
    pad.shake = function (v) { shake(btns[v]); };
    pad.enable = function (on) { pad.off = !on; el.style.opacity = on ? '' : '.5'; pad.buf = ''; paintBuf(); };
    pad.remove = function () { el.remove(); };
    return pad;
  }

  /* A row (or grid) of answer buttons. items: [{ label } | { draw(ctx, w, h) }]
     o: { top, h, cols, gap, left, right } */
  function makeChoices(r, items, onTap, o) {
    o = o || {};
    var el = document.createElement('div');
    var cols = o.cols || items.length, gap = o.gap != null ? o.gap : 10, left = o.left != null ? o.left : 12, right = o.right != null ? o.right : 12;
    var bh = o.h || 110, bw = (W - left - right - gap * (cols - 1)) / cols;
    var ch = { el: el, off: false, btns: [] };
    el.className = 'choices';
    el.style.top = (o.top != null ? o.top : 470) + 'px';
    el.style.left = left + 'px'; el.style.right = right + 'px';
    el.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    el.style.gap = gap + 'px';
    function paintBtn(b, it) {
      b.innerHTML = '';
      if (it.label != null) b.textContent = it.label;
      if (it.draw) {
        var cv = makeCanvas(bw - 6, bh - 6), g = cv.getContext('2d');
        g.scale(2, 2); g.lineJoin = 'round';
        it.draw(g, bw - 6, bh - 6);
        b.appendChild(cv);
      }
    }
    ch.btns = items.map(function (it, i) {
      var b = document.createElement('button');
      b.className = 'cho' + (it.cls ? ' ' + it.cls : '');
      b.style.height = bh + 'px';
      if (it.size) b.style.fontSize = it.size + 'px';
      paintBtn(b, it);
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!tapOk(r) || ch.off) return;
        press(b); onTap(i, b);
      });
      el.appendChild(b);
      return b;
    });
    ctrlAdd(el);
    ch.mark = function (i, cls) { if (ch.btns[i]) ch.btns[i].classList.add(cls); };
    ch.clear = function () { ch.btns.forEach(function (b) { b.classList.remove('ok', 'ng', 'hint', 'dim', 'gone'); }); };
    ch.hint = function (i) { ch.btns.forEach(function (b, j) { b.classList.toggle('hint', j === i); }); };
    ch.shake = function (i) { shake(ch.btns[i]); };
    ch.enable = function (on) { ch.off = !on; };
    ch.set = function (i, it) { paintBtn(ch.btns[i], it); };
    ch.remove = function () { el.remove(); };
    return ch;
  }

  // One big button (the jump button). o: { x, y, w, h, size }
  function makeBigButton(r, label, onDown, o) {
    var b = document.createElement('button');
    b.className = 'bigb';
    b.textContent = label;
    b.style.left = o.x + 'px'; b.style.top = o.y + 'px'; b.style.width = o.w + 'px'; b.style.height = o.h + 'px';
    if (o.size) b.style.fontSize = o.size + 'px';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (!tapOk(r)) return; press(b); onDown(); });
    ctrlAdd(b);
    return { el: b, hint: function (on) { b.classList.toggle('hint', !!on); }, remove: function () { b.remove(); } };
  }

  // ---------------------------------------------------------------- results

  var result = null;

  function showResult(r, res, out) {
    result = { t: 0, rank: out.rank, tr: r.tr, level: r.level, out: out, res: res, shown: false, overlays: false, starT: [] };
    $('r-name').textContent = r.tr.name + paren(levelName(r.level));
    $('r-title').textContent = '';
    document.querySelectorAll('#r-stars i').forEach(function (i) { i.classList.remove('got'); });
    $('r-stars').hidden = false;
    $('r-detail').textContent = resText(res.text);
    $('r-badge').textContent = '';
    $('r-say').textContent = '';
    $('r-next-label').textContent = L('リストへ');
    show('result');
    S.play('drum');
  }

  function showEndless(r, res, eo) {
    result = { t: 0, rank: 0, tr: r.tr, level: r.level, out: null, res: res, endless: eo, shown: false, overlays: true, starT: [] };
    $('r-name').textContent = r.tr.name + paren(levelName('endless'));
    $('r-title').textContent = '';
    document.querySelectorAll('#r-stars i').forEach(function (i) { i.classList.remove('got'); });
    $('r-stars').hidden = true;
    $('r-detail').textContent = L('いちばん：{n}かい', { n: eo.best });
    $('r-badge').textContent = '';
    $('r-say').textContent = '';
    $('r-next-label').textContent = L('リストへ');
    show('result');
    S.play('drum');
  }

  function updateResult(dt) {
    var R = result;
    if (!R) return;
    R.t += dt;
    if (!R.shown && R.t >= 1.15 && R.endless) {
      R.shown = true;
      var n = R.res.score, eo = R.endless, who0 = nameOf(me());
      $('r-title').textContent = L('{n}かい！', { n: n });
      $('r-title').classList.remove('long');
      S.play(eo.newBest ? 'fanfare' : 'win');
      $('r-badge').textContent = eo.newBest ? L('しんきろく！') : '';
      var line = eo.newBest ? DATA.LINES.record : n >= 10 ? pick(DATA.LINES.good) : pick(DATA.LINES.soso);
      $('r-say').textContent = L('ケロはかせ「{t}」', { t: nameHead(who0) + line });
      speak(line);
      confetti(eo.newBest ? 60 : 20);
    }
    if (!R.shown && R.t >= 1.15) {
      R.shown = true;
      var name = animalName(R.rank), el = $('r-title');
      el.textContent = L('{animal}！', { animal: name });
      el.classList.toggle('long', name.length > 4);
      S.play('fanfare');
      var who = nameOf(me());
      var core = R.out.newBest ? pick(DATA.LINES.best) : R.out.firstPlay ? pick(DATA.LINES.first1) : R.rank >= 4 ? pick(DATA.LINES.good) : pick(DATA.LINES.soso);
      $('r-badge').textContent = R.out.newBest ? L('じこベスト！') : '';
      $('r-say').textContent = L('ケロはかせ「{t}」', { t: nameHead(who) + core });
      speak([L('{animal}！', { animal: name }), core]);
      confetti(R.rank >= 5 ? 60 : 24);
      var got = document.querySelectorAll('#r-stars i');
      for (var i = 0; i < R.out.stars; i++) {
        (function (k) { setTimeout(function () { if (result === R) { got[k].classList.add('got'); S.play('star', k); } }, 350 + k * 260); }(i));
      }
    }
    // the stamp and other cards come once ケロはかせ has finished what he says (at most ~10 s)
    if (R.shown && !R.overlays && R.t >= 2.9 && (quietFor(0.4) || R.t >= 12)) { R.overlays = true; queueGains(R.out, true); }
  }

  function drawResult(c) {
    var R = result;
    worldTransform(c);
    c.save();
    D.ellipse(c, 180, 268, 150, 18); D.paint(c, 'rgba(255,255,255,.55)');
    c.restore();
    if (R && R.endless && R.t >= 1.15) {
      // the sport's own little picture, bouncing
      var bounce = Math.abs(Math.sin((R.t - 1.15) * 4)) * 10;
      c.save(); c.translate(130, 150 - bounce); c.scale(1.0, 1.0);
      if (R.tr.icon) R.tr.icon(c, clock);
      c.restore();
    } else if (R && R.t >= 1.15) {
      var k = Math.min(1, (R.t - 1.15) / 0.7), x = -90 + 270 * easeOut(k);
      var hopY = k >= 1 ? -Math.abs(Math.sin((R.t - 1.85) * 5)) * 8 : 0;
      A.animal(c, R.rank, x, 262 + hopY, 1.3, clock, { run: k < 1 || R.rank >= 5 });
    } else if (R) {
      var wob = Math.sin(R.t * 18) * 5;
      A.text(c, L('？'), 180, 190 + wob, 96, '#fff', { lw: 16 });
    }
    var happy = R && R.shown;
    c.save(); c.translate(56, 226); c.scale(0.52, 0.52);
    D.critter(c, { x: 0, y: 0, t: clock, kind: ud().chara, look: { x: 240, y: 20 }, mode: happy ? 'happy' : 'idle', mt: R ? R.t : 0 });
    c.restore();
    drawFx(c);
  }

  // Stamps, new trainings and new songs earned, one card after another.
  function queueGains(out, fromRun) {
    if (out.stampNew) queueOverlay({ kind: 'stamp', n: out.stamps });
    out.opened.trainings.forEach(function (id) { if (trOf(id)) queueOverlay({ kind: 'training', id: id }); });
    var mine = levelsFor().map(function (l) { return l.id; });
    var hard = (out.opened.hard || []).filter(function (o) { return trOf(o.id) && C.isOpen(save, o.id) && mine.indexOf(o.lv) >= 0; });
    if (hard.length > 2) queueOverlay({ kind: 'hardAll' });
    else hard.forEach(function (o) { queueOverlay({ kind: 'hard', id: o.id, lv: o.lv }); });
    if (fromRun && save.stopAfter && out.runsToday >= save.stopAfter) {
      var day = ud().days[C.dayKey()];
      if (day && !day.nudged) { day.nudged = true; store(); queueOverlay({ kind: 'nudge' }); }
    }
  }

  // ---------------------------------------------------------------- cards shown over a screen (stamp, unlocks, practice done)

  var ovQueue = [], ov = null;
  function queueOverlay(o) { ovQueue.push(o); if (!ov) nextOverlay(); }
  function nextOverlay() {
    ov = ovQueue.shift() || null;
    hidePanel('overlay'); hidePanel('nudge');
    if (!ov) return;
    ov.t = 0;
    if (ov.kind === 'nudge') { showPanel('nudge'); S.play('soft'); speak(DATA.LINES.enough); return; }
    var title = '', text = '', ok = L('やったね！');
    if (ov.kind === 'stamp') {
      title = L(ov.n % 5 === 0 ? 'はなまる スタンプ！' : 'スタンプ ゲット！');
      text = L('スタンプ {n}こめ！', { n: ov.n });
      setTimeout(function () { S.play('stamp'); vibrate(40); }, 380);
      speak(title);   // (the number is on the card)
    } else if (ov.kind === 'training') {
      title = L('あたらしい トレーニング！');
      text = L('「{name}」で あそべるよ', { name: trOf(ov.id).name });
      S.play('unlock'); speak([DATA.LINES.newTraining, trOf(ov.id).name]);
    } else if (ov.kind === 'hard' || ov.kind === 'hardAll') {
      title = L('「むずかしい」が あそべるよ！');
      text = ov.kind === 'hard' ? L('「{name}」で「{level}」が えらべるよ', { name: trOf(ov.id).name, level: levelName(ov.lv) }) : L('ぜんぶの トレーニングで「むずかしい」が えらべるよ');
      S.play('unlock'); speak(DATA.LINES.newHard);
    } else if (ov.kind === 'tip') {
      title = L('めの まめちしき No.{n}', { n: ov.n + 1 });
      text = DATA.TIPS[ov.n];
      ok = L('わかった！');
      S.play('peep'); speak([DATA.LINES.tip, DATA.TIPS[ov.n]]);
    } else if (ov.kind === 'practice') {
      title = L('じょうず！');
      text = L('こんどは ほんとうに やってみよう！');   // (the button starts the real run)
      ok = L('はじめる');
      S.play('win'); speak(DATA.LINES.practiceDone);
    }
    $('ov-title').textContent = title;
    $('ov-text').textContent = text;
    $('overlay').classList.toggle('is-tip', ov.kind === 'tip');   // (not 'tip': that is the speech bubble)
    $('ov-ok-label').textContent = ok;
    showPanel('overlay');
  }
  function closeOverlay() {
    var o = ov;
    S.play('click');
    ov = null;
    hidePanel('overlay'); hidePanel('nudge');
    if (o && o.after) o.after();
    nextOverlay();
  }

  function drawOverlayCanvas(dt) {
    if (!ov) return;
    ov.t += dt;
    var t = ov.t;
    if (ov.kind === 'nudge') {
      var nc = $('nudge-canvas'), ng = nc.getContext('2d');
      ng.setTransform(1, 0, 0, 1, 0, 0); ng.clearRect(0, 0, nc.width, nc.height);
      ng.setTransform(1, 0, 0, 1, 150, 128);
      D.critter(ng, { x: 0, y: 0, t: clock, kind: 'frog', look: null, mode: 'happy', mt: t % 1.6, wear: A.hakase });
      return;
    }
    var cv = $('ov-canvas'), g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(2, 0, 0, 2, 0, 0);   // 260 x 150 units
    if (ov.kind === 'stamp') {
      g.save(); g.translate(130, 76); g.rotate(-0.05);
      D.roundRect(g, -64, -64, 128, 128, 16); D.paint(g, '#fffdf5', D.INK, 3);
      g.restore();
      if (t > 0.38) {
        var k = Math.min(1, (t - 0.38) / 0.22), s = k < 1 ? 2.2 - 1.3 * k : 0.9 + 0.1 * Math.min(1, (t - 0.6) / 0.15);
        A.stamp(g, 130, 76, 52 * s, ov.n % 5 === 0 ? 'hana' : 'kero', Math.min(1, k * 1.5));
      } else {
        // the stamp coming down
        g.save(); g.translate(130, 76 - 60 + t * 110);
        D.roundRect(g, -18, -44, 36, 30, 8); D.paint(g, '#c98e57', D.INK, 3);
        D.roundRect(g, -30, -16, 60, 18, 6); D.paint(g, '#e5484d', D.INK, 3);
        g.restore();
      }
    } else if (ov.kind === 'tip') {
      g.save(); g.translate(96, 96); g.scale(0.62, 0.62);
      D.critter(g, { x: 0, y: 0, t: clock, kind: 'frog', look: { x: 200, y: -60 }, mode: 'idle', mt: t, wear: A.hakase });
      g.restore();
      // a big eye with a sparkle
      g.save(); g.translate(186, 64);
      D.ellipse(g, 0, 0, 44, 28); D.paint(g, '#fffdf5', D.INK, 3);
      var look = Math.sin(t * 1.6) * 10;
      D.circle(g, look, 0, 18); D.paint(g, '#6cc6ff', D.INK, 2.5);
      D.circle(g, look, 0, 9); D.paint(g, '#2e1d14');
      D.circle(g, look - 5, -6, 4); D.paint(g, '#fff');
      g.restore();
      D.sparkle(g, 232, 30, 8 + Math.sin(t * 5) * 2, '#ffd23d');
    } else if (ov.kind === 'training' || ov.kind === 'hard' || ov.kind === 'hardAll') {
      var tr = trOf(ov.id || 'shuffle');
      g.save(); g.translate(130 - 60, 16);
      var bob = Math.sin(t * 3) * 3;
      g.translate(0, bob); g.scale(1.2, 1.2);
      if (tr && tr.icon) tr.icon(g, t);
      g.restore();
      for (var i = 0; i < 5; i++) {
        var q = t * 1.5 + i * 1.26;
        D.sparkle(g, 130 + Math.cos(q) * 105, 76 + Math.sin(q) * 60, 6 + 3 * Math.sin(t * 5 + i), i % 2 ? '#ffd23d' : '#ff9fc9');
      }
    } else if (ov.kind === 'practice') {
      g.save(); g.translate(130, 88); g.scale(0.9, 0.9);
      D.critter(g, { x: 0, y: 0, t: clock, kind: 'frog', look: null, mode: 'happy', mt: t % 1.4, wear: A.hakase });
      g.restore();
    }
  }

  // Shows today's eye fact first when there is one (then fn), as the original does before the first training.
  function withTip(fn) {
    var i = C.tipToday(save);
    if (i < 0) { fn(); return; }
    C.tipSeen(save); store();
    queueOverlay({ kind: 'tip', n: i, after: fn });
  }

  // ---------------------------------------------------------------- the daily eye check (5 tests)

  var check = null;

  function startCheck() {
    // one test for each eye power: one of its two trainings, from those already open
    var tests = DATA.CHECK.map(function (c) {
      var have = c.tests.filter(function (id) { return !!trOf(id); });
      var open = have.filter(function (id) { return C.isOpen(save, id); });
      return (open.length ? pick(open) : have.length ? pick(have) : null);
    });
    if (tests.some(function (t) { return !t; })) { go('title'); return; }
    check = { tests: tests, i: 0, ranks: [], stage: 'intro', recorded: !C.checkedToday(save), t: 0, out: null };
    renderCheck();
    show('check');
    speak(L(check.recorded ? 'きょうの めチェック！ 5つの テストを するよ' : 'きょうは もう チェック したよ。 れんしゅうで やってみよう'));
  }

  var CHECK_C1 = ['#ffdcae', '#c2e8ff', '#ffcde2', '#ccf1bb', '#e3d4ff'], CHECK_COLORS = ['#ffb347', '#6cc6ff', '#ff8fc0', '#86d65c', '#b58cff'];
  function testRows() {
    return check.tests.map(function (id, i) {
      var tr = trOf(id), cat = DATA.CHECK[i];
      var cls = i < check.i ? ' done' : i === check.i && check.stage !== 'intro' ? ' now' : '';
      return '<div class="ck-test' + cls + '" data-i="' + i + '"><span class="tag" style="--c:' + CHECK_C1[i] + '">' + cat.name + '</span>' +
        '<span class="ck-icon"></span>' + esc(tr.name) + (i < check.i ? '<span class="ok">○</span>' : '') + '</div>';
    }).join('');
  }
  function fillTestIcons(card) {
    card.querySelectorAll('.ck-test').forEach(function (row) {
      var i = +row.getAttribute('data-i'), holder = row.querySelector('.ck-icon');
      holder.replaceWith(iconCanvas(trOf(check.tests[i]), 50));
    });
  }

  function renderCheck() {
    var card = $('check-card');
    card.classList.remove('result');
    if (check.stage === 'intro') {
      card.innerHTML = '<div class="ck-title">' + L('きょうの めチェック') + '</div>' +
        '<p class="ck-text">' + L(check.recorded ? '5つの テストで\nきょうの めを しらべるよ！' : 'きょうは もう チェック したよ。\nれんしゅうで やってみよう！') + '</p>' +
        '<div class="ck-tests">' + testRows() + '</div>' +
        '<div class="ck-row"><button id="ck-practice" class="btn practice-btn">' + L('れんしゅう') + '</button><button id="ck-go" class="btn big"><span data-icon="next"></span>' + L('はじめる') + '</button></div>';
    } else {
      var next = trOf(check.tests[check.i]);
      card.innerHTML = '<div class="ck-title">' + L('よく できました！') + '</div>' +
        '<p class="ck-text">' + L('つぎは「{name}」だよ', { name: esc(next.name) }) + '</p>' +
        '<div class="ck-tests">' + testRows() + '</div>' +
        '<div class="ck-row"><button id="ck-practice" class="btn practice-btn">' + L('れんしゅう') + '</button><button id="ck-go" class="btn big"><span data-icon="next"></span>' + L('つぎへ') + '</button></div>';
    }
    fillTestIcons(card);
    setIcons(card);
    $('ck-go').addEventListener('click', function () { S.play('click'); checkStartTest(); });
    $('ck-practice').addEventListener('click', function () { S.play('click'); checkStartTest(true); });   // (the next test, with hints)
  }

  function checkStartTest(practice) {
    var tr = trOf(check.tests[check.i]), level = isAdult() ? 'testA' : 'test';
    var go1 = function () { startRun(tr, level, { check: check, practice: !!practice }); };
    if (check.i === 0) withTip(go1); else go1();
  }

  function checkNext(r, res) {
    if (check !== r.check) return;
    check.ranks.push(C.rankOf(r.tr.kind, r.tr.ranks[r.level], res.score));
    check.i++;
    if (check.i < check.tests.length) {
      check.stage = 'between';
      renderCheck(); show('check');
      S.play('soft');
      speak(L('よく できました！ つぎは {name}', { name: trOf(check.tests[check.i]).name }));
      return;
    }
    check.out = C.addCheck(save, { ranks: check.ranks, tests: check.tests });
    store();
    check.stage = 'result'; check.t = 0; check.shown = false; check.overlays = false;
    renderCheckResult();
    show('check');
    S.play('drum');
  }

  function renderCheckResult() {
    var card = $('check-card'), out = check.out;
    card.classList.add('result');
    var bars = DATA.CHECK.map(function (c, i) {
      var cells = '';
      for (var k = 1; k <= 7; k++) cells += '<i class="' + (k <= check.ranks[i] ? 'on' : '') + '"></i>';
      return '<div class="ck-bar"><span>' + c.name + '</span><div class="cells" style="--c:' + CHECK_COLORS[i] + '">' + cells + '</div></div>';
    }).join('');
    var head = out.age != null ?
      '<div class="ck-big">' + L('めねんれい <b>{age}</b> さい', { age: out.age }) + '</div>' :
      '<div class="ck-big">' + L('きょうの めは<br><b>{animal}</b>', { animal: animalName(out.rank) }) + '</div>';
    card.innerHTML = '<div id="ck-head" class="r-hide">' + head + '</div>' +
      '<div id="ck-bars" class="ck-bars r-hide">' + bars + '</div>' +
      '<p id="ck-say" class="ck-text r-hide"></p>' +
      '<div class="ck-row"><button id="ck-end" class="btn">' + L('おわる') + '</button><button id="ck-train" class="btn big"><span data-icon="next"></span>' + L('トレーニング') + '</button></div>';
    setIcons(card);
    $('ck-end').addEventListener('click', function () { S.play('click'); check = null; backTo('title'); });
    $('ck-train').addEventListener('click', function () { S.play('click'); check = null; navTarget = 'list'; history.back(); });
  }

  function updateCheck(dt) {
    if (!check || check.stage !== 'result') return;
    check.t += dt;
    if (!check.shown && check.t >= 1.15) {
      check.shown = true;
      ['ck-head', 'ck-bars', 'ck-say'].forEach(function (id) { $(id).classList.remove('r-hide'); });
      var best = 0;
      check.ranks.forEach(function (r, i) { if (r > check.ranks[best]) best = i; });
      var allSame = check.ranks.every(function (r) { return r === check.ranks[0]; });
      var who = nameOf(me());
      var core = allSame ? (check.ranks[0] >= 5 ? 'ぜんぶ すごいね！' : 'まいにち やると ぐんぐん のびるよ') : DATA.CHECK[best].good;
      if (allSame) core = L(core);   // (DATA's lines are already in the chosen language)
      var line = nameHead(who) + core;
      if (!check.out.recorded) line += L('\n（れんしゅう なので きろくは しないよ）');
      $('ck-say').textContent = L('ケロはかせ「{t}」', { t: line });
      S.play('fanfare');
      confetti(40);
      var what = check.out.age != null ? L('めねんれいは {age}さい！', { age: check.out.age }) : L('きょうの めは {animal}！', { animal: animalName(check.out.rank) });
      speak([what, core]);
    }
    if (check.shown && !check.overlays && check.t >= 2.9 && (quietFor(0.4) || check.t >= 12)) { check.overlays = true; queueGains(check.out, false); }
  }

  function drawCheck(c) {
    worldTransform(c);
    if (!check) return;
    if (check.stage === 'result') {
      D.ellipse(c, 180, 232, 150, 16); D.paint(c, 'rgba(255,255,255,.55)');
      if (check.t >= 1.15) {
        var k = Math.min(1, (check.t - 1.15) / 0.7);
        A.animal(c, check.out.rank, -90 + 270 * easeOut(k), 228, 1.05, clock, { run: k < 1 });
      } else A.text(c, L('？'), 180, 170 + Math.sin(check.t * 18) * 5, 90, '#fff', { lw: 15 });
    }
    drawFx(c);
  }

  // ---------------------------------------------------------------- stamp calendar

  var cal = { month: null };
  function buildStamps() {
    var now = new Date(), u = ud();
    if (!cal.month) cal.month = new Date(now.getFullYear(), now.getMonth(), 1);
    var y = cal.month.getFullYear(), m = cal.month.getMonth();
    $('cal-month').textContent = L('{y}ねん {m}がつ', { y: y, m: m + 1, mon: MONTHS[m] });
    var days = C.stampDays(u), byDay = {};
    days.forEach(function (d) { byDay[d.day] = d; });
    var grid = $('cal-grid'), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(), today = C.dayKey();
    grid.innerHTML = '';
    for (var i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<div class="cal-day empty"></div>');
    for (var d = 1; d <= n; d++) {
      var key = C.dayKey(new Date(y, m, d)), st = byDay[key];
      grid.insertAdjacentHTML('beforeend', '<div class="cal-day' + (key === today ? ' today' : '') + '"><span class="n">' + d + '</span>' +
        (st ? '<img src="' + (st.big ? STAMP_IMG.hana : STAMP_IMG.kero) + '" alt="">' : '') + '</div>');
    }
    $('stamps-count').innerHTML = stampImg() + days.length;
    $('cal-next').style.visibility = (y === now.getFullYear() && m === now.getMonth()) ? 'hidden' : 'visible';
    var box = $('stamps-next'), nu = C.nextUnlock(save);
    box.innerHTML = '';
    if (nu) {
      var tr = trOf(nu.training);
      box.appendChild(iconCanvas(tr, 58));
      box.insertAdjacentHTML('beforeend', '<div>' + L('あと <b>{n}こ</b> で<br>「{name}」が ふえるよ！', { n: nu.need, name: esc(tr.name) }) + '</div>');
    } else {
      box.insertAdjacentHTML('beforeend', '<div>' + L('ぜんぶ あいたよ！ まいにち つづけて<br>はなまるを あつめよう！') + '</div>');
    }
  }

  // ---------------------------------------------------------------- records and graphs

  function buildRecords() {
    var body = $('records-body');
    body.innerHTML = '';
    var card = document.createElement('div');
    card.className = 'rec-card';
    card.innerHTML = '<h3>' + L('めチェック') + '</h3>';
    var cv = makeCanvas(314, 150, 'chart');
    card.appendChild(cv);
    body.appendChild(card);
    drawCheckChart(cv);
    DATA.TRAININGS.forEach(function (info) {
      var tr = trOf(info.id);
      if (!tr) return;
      var cat = catOf(info.id), open = C.isOpen(save, info.id), rec = ud().rec[info.id] || {};
      var b = document.createElement('button');
      b.className = 'rec-row' + (open ? '' : ' locked');
      b.style.setProperty('--c1', cat.c1); b.style.setProperty('--c2', cat.c2);
      b.appendChild(iconCanvas(tr, 50, 'icon'));
      var tx = document.createElement('div');
      tx.innerHTML = '<div class="rn">' + esc(tr.name) + '</div><div class="chips"></div>';
      var chips = tx.querySelector('.chips');
      levelsFor().forEach(function (l) {
        if (!rec[l.id]) return;
        var chip = document.createElement('span');
        chip.className = 'lv-chip';
        chip.appendChild(animalCanvas(rec[l.id].rank, 28, 20));
        chip.insertAdjacentHTML('beforeend', l.name);
        chips.appendChild(chip);
      });
      if (!chips.children.length) chips.insertAdjacentHTML('beforeend', '<span class="lv-chip" style="padding:2px 8px">' + L('まだ だよ') + '</span>');
      b.appendChild(tx);
      b.addEventListener('click', function () {
        if (!Object.keys(rec).length) { S.play('ng'); shake(b); return; }
        S.play('click'); openGraph(tr);
      });
      body.appendChild(b);
    });
    var sports = DATA.TRAININGS.filter(function (t) { return trOf(t.id) && trOf(t.id).sport; });
    var card2 = document.createElement('div');
    card2.className = 'rec-card';
    card2.innerHTML = '<h3>' + L('きろくに ちょうせん') + '</h3><div class="endless-list">' + sports.map(function (t) {
      var n = ud().endless[t.id] || 0;
      return '<div class="endless-row"><span>' + esc(trOf(t.id).name) + '</span><b>' + (n ? L('{n}かい', { n: n }) : '—') + '</b></div>';
    }).join('') + '</div>';
    body.appendChild(card2);
  }

  function chartFrame(g, w, h) {
    g.fillStyle = 'rgba(255,255,255,.7)';
    D.roundRect(g, 0, 0, w, h, 12); g.fill();
  }
  function shortDay(k) { var p = k.split('-'); return (+p[1]) + '/' + (+p[2]); }

  function drawCheckChart(cv) {
    var g = cv.getContext('2d'), w = cv.width / 2, h = cv.height / 2;
    g.setTransform(2, 0, 0, 2, 0, 0);
    chartFrame(g, w, h);
    var u = ud(), days = Object.keys(u.days).filter(function (k) { return u.days[k].check; }).sort().slice(-10);
    if (!days.length) { A.text(g, L('まだ きろくが ないよ'), w / 2, h / 2, 16, D.INK, { stroke: false }); return; }
    var adult = isAdult(), x0 = 30, x1 = w - 12, y0 = adult ? 16 : 36, y1 = h - 28, n = days.length;
    var step = (x1 - x0) / Math.max(1, n);
    g.strokeStyle = 'rgba(90,56,37,.15)'; g.lineWidth = 1;
    for (var k = 0; k <= 3; k++) { var yy = y0 + (y1 - y0) * k / 3; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke(); }
    days.forEach(function (d, i) {
      var c = u.days[d].check, x = x0 + step * (i + 0.5);
      A.text(g, shortDay(d), x, h - 13, 10, D.INK, { stroke: false });
      if (adult && c.age != null) {
        var ya = y0 + (y1 - y0) * (c.age - 20) / 60;
        if (i) {
          var pc = u.days[days[i - 1]].check;
          if (pc.age != null) { g.beginPath(); g.moveTo(x - step, y0 + (y1 - y0) * (pc.age - 20) / 60); g.lineTo(x, ya); g.strokeStyle = '#ff8fc0'; g.lineWidth = 3; g.stroke(); }
        }
        D.circle(g, x, ya, 5); D.paint(g, '#ff8fc0', D.INK, 2);
        A.text(g, String(c.age), x, ya - 11, 11, D.INK, { stroke: false });
      } else {
        var bh = (y1 - y0) * c.rank / 7, bw = Math.min(22, step * 0.6);
        D.roundRect(g, x - bw / 2, y1 - bh, bw, bh, 5); D.paint(g, ['#ffd0a0', '#ffc27a', '#ffb347', '#9ad8ff', '#6cc6ff', '#ff9fc9', '#ff6fa8'][c.rank - 1], D.INK, 2);
      }
    });
    if (adult) { A.text(g, '20', 14, y0 + 2, 10, D.INK, { stroke: false }); A.text(g, '80', 14, y1, 10, D.INK, { stroke: false }); }
    else {
      var last = u.days[days[n - 1]].check;
      A.animal(g, last.rank, x0 + step * (n - 0.5), y1 - (y1 - y0) * last.rank / 7 - 2, 0.2, 0, {});
    }
  }

  var graph = { tr: null, level: 'e' };
  function openGraph(tr) {
    graph.tr = tr;
    var rec = ud().rec[tr.id] || {}, ids = levelsFor().map(function (l) { return l.id; }).filter(function (id) { return rec[id]; });
    graph.level = ids.indexOf(ud().lv[tr.id]) >= 0 ? ud().lv[tr.id] : ids[0];
    renderGraph();
    showPanel('graph');
  }
  function renderGraph() {
    var tr = graph.tr, rec = ud().rec[tr.id] || {}, x = rec[graph.level];
    $('graph-title').textContent = tr.name;
    var box = $('graph-levels');
    box.innerHTML = '';
    levelsFor().forEach(function (l) {
      if (!rec[l.id]) return;
      var b = document.createElement('button');
      b.textContent = l.name;
      b.className = graph.level === l.id ? 'on' : '';
      b.addEventListener('click', function () { S.play('select'); graph.level = l.id; renderGraph(); });
      box.appendChild(b);
    });
    var cv = $('graph-canvas'), g = cv.getContext('2d'), w = 280, h = 190;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(2, 0, 0, 2, 0, 0);
    chartFrame(g, w, h);
    if (!x) return;
    var hist = x.hist.slice(-10), x0 = 12, x1 = w - 12, y0 = 30, y1 = h - 26, step = (x1 - x0) / Math.max(1, hist.length);
    hist.forEach(function (hh, i) {
      var cx = x0 + step * (i + 0.5), bh = (y1 - y0) * hh[2] / 7, bw = Math.min(20, step * 0.6);
      D.roundRect(g, cx - bw / 2, y1 - bh, bw, bh, 5);
      D.paint(g, ['#ffd0a0', '#ffc27a', '#ffb347', '#9ad8ff', '#6cc6ff', '#ff9fc9', '#ff6fa8'][hh[2] - 1], D.INK, 2);
      A.text(g, shortDay(hh[0]), cx, h - 13, 10, D.INK, { stroke: false });
      if (i === hist.length - 1) A.animal(g, hh[2], cx, y1 - bh - 2, 0.2, 0, {});
    });
    $('graph-note').textContent = L('いちばん いい きろく：{best}', { best: animalName(x.rank) + paren(resText(x.bt)) }) + '\n' + L('あそんだ かず：{n}かい', { n: x.plays });
  }

  // ---------------------------------------------------------------- めの ストレッチ (the eye stretch, about a minute, no score)

  var stretch = null;
  function startStretch() {
    stretch = { i: -1, t: 0, w: 0, go: false, done: false };
    $('st-end').hidden = true;
    show('stretch');
    requestWake();
    nextStretch();
  }
  function nextStretch() {
    var st = stretch;
    if (!st) return;
    st.i++; st.t = 0; st.w = 0; st.go = false;
    if (st.i >= DATA.STRETCH.length) { st.done = true; st.i = DATA.STRETCH.length - 1; $('st-end').hidden = false; return; }
    var step = DATA.STRETCH[st.i];
    $('st-text').textContent = step[0];
    speak(step[0]);
    if (step[2] === 'end') { confetti(40); S.play('fanfare'); } else S.play(st.i ? 'soft' : 'go');
    var h = '';
    for (var k = 0; k < DATA.STRETCH.length; k++) h += '<i class="' + (k <= st.i ? 'on' : '') + '"></i>';
    $('st-dots').innerHTML = h;
  }
  // Each step: first ケロはかせ says what to do (the star waits), then the exercise runs for its own time.
  function updateStretch(dt) {
    var st = stretch;
    if (!st || st.done) return;
    st.w += dt;
    if (!st.go) {
      if ((st.w >= 0.8 && quietFor(0.3)) || st.w >= 15) st.go = true;
      return;
    }
    st.t += dt;
    if (st.t >= DATA.STRETCH[st.i][1]) nextStretch();
  }
  // where the star is (for the eyes to follow), and ケロはかせ's eyes
  function stretchPose(kind, t) {
    var cx = 180, cy = 318, o = { star: null, size: 16, eyes: 'open' };
    var wave = function (period) { return Math.sin(t * Math.PI * 2 / period); };
    if (kind === 'intro' || kind === 'end') o.star = { x: cx, y: cy };
    else if (kind === 'updown') o.star = { x: cx, y: cy + wave(2.6) * 135 };
    else if (kind === 'leftright') o.star = { x: cx + wave(2.6) * 140, y: cy };
    else if (kind === 'diagonal') { var d = wave(2.6); o.star = Math.floor(t / 2.6) % 2 ? { x: cx + d * 120, y: cy + d * 120 } : { x: cx - d * 120, y: cy + d * 120 }; }
    else if (kind === 'circle') { var a = (t < 3.5 ? 1 : -1) * t * Math.PI * 2 / 3.4; o.star = { x: cx + Math.cos(a) * 130, y: cy + Math.sin(a) * 128 }; }
    else if (kind === 'nearfar') { var z = (1 - Math.cos(t * Math.PI * 2 / 3.4)) / 2; o.star = { x: cx, y: cy }; o.size = 8 + z * 64; }
    else if (kind === 'blink') o.eyes = (t % 2.4) < 1.3 ? 'shut' : 'open';
    else if (kind === 'palm') o.eyes = 'palm';
    return o;
  }
  function drawStretch(c) {
    worldTransform(c);
    var st = stretch;
    if (!st) return;
    var step = DATA.STRETCH[st.i], o = stretchPose(step[2], st.t);
    if (o.star) {
      D.circle(c, o.star.x, o.star.y, o.size * 1.7); D.paint(c, 'rgba(255,255,255,.35)');
      D.sparkle(c, o.star.x, o.star.y, o.size, '#ffd23d');
    }
    var kx = 180, ky = 590;
    c.save(); c.translate(kx, ky); c.scale(1.05, 1.05);
    D.critter(c, { x: 0, y: 0, t: clock, kind: 'frog', look: o.star ? { x: o.star.x - kx, y: o.star.y - (ky - 60) } : null,
      mode: step[2] === 'end' ? 'happy' : 'idle', mt: st.t, blink: o.eyes !== 'open', wear: A.hakase });
    if (o.eyes === 'palm') {
      // warm hands over the eyes
      [-1, 1].forEach(function (sd) { D.ellipse(c, sd * 21, -26, 22, 17, sd * 0.3); D.paint(c, '#ffd8b5', D.INK, 3); });
      D.circle(c, 0, -26, 58); D.paint(c, 'rgba(255,190,120,.18)');
    }
    c.restore();
    drawFx(c);
  }

  function buildTips() {
    var box = $('tips-body'), u = ud();
    box.innerHTML = '';
    $('tips-count').textContent = u.tipN + ' / ' + DATA.TIPS.length;
    DATA.TIPS.forEach(function (t, i) {
      var seen = i < u.tipN, el = document.createElement('button');
      el.className = 'tip-row' + (seen ? '' : ' locked');
      el.innerHTML = '<b>' + (i + 1) + '</b><span>' + (seen ? esc(t) : L('まだ ひみつ')) + '</span>';
      el.addEventListener('click', function () { if (seen) { S.play('click'); speak(t); } else { S.play('ng'); shake(el); } });
      box.appendChild(el);
    });
    if (!u.tipN) box.insertAdjacentHTML('afterbegin', '<p class="tips-note">' + L('トレーニングを すると、1日に 1つ まめちしきが ふえるよ') + '</p>');
  }

  // ---------------------------------------------------------------- shop (same as the other games)

  var CHARAS = [
    { id: 'frog', name: 'ケロちゃん', price: 0 },
    { id: 'rabbit', name: 'ミミちゃん', price: 10 },
    { id: 'cat', name: 'ニャーちゃん', price: 20 },
    { id: 'dog', name: 'ワンちゃん', price: 30 }
  ];
  var SHOP_NOTE = L('★を つかって おともだちを ふやそう！');
  var shop = { t: 0, cards: [] }, buying = null, noteTimer = null;
  function owns(id) { return ud().owned.indexOf(id) >= 0; }
  function wallet() { return C.wallet(ud()); }

  function drawPreview(cv, kind, t, extra) {
    var g = cv.getContext('2d'), k = cv.width / 240 * 1.05;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(k, 0, 0, k, cv.width / 2 - 180 * k, cv.height * 0.6 - 150 * k);
    D.critter(g, Object.assign({ x: 180, y: 150, t: t, kind: kind, look: null, blink: (t % 3.3) < 0.13, mode: 'idle' }, extra || {}));
  }
  function buildShop() {
    var grid = $('shop-grid');
    grid.innerHTML = '';
    shop.cards = [];
    $('shop-wallet').innerHTML = icon('star') + '<span>' + wallet() + '</span>';
    CHARAS.forEach(function (ch) {
      var mine = owns(ch.id), using = ud().chara === ch.id, card = document.createElement('div');
      card.className = 'chara-card' + (using ? ' using' : '');
      var cv = document.createElement('canvas');
      cv.width = 240; cv.height = 240; cv.className = 'chara-canvas';
      card.appendChild(cv);
      var nm = document.createElement('div');
      nm.className = 'chara-name'; nm.textContent = L(ch.name);
      card.appendChild(nm);
      var b = document.createElement('button');
      if (using) { b.className = 'btn chara-btn using'; b.textContent = L('つかってる'); }
      else if (mine) { b.className = 'btn chara-btn'; b.textContent = L('えらぶ'); }
      else {
        var can = wallet() >= ch.price;
        b.className = 'btn chara-btn buy' + (can ? '' : ' short');
        b.innerHTML = can ? L('{star}{price} で かう', { star: icon('star'), price: ch.price }) : icon('star') + ch.price;
      }
      b.addEventListener('click', function () { choose(ch, card); });
      card.appendChild(b);
      grid.appendChild(card);
      shop.cards.push({ id: ch.id, canvas: cv, happyT: -9 });
    });
  }
  function choose(ch, card) {
    var u = ud();
    if (u.chara === ch.id) { S.play('click'); cheer(ch.id); return; }
    if (owns(ch.id)) { S.play('click'); u.chara = ch.id; store(); buildShop(); cheer(ch.id); return; }
    if (wallet() < ch.price) { S.play('ng'); shake(card); showShopNote(L('あと ★{n} で かえるよ', { n: ch.price - wallet() })); return; }
    S.play('click');
    buying = ch;
    $('buy-text').innerHTML = L('{name}を<br>{star}{price} で かう？', { name: L(ch.name), star: icon('star'), price: ch.price });
    showPanel('buy');
  }
  function confirmBuy() {
    var ch = buying, u = ud();
    hidePanel('buy'); buying = null;
    if (!ch || owns(ch.id) || wallet() < ch.price) return;
    u.spent += ch.price;
    u.owned.push(ch.id);
    u.chara = ch.id;
    store();
    S.play('fanfare'); vibrate(40);
    buildShop(); cheer(ch.id);
    confetti(60);
    showShopNote(L('{name}が なかまに なったよ！', { name: L(ch.name) }));
    speak(L('{name}が なかまに なったよ！', { name: L(ch.name) }));
  }
  function cheer(id) { shop.cards.forEach(function (c) { if (c.id === id) c.happyT = shop.t; }); }
  function updateShop(dt) {
    shop.t += dt;
    shop.cards.forEach(function (c, i) {
      var since = shop.t - c.happyT;
      drawPreview(c.canvas, c.id, shop.t + i * 0.9, since < 1.4 ? { mode: 'happy', mt: since } : null);
    });
    if (buying) drawPreview($('buy-canvas'), buying.id, shop.t);
  }
  function showShopNote(text) {
    var el = $('shop-note');
    el.textContent = text;
    el.classList.add('flash');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { el.textContent = SHOP_NOTE; el.classList.remove('flash'); }, 2600);
  }

  // ---------------------------------------------------------------- grown-ups: password, settings, users

  var ADMIN_PASS = '123', typed = '';
  function openPass() { typed = ''; drawDots(); showPanel('pass'); }
  function drawDots() {
    var h = '';
    for (var i = 0; i < Math.max(3, typed.length); i++) h += '<i class="' + (i < typed.length ? 'on' : '') + '"></i>';
    $('pass-dots').innerHTML = h;
  }
  function pressKey(k) {
    if (k === 'del') typed = typed.slice(0, -1);
    else if (k === 'ok') {
      if (typed === ADMIN_PASS) { hidePanel('pass'); S.play('click'); openAdmin(); return; }
      S.play('ng'); shake($('pass-card')); typed = '';
    } else if (typed.length < 6) { typed += k; S.play('click'); }
    drawDots();
  }
  var resetArmed = false;
  function openAdmin() {
    var u = me(), d = ud();
    resetArmed = false;
    $('p-info').innerHTML = L('いまの ユーザー：{name}（{type}）<br>スタンプ {s}　あつめた★ {a}　つかった★ {b}', {
      name: esc(nameOf(u) || L('なまえなし')), type: L(u.type === 'adult' ? 'おとな' : 'こども'), s: C.stampCount(d), a: C.starsEarned(d), b: d.spent });
    $('p-all').textContent = L('全トレーニング解放：{v}', { v: L(save.all ? 'オン' : 'オフ') });
    $('p-all').classList.toggle('active', !!save.all);
    $('p-stop').textContent = L('おしまいの声かけ：{v}', { v: save.stopAfter ? L('{n}つで', { n: save.stopAfter }) : L('しない') });
    $('p-reset').textContent = L('このユーザーの記録をリセット');
    // (Japanese: recorded clips, the phone reads only the names; the other languages: the phone reads everything)
    var nv = V.phoneVoice(), quiet = L('パソコンでの確認中は 音も声も出しません（アドレスに ?sound=1 を付けると出ます）。');
    $('p-voice').textContent = Lang.cur === 'ja' ?
      (V.credit ? L('ケロはかせの こえ：{credit}。', { credit: V.credit }) : '') +
      (V.quiet ? quiet :
        nv === 'ok' ? 'なまえの読み上げ：日本語の声が見つかりました。' :
        nv === 'none' ? 'なまえの読み上げ：日本語の声が見つかりません。Android の「設定 → システム → 言語と入力 → テキスト読み上げ」で日本語の音声データを入れると、なまえも よびます。' :
        'なまえの読み上げ：このブラウザでは使えません。') :
      (V.credit ? L('日本語の こえ：{credit}。', { credit: V.credit }) : '') +
      (V.quiet ? quiet :
        nv === 'ok' ? L('この ことばの こえ：スマホの 読み上げの 声が 見つかりました。') :
        nv === 'none' ? L('この ことばの こえ：スマホに 声が 見つかりません。Android の「設定 → システム → 言語と入力 → テキスト読み上げ」で この ことばの 音声データを 入れると しゃべります。') :
        L('この ことばの こえ：このブラウザでは 使えません。'));
    showPanel('parent');
  }

  var editing = null, delArmed = false;
  function buildUsers() {
    var list = $('users-list');
    list.innerHTML = '';
    save.users.forEach(function (u) {
      var row = document.createElement('div');
      row.className = 'urow' + (u.id === save.cur ? ' cur' : '');
      row.innerHTML = '<span class="udot" style="background:' + C.COLORS[u.color] + '">' + esc(initial(u)) + '</span>' +
        '<span class="uname">' + esc(nameOf(u) || L('なまえなし')) + '</span><span class="utype">' + L(u.type === 'adult' ? 'おとな' : 'こども') + '</span>';
      var b = document.createElement('button');
      b.className = 'btn'; b.textContent = L('へんしゅう');
      b.addEventListener('click', function () { S.play('click'); openEdit(u); });
      row.appendChild(b);
      list.appendChild(row);
    });
    $('users-add').hidden = save.users.length >= C.MAX_USERS;
  }
  function openEdit(u) {
    delArmed = false;
    var used = save.users.map(function (x) { return x.color; }), free = 0;
    while (used.indexOf(free) >= 0 && free < C.COLORS.length - 1) free++;
    editing = u ? { id: u.id, name: u.name, type: u.type, color: u.color } : { id: null, name: '', type: 'kid', color: free };
    $('ue-name').value = editing.name;
    $('ue-del').hidden = !u || save.users.length <= 1;
    $('ue-del').textContent = L('けす');
    renderEdit();
    hidePanel('users');
    showPanel('uedit');
  }
  function renderEdit() {
    document.querySelectorAll('#ue-type button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === editing.type); });
    var sw = $('ue-color');
    sw.innerHTML = '';
    C.COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.style.background = c;
      b.className = editing.color === i ? 'on' : '';
      b.addEventListener('click', function () { editing.color = i; renderEdit(); });
      sw.appendChild(b);
    });
  }
  function saveEdit() {
    var name = $('ue-name').value.trim().slice(0, C.NAME_MAX);
    if (editing.id) {
      save.users.forEach(function (u) { if (u.id === editing.id) { u.name = name; u.type = editing.type; u.color = editing.color; } });
    } else {
      var u = C.addUser(save, name, editing.type);
      if (u) u.color = editing.color;
    }
    store();
    hidePanel('uedit');
    buildUsers(); showPanel('users');
    refreshTitle();
  }

  // ---------------------------------------------------------------- panels

  function showPanel(id) { $(id).classList.add('on'); }
  function hidePanel(id) { $(id).classList.remove('on'); }

  // ---------------------------------------------------------------- wake lock (screen stays on while playing)

  var wake = null;
  function requestWake() {
    if (wake || !navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) { wake = l; l.addEventListener('release', function () { wake = null; }); }).catch(function () {});
  }
  function releaseWake() { if (wake) { wake.release().catch(function () {}); wake = null; } }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (screen === 'play' && run && run.state === 'play') pauseRun();
      S.suspend(); V.stop();
    } else {
      S.resume();
      if (screen === 'play' || screen === 'stretch') requestWake();
    }
  });

  // ---------------------------------------------------------------- input

  window.addEventListener('pointerdown', function () {
    S.init(); V.prime();
    if (save.music && !QUIET[screen]) S.startMusic();
  }, true);

  canvas.addEventListener('pointerdown', function (e) {
    var p = toWorld(e);
    if (screen === 'play' && run && run.state === 'play' && !run.done && run.session.down) { e.preventDefault(); run.session.down(p, e.pointerId); }
    else if (screen === 'title') titleTap(p);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (screen === 'play' && run && run.state === 'play' && !run.done && run.session.move) run.session.move(toWorld(e), e.pointerId);
  });
  function endPointer(e) {
    if (screen === 'play' && run && run.session && run.session.up) run.session.up(toWorld(e), e.pointerId);
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------------------------------------------------------------- icons

  var ICONS = {
    home: '<path d="M4 11.5 12 4.5l8 7V20h-5.5v-5.5h-5V20H4z"/>',
    retry: '<path d="M19 12.5a7 7 0 1 1-2.3-5.2"/><path d="M17.5 3v4.8h-4.8"/>',
    back: '<path d="M14.5 5 7.5 12l7 7"/>',
    fwd: '<path d="M9.5 5l7 7-7 7"/>',
    next: '<path d="M8 5l10 7-10 7z" fill="currentColor"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    sfx: '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z" fill="currentColor"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    sfxOff: '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    music: '<path d="M9 17.5V6.5l10-2v11"/><circle cx="6.8" cy="17.5" r="2.4" fill="currentColor"/><circle cx="16.8" cy="15.5" r="2.4" fill="currentColor"/>',
    musicOff: '<path d="M9 17.5V6.5l10-2v11"/><circle cx="6.8" cy="17.5" r="2.4" fill="currentColor"/><circle cx="16.8" cy="15.5" r="2.4" fill="currentColor"/><path d="M4 4l16 16"/>',
    voice: '<path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z" fill="currentColor" fill-opacity=".18"/><path d="M8 9.5h8M8 12.5h5"/>',
    voiceOff: '<path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z" fill="currentColor" fill-opacity=".18"/><path d="M3.5 3.5l17 17"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>',
    star: '<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill="currentColor" stroke-linejoin="round"/>',
    install: '<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19h14"/>',
    shop: '<path d="M5.5 8.5h13l-1.2 11.5H6.7z" fill="currentColor" fill-opacity=".25"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/>',
    check: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5" fill="currentColor" fill-opacity=".18"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    eye: '<path d="M2.5 12s3.6-6.3 9.5-6.3 9.5 6.3 9.5 6.3-3.6 6.3-9.5 6.3S2.5 12 2.5 12z" fill="currentColor" fill-opacity=".18"/><circle cx="12" cy="12" r="3.3" fill="currentColor"/>',
    target: '<path d="M18.4 16A7.5 7.5 0 1 1 18.4 8" stroke-width="4.2"/>',
    stretch: '<path d="M4.6 11a7.5 7.5 0 0 1 13.1-4.4"/><path d="M18.3 2.8v4.4h-4.4"/><path d="M19.4 13a7.5 7.5 0 0 1-13.1 4.4"/><path d="M5.7 21.2v-4.4h4.4"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/>',
    bulb: '<path d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1 1.4 1 2.2v1h5.2v-1c0-.8.3-1.6 1-2.2A6 6 0 0 0 12 3.5z" fill="currentColor" fill-opacity=".2"/><path d="M9.8 20.5h4.4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="currentColor" fill-opacity=".3"/>',
    stamp: '<path d="M9.5 11V8.3a2.5 2.5 0 1 1 5 0V11"/><rect x="5" y="11" width="14" height="5.5" rx="1.6" fill="currentColor" fill-opacity=".25"/><path d="M4.5 20h15"/>',
    chart: '<path d="M5 20V12.5M10 20V7M15 20v-6M20 20V9.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function setIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon')); });
  }

  // ---------------------------------------------------------------- wiring

  function refreshToggles() {
    $('btn-sfx').innerHTML = icon(save.sfx ? 'sfx' : 'sfxOff');
    $('btn-music').innerHTML = icon(save.music ? 'music' : 'musicOff');
    $('btn-voice').innerHTML = icon(save.voice ? 'voice' : 'voiceOff');
    $('btn-sfx').classList.toggle('off', !save.sfx);
    $('btn-music').classList.toggle('off', !save.music);
    $('btn-voice').classList.toggle('off', !save.voice);
  }

  function wire() {
    setIcons();
    document.querySelectorAll('#r-stars i').forEach(function (el) { el.innerHTML = icon('star'); });
    S.set('sfx', save.sfx); S.set('music', save.music); V.set(save.voice);

    $('btn-land').addEventListener('click', toLand);
    $('btn-check').addEventListener('click', function () { S.play('click'); forward(function () { go('check'); }); });
    $('btn-train').addEventListener('click', function () { S.play('click'); forward(function () { go('list'); }); });
    $('btn-stamps').addEventListener('click', function () { S.play('click'); forward(function () { go('stamps'); }); });
    $('btn-records').addEventListener('click', function () { S.play('click'); forward(function () { go('records'); }); });
    $('btn-shop').addEventListener('click', function () { S.play('click'); forward(function () { go('shop'); }); });
    $('btn-stretch').addEventListener('click', function () { S.play('click'); forward(function () { go('stretch'); }); });
    $('btn-tips').addEventListener('click', function () { S.play('click'); forward(function () { go('tips'); }); });
    $('st-end').addEventListener('click', back);
    $('btn-user').addEventListener('click', function () { if (save.users.length < 2) return; S.play('click'); forward(function () { go('who'); }); });
    $('btn-sfx').addEventListener('click', function () { save.sfx = !save.sfx; S.set('sfx', save.sfx); store(); refreshToggles(); S.play('click'); });
    $('btn-music').addEventListener('click', function () {
      save.music = !save.music; S.set('music', save.music); store(); refreshToggles();
      if (save.music) S.startMusic(); else S.stopMusic();
    });
    $('btn-voice').addEventListener('click', function () {
      save.voice = !save.voice; V.set(save.voice); store(); refreshToggles(); S.play('click');
      if (save.voice) speak(L('ケロはかせが しゃべるよ！'));
    });

    ['list-back', 'intro-back', 'stamps-back', 'records-back', 'shop-back', 'check-back', 'stretch-back', 'tips-back'].forEach(function (id) { $(id).addEventListener('click', back); });
    $('intro-start').addEventListener('click', function () {
      var tr = intro.tr;
      S.play('click');
      ud().lv[tr.id] = intro.level; store();
      withTip(function () { forward(function () { startRun(tr, intro.level, {}); }); });
    });
    // practice (with hints, not recorded) can be tried any time; it is never forced
    $('intro-practice').addEventListener('click', function () {
      var tr = intro.tr;
      S.play('click');
      ud().lv[tr.id] = intro.level; store();
      withTip(function () { forward(function () { startRun(tr, intro.level, { practice: true }); }); });
    });
    $('intro-endless').addEventListener('click', function () {
      var tr = intro.tr;
      S.play('click');
      withTip(function () { forward(function () { startRun(tr, 'endless', {}); }); });
    });
    $('p-quit').addEventListener('click', function () { S.play('click'); pauseRun(); });
    $('pause-go').addEventListener('click', function () { S.play('click'); resumeRun(); });
    $('pause-quit').addEventListener('click', function () { S.play('click'); history.back(); });
    $('r-again').addEventListener('click', function () { S.play('click'); if (result) startRun(result.tr, result.level, {}); });
    $('r-next').addEventListener('click', function () { S.play('click'); backTo('list', 2); });
    $('ov-ok').addEventListener('click', closeOverlay);
    $('nudge-more').addEventListener('click', closeOverlay);
    $('nudge-end').addEventListener('click', function () { ovQueue.length = 0; closeOverlay(); backTo('title', screen === 'result' ? 3 : 1); });
    $('tip').addEventListener('click', hideBubble);

    $('cal-prev').addEventListener('click', function () { S.play('select'); cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() - 1, 1); buildStamps(); });
    $('cal-next').addEventListener('click', function () { S.play('select'); cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() + 1, 1); buildStamps(); });
    $('graph-close').addEventListener('click', function () { S.play('click'); hidePanel('graph'); });

    $('buy-yes').addEventListener('click', confirmBuy);
    $('buy-no').addEventListener('click', function () { S.play('click'); buying = null; hidePanel('buy'); });

    $('btn-admin').addEventListener('click', function () { S.play('click'); openPass(); });
    document.querySelectorAll('#pass .key').forEach(function (k) { k.addEventListener('click', function () { pressKey(k.getAttribute('data-k')); }); });
    $('pass-close').addEventListener('click', function () { hidePanel('pass'); });
    $('p-all').addEventListener('click', function () { save.all = !save.all; store(); openAdmin(); });
    $('p-stop').addEventListener('click', function () { save.stopAfter = save.stopAfter === 3 ? 5 : save.stopAfter === 5 ? 0 : 3; store(); openAdmin(); });
    $('p-reset').addEventListener('click', function () {
      if (!resetArmed) { resetArmed = true; $('p-reset').textContent = L('もう一度押すと消えます'); return; }
      C.resetUser(save, save.cur); store(); openAdmin(); refreshTitle();
    });
    $('p-close').addEventListener('click', function () { hidePanel('parent'); refreshTitle(); });
    $('p-users').addEventListener('click', function () { S.play('click'); hidePanel('parent'); buildUsers(); showPanel('users'); });
    $('users-add').addEventListener('click', function () { S.play('click'); openEdit(null); });
    $('users-close').addEventListener('click', function () { hidePanel('users'); refreshTitle(); });
    document.querySelectorAll('#ue-type button').forEach(function (b) { b.addEventListener('click', function () { editing.type = b.getAttribute('data-v'); renderEdit(); }); });
    $('ue-ok').addEventListener('click', function () { S.play('click'); saveEdit(); });
    $('ue-del').addEventListener('click', function () {
      if (!delArmed) { delArmed = true; $('ue-del').textContent = L('もう一度で けす'); return; }
      C.removeUser(save, editing.id); store();
      hidePanel('uedit'); buildUsers(); showPanel('users'); refreshTitle();
    });

    // "add to home screen" when the browser offers it
    var installEvt = null;
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; $('btn-install').hidden = false; });
    $('btn-install').addEventListener('click', function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () { installEvt = null; $('btn-install').hidden = true; });
    });
    window.addEventListener('appinstalled', function () { $('btn-install').hidden = true; });
  }

  // Back to ケロちゃん ランド, the menu at the top of the site.
  function toLand() {
    S.play('click');
    var fromLand = false;
    try {
      var ref = new URL(document.referrer);
      fromLand = ref.origin === location.origin && ref.pathname === new URL('../', location.href).pathname;
    } catch (e) { /* no referrer */ }
    setTimeout(function () {
      if (fromLand && history.length > 1 && !(history.state && history.state.miru)) history.back();
      else location.href = '../';
    }, 120);
  }

  // ---------------------------------------------------------------- main loop

  var lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    step(dt);
  }
  function step(dt) {
    clock += dt;
    hush = V.busy() ? 0 : hush + dt;
    updateFx(dt);
    if (screen === 'play' && run) { updateRun(dt); if (run) drawRun(ctx); }
    else if (screen === 'title') { updateTitle(dt); drawBackground(4); drawTitle(ctx); }
    else if (screen === 'result') { updateResult(dt); drawBackground(4); drawResult(ctx); }
    else if (screen === 'check') { updateCheck(dt); drawBackground(2); drawCheck(ctx); }
    else if (screen === 'intro') { drawBackground(intro.tr ? catOf(intro.tr.id).theme : 0); drawIntroDemo(dt); }
    else if (screen === 'shop') { updateShop(dt); drawBackground(1); worldTransform(ctx); drawFx(ctx); }
    else if (screen === 'stretch') { updateStretch(dt); drawBackground(4); drawStretch(ctx); }
    else drawBackground(screen === 'stamps' ? 5 : screen === 'records' ? 4 : screen === 'tips' ? 3 : 0);
    if (ov) drawOverlayCanvas(dt);
  }

  window.addEventListener('resize', resize);
  resize();
  // the chosen language: the title logo, the days of the week and the fixed text of the page
  Lang.logo(document.querySelector('#title .logo'), Lang.pick(GAME_LOGO), ['#86d65c', '#ff8fc0', '#ffb347', '#6cc6ff', '#b58cff', '#6cc6ff', '#ff8fc0', '#86d65c', '#ffb347']);
  if (Lang.cur !== 'ja') document.querySelectorAll('.cal-week span').forEach(function (el, i) { el.textContent = MIRU_WEEK[Lang.cur][i]; });
  Lang.apply();
  document.body.classList.add('lang-' + Lang.cur);   // (longer words in the other languages: see style.css)
  makeStampImages();
  wire();
  history.replaceState({ root: 1 }, '');
  if (save.users.length > 1) { go('who'); } else go('title');
  requestAnimationFrame(frame);

  // Offline play and updates. sw.js keeps the game on the phone. A new version is looked for whenever
  // the game is opened or comes back to the front; once it is stored (the new sw.js takes over at once),
  // the page reloads itself as soon as the title screen is showing, so the phone never keeps an old version.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var swReg = null, swHad = !!navigator.serviceWorker.controller, swNew = false;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { swReg = r; }).catch(function () {});
    var swCheck = function () { if (swReg && !document.hidden) swReg.update().catch(function () {}); };
    document.addEventListener('visibilitychange', swCheck);
    window.addEventListener('pageshow', function (e) { if (e.persisted) swCheck(); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (swHad) swNew = true;   // (not the first time the game is stored)
      swHad = true;
    });
    setInterval(function () {
      if (swNew && !document.hidden && (screen === 'title' || screen === 'who') && !document.querySelector('.panel.on')) { swNew = false; location.reload(); }
    }, 700);
  }

  // for playtesting from the browser console. tick(seconds) moves the game on by itself
  // (useful when the page is in a hidden window, where the browser stops the animation).
  window.MIRU = {
    get save() { return save; }, store: store, get run() { return run; }, startRun: startRun, T: T, C: C,
    go: go, openIntro: openIntro, get screen() { return screen; }, get stretch() { return stretch; },
    tick: function (sec) { for (var i = 0, n = Math.round(sec * 30); i < n; i++) step(1 / 30); return screen; },
    tap: function (x, y) { if (run && run.state === 'play' && !run.done && run.session.down) run.session.down({ x: x, y: y }, 1); }
  };
}());
