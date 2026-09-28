/* うえした C (the original: 上下C, 周辺視野) — looking at the star in the middle, two "C"s blink at the top
   and the bottom of the screen at the same time. Were they open the same way, or not? */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var MID = 300;

  // p: { q, show (s), size, spread (how far up and down) }
  // Half of the pairs are the same way (in a shuffled order), half are not.
  function gen(p, r) {
    var out = [], sames = U.shuffle(r, U.range(1, p.q).map(function (i) { return i <= Math.floor(p.q / 2); }));
    for (var i = 0; i < p.q; i++) {
      var a = U.int(r, 0, 3), same = sames[i], b = same ? a : (a + U.int(r, 1, 3)) % 4;
      out.push({ a: a, b: b, same: same, xa: 70 + r() * 220, xb: 70 + r() * 220 });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var qs = gen(p, api.rnd), qi = -1, Q = null, phase = 'wait', pt = 0, right = 0, ch = null;

    function next() {
      qi++;
      api.hand(null);
      if (ch) { ch.remove(); ch = null; }
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: right, acc: right / qs.length, text: U.res.right(right, qs.length) });
        return;
      }
      Q = qs[qi]; phase = 'ready'; pt = 0;
      api.progress(qi, qs.length);
    }
    function ask() {
      phase = 'ask'; pt = 0;
      api.timer(p.limit, timeUp);
      ch = api.choices([{ label: L('おなじ'), size: 30 }, { label: L('ちがう'), size: 30 }], function (i) { answer(i === 0, i); },
        { top: 500, h: 86, cols: 2, gap: 16, left: 26, right: 26 });
    }
    function timeUp() {   // (no answer in time: the right one is shown)
      if (phase !== 'ask') return;
      api.ng(180, MID, 42); ch.mark(Q.same ? 0 : 1, 'hint'); ch.enable(false);
      phase = 'bad'; pt = 0;
      api.progress(qi + 1, qs.length);
    }
    function answer(same, i) {
      if (phase !== 'ask') return;
      api.timer(0);
      var good = same === Q.same;
      if (good) { right++; api.ok(180, MID, 50); ch.mark(i, 'ok'); } else { api.ng(180, MID, 42); ch.mark(i, 'ng'); }
      ch.enable(false);
      phase = good ? 'good' : 'bad'; pt = 0;
      api.progress(qi + 1, qs.length);
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'ready' && pt > 0.9) { phase = 'flash'; pt = 0; api.sfx('pop'); }
        else if (phase === 'flash' && pt > p.show) ask();
        else if (phase === 'ask' && p.practice && pt > 2.5) ch.hint(Q.same ? 0 : 1);
        else if ((phase === 'good' && pt > 0.9) || (phase === 'bad' && pt > 1.7)) next();
      },
      draw: function (c) {
        if (!Q) return;
        D.roundRect(c, 20, MID - p.spread - 40, 320, p.spread * 2 + 80, 26); D.paint(c, 'rgba(255,255,255,.4)');
        A.text(c, L(phase === 'ask' || phase === 'good' || phase === 'bad' ? 'おなじ むき だった？' : 'まんなかの ほしを みててね'), 180, 104, 21, '#fff', { lw: 6 });
        D.sparkle(c, 180, MID, 13 + Math.sin(pt * 8) * 2, '#ffd23d');
        if (phase === 'flash' || phase === 'good' || phase === 'bad') {
          A.ringC(c, Q.xa, MID - p.spread, p.size, Q.a);
          A.ringC(c, Q.xb, MID + p.spread, p.size, Q.b);
        }
      },
      peek: function () { return phase === 'ask' ? { cho: Q.same ? 0 : 1 } : null; },   // for playtesting
      end: function () { if (ch) ch.remove(); }
    };
  }

  T.register({
    id: 'updownc', name: 'うえした C', orig: '上下C', kind: 'count',
    help: 'まんなかの ほしを みていてね。\nうえと したに「C」が いっしゅん でるよ。\nおなじ むきか ちがう むきか こたえてね！',
    levels: {
      e: { q: 8, show: 0.9, size: 30, spread: 120, limit: 6 },
      n: { q: 10, show: 0.6, size: 26, spread: 140, limit: 5 },
      h: { q: 10, show: 0.42, size: 22, spread: 150, limit: 4 },
      ae: { q: 10, show: 0.38, size: 21, spread: 155, limit: 4 },
      a: { q: 12, show: 0.3, size: 19, spread: 160, limit: 3 },
      ah: { q: 12, show: 0.22, size: 17, spread: 170, limit: 3 },
      test: { q: 8, show: 0.5, size: 25, spread: 145, limit: 5 },
      testA: { q: 10, show: 0.3, size: 19, spread: 160, limit: 3 },
      practice: { q: 3, show: 1.3, size: 32, spread: 110 }
    },
    ranks: {
      e: [8, 7, 6, 5, 4, 2], n: [10, 9, 8, 7, 5, 3], h: [10, 9, 8, 7, 5, 3], ae: [10, 9, 8, 7, 5, 3], a: [12, 11, 10, 8, 6, 4], ah: [12, 11, 10, 8, 6, 4],
      test: [8, 7, 6, 5, 4, 2], testA: [10, 9, 8, 7, 5, 3]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, on = Math.sin((t || 0) * 3) > -0.3;
      D.sparkle(c, 50, 52, 8, '#ffd23d');
      if (on) { A.ringC(c, 30, 18, 12, 1); A.ringC(c, 70, 84, 12, 1); }
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
