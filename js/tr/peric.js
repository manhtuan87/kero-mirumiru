/* わっか さがし (周辺視野) — a "C" in the middle and Cs all around it. Keeping the middle
   one in view, find the one around it that is open the same way, and tap it — as fast as you can.
   おに: the Cs open slantwise too, many only a little turned from the middle one; grown-ups get two rings. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var CX = 180, CY = 310;

  // p: { q (questions), around, radius, size }; おに: dirs: 8, near (share of the others only 45° off),
  // rings: 2 (the Cs in two rings: 3 of 8 inside, the rest outside)
  var RINGS2 = [88, 146];
  function gen(p, r) {
    var out = [], nd = p.dirs || 4;
    for (var i = 0; i < p.q; i++) {
      var dir = U.int(r, 0, nd - 1), ans = U.int(r, 0, p.around - 1), rot = r() * Math.PI * 2, cs = [];
      var inner = p.rings === 2 ? Math.round(p.around * 3 / 8) : 0;
      for (var k = 0; k < p.around; k++) {
        var two = k < inner, m = two ? inner : p.around - inner, j = two ? k : k - inner;
        var a = rot + (j + (two ? 0 : 0.5)) / m * Math.PI * 2, rad = p.rings === 2 ? RINGS2[two ? 0 : 1] : p.radius, d;
        if (k === ans) d = dir;
        else if (p.near && r() < p.near) d = (dir + (r() < 0.5 ? 1 : nd - 1)) % nd;
        else { d = U.int(r, 0, nd - 2); if (d >= dir) d++; }
        cs.push({ x: CX + Math.cos(a) * rad, y: CY + Math.sin(a) * rad * 0.92, dir: d });
      }
      out.push({ dir: dir, cs: cs, ans: ans });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, ring = p.dirs === 8 ? A.ringC8 : A.ringC;   // (おに: slantwise too)
    var qs = gen(p, api.rnd), qi = -1, Q = null, phase = 'wait', pt = 0, time = 0, mistakes = 0, since = 0, wrong = -1;

    function next() {
      qi++;
      api.hand(null);
      if (qi >= qs.length) {
        phase = 'end';
        api.finish({ score: time + mistakes * 2, acc: U.acc(mistakes, qs.length), text: U.res.time(time, mistakes) });
        return;
      }
      Q = qs[qi]; phase = 'play'; pt = 0; since = 0; wrong = -1;
      api.timer(p.limit, timeUp);
      api.progress(qi, qs.length);
    }
    function timeUp() {   // (not found in time: a mistake, and the right C is shown)
      if (phase !== 'play') return;
      mistakes++; var q = Q.cs[Q.ans]; api.ng(q.x, q.y, 24);
      phase = 'bad'; pt = 0;
      api.progress(qi + 1, qs.length);
    }
    function tap(k) {
      if (phase !== 'play') return;
      var q = Q.cs[k];
      if (k === Q.ans) {
        api.timer(0);
        api.ok(q.x, q.y, 30); api.burst(q.x, q.y, 6, '#fff6a8');
        phase = 'good'; pt = 0;
        api.progress(qi + 1, qs.length);
      } else { mistakes++; wrong = k; api.ng(q.x, q.y, 24); }
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'play') {
          time += dt; since += dt;
          if (p.practice && since > 3) { var q = Q.cs[Q.ans]; api.hand(q.x + 6, q.y + 8); }
        } else if ((phase === 'good' && pt > 0.35) || (phase === 'bad' && pt > 1.1)) next();
      },
      draw: function (c) {
        if (!Q) return;
        A.text(c, L('まんなかと おなじ むきは どれ？'), 180, 104, 20, '#fff', { lw: 6 });
        D.circle(c, CX, CY, (p.rings === 2 ? RINGS2[1] : p.radius) + p.size + 14); D.paint(c, 'rgba(255,255,255,.4)');
        D.circle(c, CX, CY, p.size * 1.5 + 10); D.paint(c, '#fff4b0', D.INK, 3);
        ring(c, CX, CY, p.size * 1.5, Q.dir);
        Q.cs.forEach(function (q, k) {
          if ((phase === 'good' || phase === 'bad') && k === Q.ans) { D.circle(c, q.x, q.y, p.size + 8); D.paint(c, phase === 'good' ? 'rgba(255,143,192,.5)' : 'rgba(108,198,255,.55)'); }
          ring(c, q.x, q.y, p.size, q.dir, k === wrong ? '#b3aaa4' : null);   // (a C tapped by mistake turns grey)
        });
      },
      peek: function () {   // for playtesting
        if (phase !== 'play') return null;
        var q = Q.cs[Q.ans];
        return { x: q.x, y: q.y };
      },
      down: function (q) {
        if (phase !== 'play') return;
        var best = -1, bd = 1e9;
        Q.cs.forEach(function (c, k) { var d = Math.hypot(q.x - c.x, q.y - c.y); if (d < bd) { bd = d; best = k; } });
        if (bd < p.size + 16) tap(best);
      }
    };
  }

  T.register({
    id: 'peric', name: 'わっか さがし', kind: 'time',
    help: 'まんなかと おなじ むきの わっかを\nまわりから さがして タッチしてね！\nはやさを はかるよ',
    oniHelp: 'ななめ むきの わっかも まざるよ。\nおなじ むきを さがしてね！',
    levels: {
      e: { q: 8, around: 4, radius: 105, size: 30, limit: 10 },
      n: { q: 10, around: 6, radius: 118, size: 26, limit: 8 },
      h: { q: 10, around: 8, radius: 128, size: 22, limit: 7 },
      ae: { q: 10, around: 8, radius: 128, size: 22, limit: 6 },
      a: { q: 12, around: 8, radius: 136, size: 19, limit: 5 },
      ah: { q: 12, around: 12, radius: 140, size: 17, limit: 4 },
      test: { q: 8, around: 6, radius: 120, size: 25, limit: 8 },
      testA: { q: 10, around: 8, radius: 134, size: 19, limit: 5 },
      practice: { q: 3, around: 4, radius: 100, size: 32 },
      o: { q: 10, around: 8, radius: 128, size: 22, dirs: 8, near: 0.6, limit: 8 },
      ao: { q: 12, around: 16, rings: 2, size: 16, dirs: 8, near: 0.6, limit: 5 },
      practiceO: { q: 3, around: 4, radius: 100, size: 32, rings: 0, dirs: 8, near: 0.5 }
    },
    ranks: {
      e: [8, 10, 13, 17, 23, 32], n: [12, 15, 19, 25, 33, 45], h: [15, 19, 24, 31, 41, 56], ae: [13, 16, 20, 26, 34, 46], a: [16, 20, 25, 32, 42, 56], ah: [22, 27, 34, 43, 56, 74],
      o: [20, 25, 31, 40, 52, 70], ao: [31, 38, 47, 60, 78, 104],
      test: [10, 13, 16, 21, 28, 38], testA: [13, 16, 20, 26, 34, 46]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw;
      D.circle(c, 50, 52, 16); D.paint(c, '#fff4b0', D.INK, 2);
      A.ringC(c, 50, 52, 12, 1);
      [[50, 16, 0], [86, 52, 1], [50, 88, 2], [14, 52, 3]].forEach(function (q, i) {
        if (i === 1) { D.circle(c, q[0], q[1], 14 + Math.sin((t || 0) * 5) * 1.5); D.paint(c, 'rgba(255,143,192,.5)'); }
        A.ringC(c, q[0], q[1], 10, q[2]);
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
