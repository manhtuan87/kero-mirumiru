/* トリプル C (the original: トリプルC, 眼球運動) — a "C" pops up in one place after another. Then tell which
   way each C was open, in the order they came (↑ → ↓ ←). Moving the eyes quickly to each new place. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 50, y0: 150, x1: 310, y1: 420 };
  var ARROW_COLORS = ['#ffb347', '#6cc6ff', '#86d65c', '#ff8fc0'];

  // p: { rounds, k (Cs a round), show (s each), gap (s between), size }
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var pts = U.scatter(r, p.k, BOX, 110) || U.range(0, p.k - 1).map(function (j) { return { x: 80 + j * 90, y: 200 + (j % 2) * 120 }; });
      out.push({ cs: pts.map(function (q) { return { x: q.x, y: q.y, dir: U.int(r, 0, 3) }; }) });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, ci = 0, said = [], ch = null;

    function startRound() {
      ri++;
      api.hand(null);
      if (ch) { ch.remove(); ch = null; }
      if (ri >= rounds.length) {
        phase = 'end';
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri]; ci = 0; said = [];
      phase = 'ready'; pt = 0;
      api.progress(ri, rounds.length);
    }
    function ask() {
      phase = 'ask'; pt = 0;
      ch = api.choices([0, 1, 2, 3].map(function (d) {
        return { draw: function (g, w, h) { A.dirArrow(g, w / 2, h / 2, Math.min(w, h) / 52, d, ARROW_COLORS[d]); } };
      }), function (d) { tap(d); }, { top: 480, h: 88, cols: 4, gap: 10, left: 16, right: 16 });
    }
    function tap(d) {
      if (phase !== 'ask') return;
      said.push(d);
      var k = said.length - 1;
      api.sfx('select');
      if (d !== R.cs[k].dir) { finishRound(false); return; }
      if (said.length >= R.cs.length) finishRound(true);
    }
    function finishRound(good) {
      if (good) { right++; api.ok(180, 280, 60); } else api.ng(180, 280, 50);
      phase = good ? 'good' : 'bad'; pt = 0;
      if (ch) ch.enable(false);
      api.progress(ri + 1, rounds.length);
    }

    return {
      theme: 1,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'ready' && pt > 0.9) { phase = 'show'; pt = 0; ci = 0; api.sfx('pop'); }
        else if (phase === 'show') {
          if (pt > p.show + p.gap) {
            ci++; pt = 0;
            if (ci >= R.cs.length) ask(); else api.sfx('pop');
          }
        } else if (phase === 'ask' && p.practice && pt > 2.5 && ch) ch.hint(R.cs[said.length] ? R.cs[said.length].dir : -1);
        else if ((phase === 'good' && pt > 1.1) || (phase === 'bad' && pt > 2.2)) startRound();
      },
      draw: function (c) {
        if (!R) return;
        D.roundRect(c, BOX.x0 - 44, BOX.y0 - 44, BOX.x1 - BOX.x0 + 88, BOX.y1 - BOX.y0 + 88, 24); D.paint(c, 'rgba(255,255,255,.4)');
        if (phase === 'ready') {
          A.text(c, L('Cが {n}かい でるよ', { n: R.cs.length }), 180, 104, 22, '#fff', { lw: 6 });
          D.sparkle(c, 180, 285, 12 + Math.sin(pt * 10) * 2, '#ffd23d');
        } else if (phase === 'show') {
          A.text(c, L('Cの あいてる ほうを おぼえてね'), 180, 104, 20, '#fff', { lw: 6 });
          if (pt < p.show) { var q = R.cs[ci]; A.ringC(c, q.x, q.y, p.size, q.dir); }
        } else {
          A.text(c, L(phase === 'ask' ? 'でた じゅんに こたえてね' : phase === 'good' ? 'ぜんぶ あたり！' : 'こたえは これ'), 180, 104, 22, '#fff', { lw: 6 });
          // the answer so far, one box per C
          var n = R.cs.length, w = n > 4 ? 56 : 64, gap = n > 4 ? 8 : 10, x0 = 180 - (n * w + (n - 1) * gap) / 2;
          for (var k = 0; k < n; k++) {
            var x = x0 + k * (w + gap) + w / 2, y = 300;
            D.roundRect(c, x - w / 2, y - w / 2, w, w, 14); D.paint(c, '#fffdf5', D.INK, 3);
            A.text(c, String(k + 1), x - w / 2 + 11, y - w / 2 + 11, 13, D.INK, { stroke: false });
            if (said[k] != null) A.dirArrow(c, x, y, 0.95, said[k], said[k] === R.cs[k].dir ? ARROW_COLORS[said[k]] : '#c9c1bb');
            else if (phase === 'bad') A.ringC(c, x, y, 20, R.cs[k].dir);
            if (phase === 'bad' && said[k] != null && said[k] !== R.cs[k].dir) A.ringC(c, x, y + 58, 17, R.cs[k].dir);
          }
        }
      },
      peek: function () { return phase === 'ask' ? { cho: R.cs[said.length].dir } : null; },   // for playtesting
      end: function () { if (ch) ch.remove(); }
    };
  }

  T.register({
    id: 'triplec', name: 'トリプル C', orig: 'トリプルC', kind: 'count',
    help: 'いろいろな ばしょに「C」が でるよ。\nでた じゅんばんに、Cの あいてる ほう\n（↑ → ↓ ←）を こたえてね！',
    levels: {
      e: { rounds: 6, k: 2, show: 1.0, gap: 0.3, size: 36 },
      n: { rounds: 6, k: 3, show: 0.8, gap: 0.25, size: 32 },
      h: { rounds: 6, k: 3, show: 0.55, gap: 0.2, size: 28 },
      ae: { rounds: 6, k: 3, show: 0.5, gap: 0.2, size: 26 },
      a: { rounds: 6, k: 4, show: 0.4, gap: 0.15, size: 24 },
      ah: { rounds: 6, k: 5, show: 0.33, gap: 0.12, size: 22 },
      test: { rounds: 5, k: 3, show: 0.7, gap: 0.25, size: 30 },
      testA: { rounds: 5, k: 4, show: 0.4, gap: 0.15, size: 24 },
      practice: { rounds: 2, k: 1, show: 1.4, gap: 0.3, size: 38 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, k = Math.floor((t || 0) * 1.5) % 3;
      [[28, 30, 0], [72, 46, 1], [40, 76, 3]].forEach(function (q, i) { if (i <= k) A.ringC(c, q[0], q[1], 15, q[2]); });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
