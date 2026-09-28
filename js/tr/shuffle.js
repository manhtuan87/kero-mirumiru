/* シャッフル (the original: シャッフル, 動体視力) — a chick hides under one of the cups; the cups change
   places, and then you tap the cup the chick is under. Following the moving cups with the eyes. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var CUP_Y = 380, CUP_W = 62, CUP_H = 74;

  function slotX(n, i) { var gap = Math.min(96, 280 / Math.max(1, n - 1)); return 180 + (i - (n - 1) / 2) * gap; }   // (5 cups still fit the screen)

  // p: { rounds, cups, swaps, speed (swaps per second) }
  // Each round: where the chick starts and the list of swaps [a, b] (slots); ans = the slot at the end.
  function gen(p, r) {
    var out = [];
    for (var i = 0; i < p.rounds; i++) {
      var start = U.int(r, 0, p.cups - 1), pos = start, swaps = [], n = U.span(r, p.swaps);
      for (var k = 0; k < n; k++) {
        var a = U.int(r, 0, p.cups - 1), b = U.int(r, 0, p.cups - 2);
        if (b >= a) b++;
        // the first swap and most others move the chick's cup, so the eyes have to follow it
        if (k % 2 === 0 && (k === 0 || r() < 0.7) && a !== pos && b !== pos) a = pos;
        swaps.push([a, b]);
        if (pos === a) pos = b; else if (pos === b) pos = a;
      }
      out.push({ start: start, swaps: swaps, ans: pos });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
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
      if (si >= R.swaps.length) { phase = 'ask'; pt = 0; api.sfx('select'); return; }
      var s = R.swaps[si++];
      sw = { a: s[0], b: s[1], t: 0, dur: 1 / p.speed };
      api.sfx('whoosh');
    }
    function where(slot) { return { x: slotX(p.cups, slot), y: CUP_Y }; }

    function choose(slot) {
      if (phase !== 'ask') return;
      pick = slot;
      var good = slot === R.ans;
      if (good) { right++; api.ok(where(slot).x, CUP_Y - 120, 40); api.sfx('cheer'); }
      else api.ng(where(slot).x, CUP_Y - 120, 34);
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
            if (si < R.swaps.length) stepSwap(); else { phase = 'ask'; pt = 0; api.sfx('select'); }
          }
        } else if (phase === 'ask' && p.practice && pt > 2.5) { var w = where(R.ans); api.hand(w.x + 6, CUP_Y - 30); }
        else if ((phase === 'good' && pt > 1.2) || (phase === 'bad' && pt > 1.8)) startRound();
      },
      draw: function (c, clock) {
        D.roundRect(c, 20, CUP_Y - 10, 320, 26, 13); D.paint(c, 'rgba(255,255,255,.55)');
        if (!R) return;
        // where each cup is drawn now (the two moving ones travel on arcs, one over and one under).
        // All the cups look the same, so only following them with the eyes tells where the chick went.
        var pos = [];
        for (var s = 0; s < p.cups; s++) pos.push({ x: slotX(p.cups, s), y: CUP_Y });
        if (sw) {
          var k = Math.min(1, sw.t / sw.dur), e = k * k * (3 - 2 * k), xa = slotX(p.cups, sw.a), xb = slotX(p.cups, sw.b);
          pos[sw.a] = { x: xa + (xb - xa) * e, y: CUP_Y - Math.sin(k * Math.PI) * 26 };
          pos[sw.b] = { x: xb + (xa - xb) * e, y: CUP_Y + Math.sin(k * Math.PI) * 18 };
        }
        // the chick sits in its slot when the cups are up
        var chickSlot = phase === 'show' ? R.start : R.ans;
        if (lift > 0.05 && (phase === 'show' || phase === 'good' || phase === 'bad')) {
          D.chick(c, slotX(p.cups, chickSlot), CUP_Y - 4, 0.9, clock, { happy: true });
        }
        // the still cups first, then the one going over the top, then the one passing in front
        var order = [0, 1, 2, 3, 4].slice(0, p.cups).filter(function (k) { return !sw || (k !== sw.a && k !== sw.b); });
        if (sw) order.push(sw.a, sw.b);
        order.forEach(function (k) {
          var up = 0;
          if (phase === 'show' && k === R.start) up = lift * 70;
          if ((phase === 'good' || phase === 'bad') && (k === pick || k === R.ans)) up = lift * 70;
          A.cup(c, pos[k].x, pos[k].y, CUP_W, CUP_H, A.CUP_COLOR, up);
        });
        if (phase === 'show') A.text(c, L('ひよこを よく みててね！'), 180, 150, 22, '#fff', { lw: 6 });
        else if (phase === 'move') A.text(c, L('めで おいかけて！'), 180, 150, 22, '#fff', { lw: 6 });
        else if (phase === 'ask') A.text(c, L('ひよこは どこ？'), 180, 150, 24, '#fff', { lw: 7 });
      },
      peek: function () {   // for playtesting: where to tap
        return phase === 'ask' ? { x: slotX(p.cups, R.ans), y: CUP_Y - 30 } : null;
      },
      down: function (q) {
        if (phase !== 'ask' || q.y < CUP_Y - CUP_H - 30 || q.y > CUP_Y + 30) return;
        var best = -1, bd = 1e9;
        for (var k = 0; k < p.cups; k++) { var d = Math.abs(q.x - slotX(p.cups, k)); if (d < bd) { bd = d; best = k; } }
        if (bd < CUP_W * 0.75) choose(best);
      }
    };
  }

  T.register({
    id: 'shuffle', name: 'シャッフル', orig: 'シャッフル', kind: 'count',
    help: 'コップの どれかに ひよこが いるよ。\nコップが いれかわるのを めで おいかけて、\nひよこが いる コップを タッチしてね！',
    levels: {
      e: { rounds: 6, cups: 3, swaps: [3, 4], speed: 1.3 },
      n: { rounds: 6, cups: 3, swaps: [5, 6], speed: 2.0 },
      h: { rounds: 6, cups: 4, swaps: [6, 8], speed: 2.6 },
      a: { rounds: 6, cups: 5, swaps: [8, 10], speed: 3.4 },
      test: { rounds: 5, cups: 3, swaps: [5, 6], speed: 2.2 },
      testA: { rounds: 5, cups: 4, swaps: [7, 9], speed: 3.2 },
      practice: { rounds: 2, cups: 3, swaps: [2, 2], speed: 1.0 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1],
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
