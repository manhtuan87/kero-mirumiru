/* かぞえて C (the original: カウントC, 眼球運動) — first a "C" to look for; then Cs open this way and that
   pop up all over the screen, one after another. How many were open the same way as the first? */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 50, y0: 160, x1: 310, y1: 420 };

  // p: { rounds, items, hits: [a, b], show (s each), gap (s), size }
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var target = U.int(r, 0, 3), hits = U.span(r, p.hits), dirs = [];
      for (var k = 0; k < p.items; k++) {
        if (k < hits) dirs.push(target);
        else { var d = U.int(r, 0, 2); dirs.push(d >= target ? d + 1 : d); }
      }
      dirs = U.shuffle(r, dirs);
      var last = null;
      var cs = dirs.map(function (d) {
        // each C somewhere new, not on top of the one before
        var q;
        for (var t = 0; t < 30; t++) {
          q = { x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: BOX.y0 + r() * (BOX.y1 - BOX.y0) };
          if (!last || Math.hypot(q.x - last.x, q.y - last.y) > 90) break;
        }
        last = q;
        return { x: q.x, y: q.y, dir: d };
      });
      out.push({ target: target, cs: cs, ans: hits });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, ci = 0;
    var pad = api.answerPad({ expect: function () { return R ? R.ans : 0; }, onAnswer: answer });
    pad.enable(false);

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end'; pad.remove();
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri]; ci = 0;
      phase = 'target'; pt = 0;
      pad.enable(false);
      api.progress(ri, rounds.length);
      api.sfx('pop');
    }
    function answer(v) {
      if (phase !== 'ask') return;
      var good = v === R.ans;
      if (good) { right++; api.ok(180, 290, 60); } else { api.ng(180, 290, 50); pad.hint(R.ans); }
      phase = good ? 'good' : 'bad'; pt = 0;
      pad.enable(false);
      api.progress(ri + 1, rounds.length);
    }

    return {
      theme: 1,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'target' && pt > 1.8) { phase = 'show'; pt = 0; ci = 0; api.sfx('pop'); }
        else if (phase === 'show' && pt > p.show + p.gap) {
          ci++; pt = 0;
          if (ci >= R.cs.length) { phase = 'ask'; pad.enable(true); } else api.sfx('pop');
        } else if (phase === 'ask' && p.practice && pt > 3) pad.hint(R.ans);
        else if ((phase === 'good' && pt > 1.1) || (phase === 'bad' && pt > 1.9)) { pad.hint(null); startRound(); }
      },
      draw: function (c) {
        if (!R) return;
        D.roundRect(c, BOX.x0 - 44, BOX.y0 - 50, BOX.x1 - BOX.x0 + 88, BOX.y1 - BOX.y0 + 94, 24); D.paint(c, 'rgba(255,255,255,.4)');
        if (phase === 'target') {
          A.text(c, L('この むきの Cを かぞえてね！'), 180, 104, 21, '#fff', { lw: 6 });
          A.disc(c, 180, 290, 76, '#fff4b0', 3);   // (the C to count sits on yellow, as in the corner later)
          A.ringC(c, 180, 290, 52 + Math.sin(pt * 6) * 2, R.target);
          return;
        }
        // the C to count, small in the corner
        A.disc(c, 318, 116, 28, '#fff4b0', 3);
        A.ringC(c, 318, 116, 18, R.target);
        A.text(c, L(phase === 'ask' ? 'いくつ あった？' : 'おなじ むきは いくつ？'), 150, 116, 21, '#fff', { lw: 6, max: 230 });
        if (phase === 'show' && pt < p.show) { var q = R.cs[ci]; A.ringC(c, q.x, q.y, p.size, q.dir); }
        if (phase === 'good' || phase === 'bad') A.text(c, L('こたえは {n}', { n: R.ans }), 180, 290, 30, '#fff', { lw: 8 });
      },
      peek: function () { return phase === 'ask' ? { pad: R.ans } : null; },   // for playtesting
      end: function () { pad.remove(); }
    };
  }

  T.register({
    id: 'countc', name: 'かぞえて C', orig: 'カウントC', kind: 'count',
    help: 'さいしょに でた Cと おなじ むきの Cが\nいくつ でたか かぞえてね！',
    levels: {
      e: { rounds: 6, items: 5, hits: [1, 3], show: 0.9, gap: 0.25, size: 34 },
      n: { rounds: 6, items: 7, hits: [2, 4], show: 0.7, gap: 0.2, size: 30 },
      h: { rounds: 6, items: 9, hits: [2, 5], show: 0.5, gap: 0.15, size: 26 },
      ae: { rounds: 6, items: 10, hits: [2, 5], show: 0.45, gap: 0.14, size: 24 },
      a: { rounds: 6, items: 12, hits: [3, 6], show: 0.38, gap: 0.12, size: 22 },
      ah: { rounds: 6, items: 15, hits: [4, 8], show: 0.3, gap: 0.1, size: 20 },
      test: { rounds: 5, items: 7, hits: [2, 4], show: 0.6, gap: 0.2, size: 28 },
      testA: { rounds: 5, items: 11, hits: [3, 6], show: 0.4, gap: 0.12, size: 22 },
      practice: { rounds: 2, items: 4, hits: [1, 2], show: 1.1, gap: 0.3, size: 36 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, k = Math.floor((t || 0) * 2) % 4;
      A.disc(c, 30, 30, 21, '#fff4b0', 2.4);
      A.ringC(c, 30, 30, 14, 1);
      [[70, 36, 1], [34, 74, 2], [74, 74, 1], [52, 52, 0]].forEach(function (q, i) { if (i === k) A.ringC(c, q[0], q[1], 15, q[2]); });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
