/* シャッフル (the original: シャッフル, 動体視力) — a chick hides under one of the cups; the cups change
   places, and then you tap the cup the chick is under. Following the moving cups with the eyes.
   おに: the cups stand in two rows and change places sideways, up and down and slantwise (grown-ups: now and then
   two pairs at once). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var CUP_Y = 380, CUP_W = 62, CUP_H = 74, ROW_Y = [320, 470];

  function slotX(n, i) { var gap = Math.min(96, 280 / Math.max(1, n - 1)); return 180 + (i - (n - 1) / 2) * gap; }   // (5 cups still fit the screen)

  // The cups' places: one row of p.cups, or two rows of p.cols (おに).
  function layout(p) { return p.rows === 2 ? { rows: 2, cols: p.cols, n: 2 * p.cols } : { rows: 1, cols: p.cups, n: p.cups }; }
  function slotAt(g, s) {
    return g.rows === 2 ? { x: slotX(g.cols, s % g.cols), y: ROW_Y[Math.floor(s / g.cols)] } : { x: slotX(g.n, s), y: CUP_Y };
  }
  // The places next to a place in two rows: sideways, up or down, and slantwise.
  function neighbours(g, s) {
    var r0 = Math.floor(s / g.cols), c0 = s % g.cols, out = [];
    for (var r = 0; r < g.rows; r++) for (var c = c0 - 1; c <= c0 + 1; c++) {
      if (c >= 0 && c < g.cols && !(r === r0 && c === c0)) out.push(r * g.cols + c);
    }
    return out;
  }

  // p: { rounds, cups, swaps, speed (swaps per second) }; おに: { rows: 2, cols, double (chance of two pairs at once) }
  // Each round: where the chick starts and the list of swaps [a, b] (slots; [a, b, c, d] for two pairs at once);
  // ans = the slot at the end.
  function gen(p, r) {
    var out = [], g = layout(p);
    for (var i = 0; i < p.rounds; i++) {
      var start = U.int(r, 0, g.n - 1), pos = start, swaps = [], n = U.span(r, p.swaps);
      for (var k = 0; k < n; k++) {
        var a, b;
        if (g.rows === 2) {
          // the first swap and most others move the chick's cup, so the eyes have to follow it
          // (never straight back the way the last swap went)
          var last = swaps[swaps.length - 1];
          for (var tries = 0; tries < 20; tries++) {
            a = k === 0 || r() < 0.6 ? pos : U.int(r, 0, g.n - 1);
            b = U.pick(r, neighbours(g, a));
            if (!last || !((last[0] === a && last[1] === b) || (last[0] === b && last[1] === a))) break;
          }
        } else {
          a = U.int(r, 0, g.n - 1); b = U.int(r, 0, g.n - 2);
          if (b >= a) b++;
          if (k % 2 === 0 && (k === 0 || r() < 0.7) && a !== pos && b !== pos) a = pos;
        }
        var sw = [a, b];
        if (g.rows === 2 && p.double && k > 0 && r() < p.double) {
          // a second pair at the same time, apart from the first
          var free = U.range(0, g.n - 1).filter(function (s) { return s !== a && s !== b; });
          for (var t = 0; t < 20; t++) {
            var c = U.pick(r, free), ds = neighbours(g, c).filter(function (s) { return s !== a && s !== b; });
            if (ds.length) { sw.push(c, U.pick(r, ds)); break; }
          }
        }
        swaps.push(sw);
        for (var q = 0; q < sw.length; q += 2) { if (pos === sw[q]) pos = sw[q + 1]; else if (pos === sw[q + 1]) pos = sw[q]; }
      }
      out.push({ start: start, swaps: swaps, ans: pos });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, g = layout(p);
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0;
    var si = 0, sw = null, pick = -1, lift = 0, R = null;

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end';
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri];
      si = 0; sw = null; pick = -1;
      phase = 'show'; pt = 0; lift = 1;
      api.progress(ri, rounds.length);
      api.sfx('peep');
    }
    function stepSwap() {
      if (si >= R.swaps.length) { toAsk(); return; }
      sw = { s: R.swaps[si++], t: 0, dur: 1 / p.speed };
      api.sfx('whoosh');
    }
    function where(slot) { return slotAt(g, slot); }

    function toAsk() { phase = 'ask'; pt = 0; api.sfx('select'); api.timer(p.limit, timeUp); }
    function timeUp() {   // (no cup chosen in time: the chick is shown)
      if (phase !== 'ask') return;
      var w = where(R.ans);
      pick = -1; api.ng(w.x, w.y - 120, 34);
      phase = 'bad'; pt = 0; lift = 0;
      api.progress(ri + 1, rounds.length);
    }
    function choose(slot) {
      if (phase !== 'ask') return;
      api.timer(0);
      pick = slot;
      var good = slot === R.ans, w = where(slot);
      if (good) { right++; api.ok(w.x, w.y - 120, 40); api.sfx('cheer'); }
      else api.ng(w.x, w.y - 120, 34);
      phase = good ? 'good' : 'bad'; pt = 0; lift = 0;
      api.progress(ri + 1, rounds.length);
    }

    return {
      theme: 5,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        if (phase === 'show') lift = pt < 1.1 ? Math.min(1, lift) : Math.max(0, 1 - (pt - 1.1) * 4);
        else if (phase === 'good' || phase === 'bad') lift = Math.min(1, pt * 4);
        if (!playing) return;
        if (phase === 'show' && pt > 1.45) { phase = 'move'; pt = 0; stepSwap(); }
        else if (phase === 'move' && sw) {
          sw.t += dt;
          if (sw.t >= sw.dur) {
            sw = null;
            if (si < R.swaps.length) stepSwap(); else toAsk();
          }
        } else if (phase === 'ask' && p.practice && pt > 2.5) { var w = where(R.ans); api.hand(w.x + 6, w.y - 30); }
        else if ((phase === 'good' && pt > 1.2) || (phase === 'bad' && pt > 1.8)) startRound();
      },
      draw: function (c, clock) {
        for (var row = 0; row < g.rows; row++) {
          var by = g.rows === 2 ? ROW_Y[row] : CUP_Y;
          D.roundRect(c, 20, by - 10, 320, 26, 13); D.paint(c, 'rgba(255,255,255,.55)');
        }
        if (!R) return;
        // where each cup is drawn now: the moving ones travel on arcs (one on each side of the straight way).
        // All the cups look the same, so only following them with the eyes tells where the chick went.
        var pos = [], moving = {};
        for (var s = 0; s < g.n; s++) pos.push(where(s));
        if (sw) {
          var k = Math.min(1, sw.t / sw.dur), e = k * k * (3 - 2 * k), bulge = Math.sin(k * Math.PI);
          for (var q = 0; q < sw.s.length; q += 2) {
            var a = sw.s[q], b = sw.s[q + 1], pa = where(a), pb = where(b), dx = pb.x - pa.x, dy = pb.y - pa.y, len = Math.hypot(dx, dy) || 1;
            var nx = dy / len, ny = -dx / len;   // (sideways from the way; the first cup always goes over the top, or to the right)
            if (ny > 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
            pos[a] = { x: pa.x + dx * e + nx * bulge * 26, y: pa.y + dy * e + ny * bulge * 26 };
            pos[b] = { x: pb.x - dx * e - nx * bulge * 18, y: pb.y - dy * e - ny * bulge * 18 };
            moving[a] = moving[b] = true;
          }
        }
        // the chick sits in its slot when the cups are up
        var chickSlot = phase === 'show' ? R.start : R.ans;
        if (lift > 0.05 && (phase === 'show' || phase === 'good' || phase === 'bad')) {
          var cw = where(chickSlot);
          D.chick(c, cw.x, cw.y - 4, 0.9, clock, { happy: true });
        }
        // the still cups first (the back row first), then the one going over the top, then the one passing in front
        var order = U.range(0, g.n - 1).sort(function (x, y) { return ((moving[x] ? 1 : 0) - (moving[y] ? 1 : 0)) || (pos[x].y - pos[y].y); });
        order.forEach(function (k2) {
          var up = 0;
          if (phase === 'show' && k2 === R.start) up = lift * 70;
          if ((phase === 'good' || phase === 'bad') && (k2 === pick || k2 === R.ans)) up = lift * 70;
          A.cup(c, pos[k2].x, pos[k2].y, CUP_W, CUP_H, A.CUP_COLOR, up);
        });
        if (phase === 'show') A.text(c, L('ひよこを よく みててね！'), 180, 150, 22, '#fff', { lw: 6 });
        else if (phase === 'move') A.text(c, L('めで おいかけて！'), 180, 150, 22, '#fff', { lw: 6 });
        else if (phase === 'ask') A.text(c, L('ひよこは どこ？'), 180, 150, 24, '#fff', { lw: 7 });
      },
      peek: function () {   // for playtesting: where to tap
        if (phase !== 'ask') return null;
        var w = where(R.ans);
        return { x: w.x, y: w.y - 30 };
      },
      down: function (q) {
        if (phase !== 'ask') return;
        if (g.rows === 2) {
          var best2 = -1, bd2 = 1e9;
          for (var k2 = 0; k2 < g.n; k2++) { var w = where(k2), d2 = Math.hypot(q.x - w.x, (q.y - (w.y - 34)) * 0.8); if (d2 < bd2) { bd2 = d2; best2 = k2; } }
          if (bd2 < 56) choose(best2);
          return;
        }
        if (q.y < CUP_Y - CUP_H - 30 || q.y > CUP_Y + 30) return;
        var best = -1, bd = 1e9;
        for (var k = 0; k < g.n; k++) { var d = Math.abs(q.x - slotX(g.n, k)); if (d < bd) { bd = d; best = k; } }
        if (bd < CUP_W * 0.75) choose(best);
      }
    };
  }

  T.register({
    id: 'shuffle', name: 'シャッフル', orig: 'シャッフル', kind: 'count',
    help: 'コップの どれかに ひよこが いるよ。\nコップが いれかわるのを めで おいかけて、\nひよこが いる コップを タッチしてね！',
    oniHelp: 'コップが 2だんに なるよ。\nよこ・たて・ななめにも いれかわるよ！',
    levels: {
      e: { rounds: 6, cups: 3, swaps: [3, 4], speed: 1.3, limit: 8 },
      n: { rounds: 6, cups: 3, swaps: [5, 6], speed: 2.0, limit: 6 },
      h: { rounds: 6, cups: 4, swaps: [6, 8], speed: 2.6, limit: 5 },
      o: { rounds: 6, rows: 2, cols: 3, swaps: [6, 8], speed: 2.2, limit: 6 },
      ae: { rounds: 6, cups: 3, swaps: [8, 10], speed: 3.0, limit: 5 },
      a: { rounds: 6, cups: 4, swaps: [9, 11], speed: 3.4, limit: 4 },
      ah: { rounds: 6, cups: 5, swaps: [10, 12], speed: 4.0, limit: 3 },
      ao: { rounds: 6, rows: 2, cols: 4, swaps: [10, 12], speed: 3.2, double: 0.3, limit: 4 },
      test: { rounds: 5, cups: 3, swaps: [5, 6], speed: 2.2, limit: 6 },
      testA: { rounds: 5, cups: 4, swaps: [7, 9], speed: 3.2, limit: 4 },
      practice: { rounds: 2, cups: 3, swaps: [2, 2], speed: 1.0 },
      practiceO: { rounds: 2, rows: 2, cols: 3, swaps: [2, 3], speed: 1.0, double: 0 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], o: [6, 5, 4, 3, 2, 1],
      ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1], ao: [6, 5, 4, 3, 2, 1],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, D = G.Draw, k = Math.sin((t || 0) * 2.5);
      D.chick(c, 50, 78, 0.55, t || 0, { happy: true });
      A.cup(c, 22 + k * 6, 82, 30, 36, A.CUP_COLOR, 0);
      A.cup(c, 50, 82, 30, 36, A.CUP_COLOR, 26 + Math.max(0, k) * 6);
      A.cup(c, 78 - k * 6, 82, 30, 36, A.CUP_COLOR, 0);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
