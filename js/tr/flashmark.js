/* ぱっと まる (the original: 瞬間記号, 瞬間視) — many marks show for a blink; one of them is a ○.
   Where was the ○? Tap its square. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var OTHERS = ['sankaku', 'shikaku', 'batsu', 'hoshi'];
  var AREA = { x0: 30, y0: 150, x1: 330, y1: 450 };

  function cellOf(p, k) {
    var w = (AREA.x1 - AREA.x0) / p.cols, h = (AREA.y1 - AREA.y0) / p.rows;
    return { x: AREA.x0 + (k % p.cols + 0.5) * w, y: AREA.y0 + (Math.floor(k / p.cols) + 0.5) * h, w: w, h: h };
  }

  // p: { rounds, cols, rows, fill (how many squares have a mark), show (s) }
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var n = p.cols * p.rows, cells = U.sample(r, U.range(0, n - 1), Math.min(n, p.fill)), marks = {};
      cells.forEach(function (k, j) { marks[k] = j === 0 ? 'maru' : U.pick(r, OTHERS); });
      out.push({ marks: marks, ans: cells[0] });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, tapped = -1;

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end';
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri]; tapped = -1;
      phase = 'ready'; pt = 0;
      api.progress(ri, rounds.length);
    }
    function choose(k) {
      if (phase !== 'ask') return;
      tapped = k;
      var good = k === R.ans, q = cellOf(p, k);
      if (good) { right++; api.ok(q.x, q.y, 36); }
      else api.ng(q.x, q.y, 30);
      phase = good ? 'good' : 'bad'; pt = 0;
      api.progress(ri + 1, rounds.length);
    }

    return {
      theme: 0,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'ready' && pt > 0.9) { phase = 'flash'; pt = 0; api.sfx('pop'); }
        else if (phase === 'flash' && pt > p.show) { phase = 'ask'; pt = 0; api.sfx('select'); }
        else if (phase === 'ask' && p.practice && pt > 2.5) { var q = cellOf(p, R.ans); api.hand(q.x + 6, q.y + 8); }
        else if ((phase === 'good' && pt > 1.0) || (phase === 'bad' && pt > 1.8)) startRound();
      },
      draw: function (c) {
        if (!R) return;
        var n = p.cols * p.rows;
        for (var k = 0; k < n; k++) {
          var q = cellOf(p, k);
          D.roundRect(c, q.x - q.w / 2 + 4, q.y - q.h / 2 + 4, q.w - 8, q.h - 8, 14);
          D.paint(c, phase === 'ask' ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)', phase === 'ask' ? D.INK : null, 2.4);
          var show = phase === 'flash' || ((phase === 'good' || phase === 'bad') && (k === R.ans || k === tapped));
          if (show && R.marks[k]) A.mark(c, R.marks[k], q.x, q.y, Math.min(q.w, q.h) * 0.34);
        }
        var head = phase === 'ready' ? 'マークが ぱっと でるよ' : phase === 'ask' ? '○は どこに あった？' : phase === 'flash' ? '' : null;
        if (head) A.text(c, L(head), 180, 104, 22, '#fff', { lw: 6 });
        if (phase === 'ready') D.sparkle(c, 180, (AREA.y0 + AREA.y1) / 2, 12 + Math.sin(pt * 10) * 2, '#ffd23d');
      },
      peek: function () {   // for playtesting
        if (phase !== 'ask') return null;
        var q = cellOf(p, R.ans);
        return { x: q.x, y: q.y };
      },
      down: function (q) {
        if (phase !== 'ask') return;
        for (var k = 0; k < p.cols * p.rows; k++) {
          var cl = cellOf(p, k);
          if (Math.abs(q.x - cl.x) < cl.w / 2 && Math.abs(q.y - cl.y) < cl.h / 2) { choose(k); return; }
        }
      }
    };
  }

  T.register({
    id: 'flashmark', name: 'ぱっと まる', orig: '瞬間記号', kind: 'count',
    help: 'いろいろな マークが いっしゅん でるよ。\n○が あった ばしょを タッチしてね！',
    levels: {
      e: { rounds: 6, cols: 2, rows: 2, fill: 4, show: 0.9 },
      n: { rounds: 6, cols: 3, rows: 3, fill: 7, show: 0.7 },
      h: { rounds: 6, cols: 4, rows: 4, fill: 12, show: 0.55 },
      ae: { rounds: 6, cols: 4, rows: 4, fill: 12, show: 0.45 },
      a: { rounds: 6, cols: 5, rows: 5, fill: 18, show: 0.4 },
      ah: { rounds: 6, cols: 6, rows: 6, fill: 26, show: 0.35 },
      test: { rounds: 5, cols: 3, rows: 3, fill: 8, show: 0.6 },
      testA: { rounds: 5, cols: 5, rows: 5, fill: 16, show: 0.4 },
      practice: { rounds: 2, cols: 2, rows: 2, fill: 3, show: 1.3 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, on = Math.sin((t || 0) * 3) > -0.3;
      [[30, 30, 'sankaku'], [70, 30, 'maru'], [30, 70, 'hoshi'], [70, 70, 'batsu']].forEach(function (m) {
        D.roundRect(c, m[0] - 18, m[1] - 18, 36, 36, 9); D.paint(c, 'rgba(255,255,255,.8)', D.INK, 2);
        if (on) A.mark(c, m[2], m[0], m[1], 13);
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
