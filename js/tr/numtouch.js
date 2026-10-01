/* すうじ さがし (眼と手の協応) — panels with the numbers from 1 are laid out
   at random; tap them in order, 1, 2, 3 ... as fast as you can.
   おに: after each right tap, two of the panels still to go change places (they slide, so the eyes can follow). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var AREA = { x0: 24, y0: 150, x1: 336, y1: 560 };
  var COLORS = ['#ffe0b8', '#d4ecff', '#ffd6e8', '#dff5cf', '#ebe0ff'];

  function cellOf(p, k) {
    var w = (AREA.x1 - AREA.x0) / p.cols, h = Math.min(w, (AREA.y1 - AREA.y0) / p.rows);
    var y0 = AREA.y0 + ((AREA.y1 - AREA.y0) - h * p.rows) / 2;
    return { x: AREA.x0 + (k % p.cols + 0.5) * w, y: y0 + (Math.floor(k / p.cols) + 0.5) * h, w: w, h: h };
  }

  // p: { boards, n (numbers), cols, rows }; おに: swap (pairs of panels that change places after each right tap).
  // cells[j] holds the number j + 1.
  function gen(p, r) {
    var out = [];
    for (var b = 0; b < p.boards; b++) out.push({ cells: U.sample(r, U.range(0, p.cols * p.rows - 1), p.n) });
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var boards = gen(p, api.rnd), bi = -1, B = null, nextN = 1, time = 0, mistakes = 0, phase = 'wait', pt = 0, since = 0, wrong = -1, wrongT = 0;
    var slides = [];   // (おに: panels on their way to their new place: { n, from, t })
    var SLIDE = 0.28;
    // Two of the numbers still to tap change places (their cells are swapped at once; the panels slide there).
    function swapSome() {
      for (var k = 0; k < (p.swap || 0); k++) {
        var left = U.range(nextN, p.n);
        if (left.length < 3) return;
        var two = U.sample(api.rnd, left, 2), a = two[0] - 1, b = two[1] - 1, ca = B.cells[a];
        slides.push({ n: two[0], from: B.cells[a], t: 0 }, { n: two[1], from: B.cells[b], t: 0 });
        B.cells[a] = B.cells[b]; B.cells[b] = ca;
      }
      if (p.swap) api.sfx('whoosh');
    }

    function nextBoard() {
      bi++;
      api.hand(null);
      if (bi >= boards.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 2, acc: U.acc(mistakes, boards.length * p.n), text: U.res.time(time, mistakes) });
        return;
      }
      B = boards[bi]; nextN = 1; phase = 'play'; pt = 0; since = 0; slides = [];
      api.progress(bi, boards.length);
    }
    function numAt(k) { var j = B.cells.indexOf(k); return j < 0 ? 0 : j + 1; }

    return {
      theme: 3,
      begin: nextBoard,
      update: function (dt, playing) {
        pt += dt; wrongT = Math.max(0, wrongT - dt);
        slides.forEach(function (sl) { sl.t += dt; });
        slides = slides.filter(function (sl) { return sl.t < SLIDE; });
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 2.5) { var q = cellOf(p, B.cells[nextN - 1]); api.hand(q.x + 6, q.y + 10); }
        } else if (phase === 'clear' && pt > 0.7) nextBoard();
      },
      draw: function (c) {
        if (!B) return;
        A.text(c, phase === 'clear' ? L('できた！') : L('つぎは {n}', { n: nextN }), 180, 104, 26, '#fff', { lw: 7 });
        for (var k = 0; k < p.cols * p.rows; k++) {
          var q = cellOf(p, k), n = numAt(k);
          if (!n) continue;
          var sl = slides.filter(function (x) { return x.n === n; })[0];
          if (sl) {   // (sliding from its old place)
            var f = cellOf(p, sl.from), e = Math.min(1, sl.t / SLIDE); e = e * e * (3 - 2 * e);
            q = { x: f.x + (q.x - f.x) * e, y: f.y + (q.y - f.y) * e, w: q.w, h: q.h };
          }
          var done = n < nextN, pad = 4;
          D.roundRect(c, q.x - q.w / 2 + pad, q.y - q.h / 2 + pad, q.w - pad * 2, q.h - pad * 2, 12);
          D.paint(c, done ? 'rgba(255,255,255,.35)' : k === wrong && wrongT > 0 ? '#c9dcff' : COLORS[n % COLORS.length], done ? null : D.INK, 2.6);
          A.text(c, String(n), q.x, q.y + 1, Math.min(q.w, q.h) * 0.46, done ? 'rgba(90,56,37,.3)' : D.INK, { stroke: false });
        }
      },
      peek: function () {   // for playtesting
        if (phase !== 'play') return null;
        var q = cellOf(p, B.cells[nextN - 1]);
        return { x: q.x, y: q.y };
      },
      down: function (q) {
        if (phase !== 'play') return;
        for (var k = 0; k < p.cols * p.rows; k++) {
          var cl = cellOf(p, k);
          if (Math.abs(q.x - cl.x) > cl.w / 2 || Math.abs(q.y - cl.y) > cl.h / 2) continue;
          var n = numAt(k);
          if (!n || n < nextN) return;
          if (n === nextN) {
            nextN++; since = 0; api.hand(null);
            if (nextN <= p.n) api.sfx('ok');
            api.burst(cl.x, cl.y, 5, '#fff6a8');
            if (nextN <= p.n) swapSome();
            if (nextN > p.n) { phase = 'clear'; pt = 0; api.ok(180, 330, 60); api.progress(bi + 1, boards.length); }
          } else { mistakes++; wrong = k; wrongT = 0.4; api.ng(cl.x, cl.y, 22); }
          return;
        }
      }
    };
  }

  T.register({
    id: 'numtouch', name: 'すうじ さがし', kind: 'time',
    help: 'すうじの パネルを、1から じゅんばんに\nできるだけ はやく タッチしてね！',
    oniHelp: 'タッチする たびに、\nパネルが 2まい いれかわるよ！',
    levels: {
      e: { boards: 2, n: 9, cols: 3, rows: 3 },
      n: { boards: 2, n: 12, cols: 3, rows: 4 },
      h: { boards: 1, n: 16, cols: 4, rows: 4 },
      ae: { boards: 1, n: 16, cols: 4, rows: 4 },
      a: { boards: 1, n: 20, cols: 4, rows: 5 },
      ah: { boards: 1, n: 25, cols: 5, rows: 5 },
      test: { boards: 1, n: 12, cols: 3, rows: 4 },
      testA: { boards: 1, n: 20, cols: 4, rows: 5 },
      practice: { boards: 1, n: 5, cols: 3, rows: 2 },
      o: { boards: 1, n: 12, cols: 3, rows: 4, swap: 1 },
      ao: { boards: 1, n: 20, cols: 4, rows: 5, swap: 1 },
      practiceO: { boards: 1, n: 5, cols: 3, rows: 2, swap: 1 }
    },
    ranks: {
      e: [9, 11, 14, 18, 24, 34], n: [14, 17, 21, 27, 36, 50], h: [11, 13, 16, 21, 28, 40], ae: [9, 11, 14, 18, 24, 33], a: [13, 15, 18, 23, 30, 42], ah: [17, 20, 24, 30, 39, 54],
      o: [12, 15, 19, 25, 34, 48], ao: [20, 24, 30, 38, 50, 68],
      test: [7, 9, 11, 14, 19, 27], testA: [13, 15, 18, 23, 30, 42]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, A = G.Art, k = Math.floor((t || 0) * 2) % 5;
      [[22, 22, 3], [52, 22, 1], [82, 22, 4], [22, 56, 2], [52, 56, 5], [82, 56, 6]].forEach(function (q) {
        D.roundRect(c, q[0] - 13, q[1] - 13, 26, 26, 6); D.paint(c, q[2] <= k ? 'rgba(255,255,255,.4)' : COLORS[q[2] % COLORS.length], D.INK, 2);
        A.text(c, String(q[2]), q[0], q[1] + 1, 15, D.INK, { stroke: false });
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
