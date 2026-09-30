/* ぱっと すうじ (the original: 瞬間数字, 瞬間視) — a number shows for a blink, somewhere on the screen.
   What was it? Children pick it from four; grown-ups type it.
   おに: two numbers show at the same time, one in the top half and one in the bottom half; tell the top one,
   then the bottom one (the half asked now has a yellow frame, and the grown-ups' pad says うえ / した).
   A number never comes twice in a run. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 70, y0: 150, x1: 290, y1: 370 };
  var HALVES = [{ y0: 158, y1: 222 }, { y0: 300, y1: 364 }];   // (おに: where the top and the bottom number show)

  function digits(r, n) {
    var s = String(U.int(r, 1, 9));
    while (s.length < n) s += String(U.int(r, 0, 9));
    return s;
  }
  // Numbers that look like the right one: one digit changed, or two digits swapped.
  function lookalikes(r, s, k) {
    var out = [], tries = 0;
    while (out.length < k && tries++ < 200) {
      var a = s.split(''), i = U.int(r, 0, a.length - 1);
      if (a.length > 1 && r() < 0.35) { var j = (i + 1) % a.length; var t = a[i]; a[i] = a[j]; a[j] = t; }
      else { var d = (+a[i] + U.pick(r, [1, 2, 3, 7, 8, 9])) % 10; if (i === 0 && d === 0) d = 1; a[i] = String(d); }
      var v = a.join('');
      if (v !== s && out.indexOf(v) < 0 && v.charAt(0) !== '0') out.push(v);
    }
    while (out.length < k) out.push(String(+s + out.length + 1));
    return out;
  }
  // One number to remember: { n, x, y, opts (four to pick from), ans (the right one of opts) }; used: the numbers of
  // the run so far (not again)
  function one(p, r, box, used) {
    var s = digits(r, p.len);
    for (var t = 0; t < 60 && used.indexOf(s) >= 0; t++) s = digits(r, p.len);
    used.push(s);
    var opts = U.shuffle(r, [s].concat(lookalikes(r, s, 3)));
    return { n: s, x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: box.y0 + r() * (box.y1 - box.y0), opts: opts, ans: opts.indexOf(s) };
  }

  // p: { rounds, len (digits), show (s) }; おに: pair (two numbers a round: { pair: [top, bottom] })
  function gen(p, r) {
    var out = [], used = [];
    for (var i = 0; i < p.rounds; i++) {
      if (p.pair) { var top = one(p, r, HALVES[0], used); out.push({ pair: [top, one(p, r, HALVES[1], used)] }); }
      else out.push(one(p, r, BOX, used));
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, qi = 0, said = [], ch = null, pad = null;
    var total = rounds.length * (p.pair ? 2 : 1);
    function Q() { return R.pair ? R.pair[qi] : R; }   // (the number asked now)
    if (p.adult) {
      pad = api.answerPad({ top: 390, show: true, expect: function () { return R ? +Q().n : 0; }, onAnswer: function (v) { answer(String(v)); },
        label: function () { return R && R.pair ? L(qi ? 'した' : 'うえ') : ''; } });   // (おに: which of the two to type)
      pad.enable(false);
    }

    function startRound() {
      ri++;
      api.hand(null);
      if (ch) { ch.remove(); ch = null; }
      if (ri >= rounds.length) {
        phase = 'end'; if (pad) pad.remove();
        api.finish({ score: right, acc: right / total, text: U.res.right(right, total) });
        return;
      }
      R = rounds[ri]; qi = 0; said = [];
      phase = 'ready'; pt = 0;
      if (pad) pad.enable(false);
      api.progress(ri, rounds.length);
    }
    function ask() {
      phase = 'ask'; pt = 0;
      api.timer(p.limit, timeUp);
      if (ch) { ch.remove(); ch = null; }
      if (R.pair && qi) api.sfx('hop');   // (now the bottom one)
      if (pad) { pad.enable(true); return; }
      var q = Q();
      ch = api.choices(q.opts.map(function (s) { return { label: s, size: s.length > 2 ? 34 : 42 }; }), function (i) { answer(q.opts[i], i); },
        { top: 452, h: 78, cols: 2, gap: 12, left: 30, right: 30 });
    }
    // where the ○ or × of an answer goes
    function spot() { return R.pair ? { x: 180, y: qi ? 332 : 190 } : { x: 180, y: 270 }; }
    function timeUp() {   // (no answer in time)
      if (phase !== 'ask') return;
      var sp = spot();
      api.ng(sp.x, sp.y, 46);
      if (ch) { ch.mark(Q().ans, 'hint'); ch.enable(false); }
      if (pad) { pad.enable(false); pad.hint(null); }
      said[qi] = false;
      after(false);
    }
    function answer(v, i) {
      if (phase !== 'ask') return;
      api.timer(0);
      var q = Q(), good = v === q.n, sp = spot();
      if (good) { right++; api.ok(sp.x, sp.y, 56); if (ch) ch.mark(i, 'ok'); }
      else { api.ng(sp.x, sp.y, 46); if (ch) { ch.mark(i, 'ng'); ch.mark(q.ans, 'hint'); } }
      if (ch) ch.enable(false);
      if (pad) { pad.enable(false); pad.hint(null); }
      said[qi] = good;
      after(good);
    }
    // after an answer: the bottom number is asked next (おに), or the round ends
    function after(good) {
      if (R.pair && qi === 0) { phase = 'between'; pt = 0; return; }
      phase = R.pair ? (said[0] && said[1] ? 'good' : 'bad') : good ? 'good' : 'bad'; pt = 0;
      api.progress(ri + 1, rounds.length);
    }

    return {
      theme: 0,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'ready' && pt > 0.9) { phase = 'flash'; pt = 0; api.sfx('pop'); }
        else if (phase === 'flash' && pt > p.show) ask();
        else if (phase === 'between' && pt > (said[0] ? 0.55 : 1.2)) { qi = 1; ask(); }
        else if (phase === 'ask' && p.practice && pt > 2.5) { if (ch) ch.hint(Q().ans); else if (pad && Q().n.length === 1) pad.hint(+Q().n); }
        else if ((phase === 'good' && pt > 1.0) || (phase === 'bad' && pt > 1.8)) startRound();
      },
      draw: function (c, clock) {
        if (!R) return;
        D.roundRect(c, BOX.x0 - 50, BOX.y0 - 50, BOX.x1 - BOX.x0 + 100, BOX.y1 - BOX.y0 + (pad ? 80 : 100), 24); D.paint(c, 'rgba(255,255,255,.4)');
        var size = function (n) { return n.length > 4 ? 40 : n.length > 3 ? 46 : 56; };
        if (R.pair) {   // (おに: a line between the halves)
          c.save(); c.setLineDash([8, 8]); c.beginPath(); c.moveTo(40, 262); c.lineTo(320, 262); D.paint(c, null, 'rgba(255,255,255,.7)', 3); c.restore();
        }
        if (phase === 'ready') {
          A.text(c, L(R.pair ? 'すうじが 2つ ぱっと でるよ' : 'すうじが ぱっと でるよ'), 180, 110, 22, '#fff', { lw: 6 });
          // a little star to look at
          D.sparkle(c, 180, R.pair ? 262 : 270, 12 + Math.sin(pt * 10) * 2, '#ffd23d');
        } else if (phase === 'flash') {
          (R.pair || [R]).forEach(function (q) { A.text(c, q.n, q.x, q.y, size(q.n), '#fff', { lw: 9 }); });
        } else if (phase === 'ask' || phase === 'between') {
          if (!R.pair) {
            A.text(c, L('なんだった？'), 180, 110, 24, '#fff', { lw: 7 });
            A.text(c, L('？'), 180, 270, 70, '#fff', { lw: 12 });
          } else {
            A.text(c, L(qi === 0 ? 'うえの すうじは？' : 'したの すうじは？'), 180, 110, 24, '#fff', { lw: 7 });
            if (phase === 'between') { var t0 = R.pair[0]; A.text(c, t0.n, t0.x, t0.y, size(t0.n), said[0] ? '#ff8fc0' : '#6cc6ff', { lw: 8 }); }
            else {   // (the half asked now, in a yellow frame; the top one's answer is not left there when the bottom one is asked)
              var hy = qi ? 332 : 190;
              D.roundRect(c, 34, hy - 56, 292, 112, 18); D.paint(c, 'rgba(255,244,176,.5)', '#ffd23d', 5);
              A.text(c, L('？'), 180, hy, 60, '#fff', { lw: 11 });
            }
          }
        } else if (phase === 'good' || phase === 'bad') {
          (R.pair || [R]).forEach(function (q, k) {
            var ok = R.pair ? said[k] : phase === 'good';
            A.text(c, q.n, q.x, q.y, q.n.length > 4 ? 40 : 44, ok ? '#ff8fc0' : '#6cc6ff', { lw: 8 });
          });
        }
      },
      peek: function () {   // for playtesting: the right answer
        if (phase !== 'ask') return null;
        return pad ? { pad: +Q().n } : { cho: Q().ans };
      },
      end: function () { if (pad) pad.remove(); if (ch) ch.remove(); }
    };
  }

  T.register({
    id: 'flashnum', name: 'ぱっと すうじ', orig: '瞬間数字', kind: 'count',
    help: 'すうじが いっしゅんだけ でるよ。\nなんの すうじ だったか こたえてね！',
    oniHelp: 'すうじが うえと したに 2つ でるよ。\nうえ、したの じゅんに こたえてね！',
    levels: {
      e: { rounds: 6, len: 1, show: 0.8, limit: 8 },
      n: { rounds: 6, len: 2, show: 0.6, limit: 7 },
      h: { rounds: 6, len: 3, show: 0.45, limit: 6 },
      o: { rounds: 6, len: 2, show: 0.6, pair: true, limit: 7 },
      ae: { rounds: 6, len: 3, show: 0.4, limit: 7 },
      a: { rounds: 6, len: 4, show: 0.32, limit: 7 },
      ah: { rounds: 6, len: 5, show: 0.3, limit: 8 },
      ao: { rounds: 6, len: 4, show: 0.45, pair: true, limit: 8 },
      test: { rounds: 5, len: 2, show: 0.5, limit: 7 },
      testA: { rounds: 5, len: 4, show: 0.3, limit: 7 },
      practice: { rounds: 2, len: 1, show: 1.2 },
      practiceO: { rounds: 2, len: 1, show: 1.2, pair: true }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], o: [12, 11, 9, 7, 5, 3],
      ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1], ao: [12, 11, 9, 7, 5, 3],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, on = Math.sin((t || 0) * 3) > -0.2;
      D.roundRect(c, 10, 14, 80, 72, 16); D.paint(c, 'rgba(255,255,255,.7)', D.INK, 2.4);
      if (on) A.text(c, '37', 52, 50, 34, '#ffb347', { lw: 6 }); else D.sparkle(c, 50, 50, 9, '#ffd23d');
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
