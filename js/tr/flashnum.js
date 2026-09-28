/* ぱっと すうじ (the original: 瞬間数字, 瞬間視) — a number shows for a blink, somewhere on the screen.
   What was it? Children pick it from four; grown-ups type it. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 70, y0: 150, x1: 290, y1: 370 };

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

  // p: { rounds, len (digits), show (s) }
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var s = digits(r, p.len);
      var opts = U.shuffle(r, [s].concat(lookalikes(r, s, 3)));
      out.push({ n: s, x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: BOX.y0 + r() * (BOX.y1 - BOX.y0), opts: opts, ans: opts.indexOf(s) });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, ch = null, pad = null;
    if (p.adult) { pad = api.answerPad({ top: 390, show: true, expect: function () { return R ? +R.n : 0; }, onAnswer: function (v) { answer(String(v)); } }); pad.enable(false); }

    function startRound() {
      ri++;
      api.hand(null);
      if (ch) { ch.remove(); ch = null; }
      if (ri >= rounds.length) {
        phase = 'end'; if (pad) pad.remove();
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri];
      phase = 'ready'; pt = 0;
      if (pad) pad.enable(false);
      api.progress(ri, rounds.length);
    }
    function ask() {
      phase = 'ask'; pt = 0;
      if (pad) { pad.enable(true); return; }
      ch = api.choices(R.opts.map(function (s) { return { label: s, size: s.length > 2 ? 34 : 42 }; }), function (i) { answer(R.opts[i], i); },
        { top: 452, h: 78, cols: 2, gap: 12, left: 30, right: 30 });
    }
    function answer(v, i) {
      if (phase !== 'ask') return;
      var good = v === R.n;
      if (good) { right++; api.ok(180, 270, 56); if (ch) ch.mark(i, 'ok'); }
      else { api.ng(180, 270, 46); if (ch) { ch.mark(i, 'ng'); ch.mark(R.ans, 'hint'); } }
      phase = good ? 'good' : 'bad'; pt = 0;
      if (ch) ch.enable(false); if (pad) pad.enable(false);
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
        else if (phase === 'ask' && p.practice && pt > 2.5 && ch) ch.hint(R.ans);
        else if ((phase === 'good' && pt > 1.0) || (phase === 'bad' && pt > 1.8)) startRound();
      },
      draw: function (c, clock) {
        if (!R) return;
        D.roundRect(c, BOX.x0 - 50, BOX.y0 - 50, BOX.x1 - BOX.x0 + 100, BOX.y1 - BOX.y0 + (pad ? 80 : 100), 24); D.paint(c, 'rgba(255,255,255,.4)');
        if (phase === 'ready') {
          A.text(c, L('すうじが ぱっと でるよ'), 180, 110, 22, '#fff', { lw: 6 });
          // a little star to look at
          D.sparkle(c, 180, 270, 12 + Math.sin(pt * 10) * 2, '#ffd23d');
        } else if (phase === 'flash') {
          A.text(c, R.n, R.x, R.y, R.n.length > 3 ? 46 : 56, '#fff', { lw: 9 });
        } else if (phase === 'ask') {
          A.text(c, L('なんだった？'), 180, 110, 24, '#fff', { lw: 7 });
          A.text(c, L('？'), 180, 270, 70, '#fff', { lw: 12 });
        } else if (phase === 'good' || phase === 'bad') {
          A.text(c, R.n, R.x, R.y, 44, phase === 'good' ? '#ff8fc0' : '#6cc6ff', { lw: 8 });
        }
      },
      peek: function () {   // for playtesting: the right answer
        if (phase !== 'ask') return null;
        return pad ? { pad: +R.n } : { cho: R.ans };
      },
      end: function () { if (pad) pad.remove(); if (ch) ch.remove(); }
    };
  }

  T.register({
    id: 'flashnum', name: 'ぱっと すうじ', orig: '瞬間数字', kind: 'count',
    help: 'すうじが いっしゅんだけ でるよ。\nなんの すうじ だったか こたえてね！',
    levels: {
      e: { rounds: 6, len: 1, show: 0.8 },
      n: { rounds: 6, len: 2, show: 0.6 },
      h: { rounds: 6, len: 3, show: 0.45 },
      a: { rounds: 6, len: 4, show: 0.32 },
      test: { rounds: 5, len: 2, show: 0.5 },
      testA: { rounds: 5, len: 4, show: 0.3 },
      practice: { rounds: 2, len: 1, show: 1.2 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1],
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
