/* れんぞく タッチ (the original: 連続タッチ, 眼と手の協応) — squares pop up here and there and fade away.
   Tap each one before it is gone. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 50, y0: 150, x1: 310, y1: 560 }, SIZE = 58;
  var COLORS = ['#ff8fb0', '#6cc6ff', '#ffd23d', '#8bd86a', '#b58cff', '#ffa552'];

  // p: { n (squares), every (s between them), life (s each), size }
  function gen(p, r) {
    var out = [], t = 0.3;
    for (var i = 0; i < p.n; i++) {
      var q = null;
      for (var k = 0; k < 40; k++) {
        q = { x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: BOX.y0 + r() * (BOX.y1 - BOX.y0) };
        // away from the ones that may still be showing
        var clear = out.every(function (o) { return o.at + o.life < t || Math.hypot(o.x - q.x, o.y - q.y) > p.size * 1.4; });
        if (clear) break;
      }
      out.push({ x: q.x, y: q.y, at: t, life: p.life, color: COLORS[i % COLORS.length] });
      t += p.every * (0.8 + r() * 0.4);
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var list = gen(p, api.rnd), t = 0, hits = 0, done = 0, phase = 'wait', pt = 0;
    list.forEach(function (o) { o.state = 'wait'; o.k = 0; });

    return {
      theme: 3,
      begin: function () { phase = 'play'; api.progress(0, list.length); },
      update: function (dt, playing) {
        pt += dt;
        list.forEach(function (o) { if (o.state === 'hit' || o.state === 'gone') o.k += dt; });
        if (!playing || phase !== 'play') return;
        t += dt;
        list.forEach(function (o) {
          if (o.state === 'wait' && t >= o.at) { o.state = 'on'; api.sfx('pop'); }
          else if (o.state === 'on' && t >= o.at + o.life) { o.state = 'gone'; o.k = 0; done++; api.progress(done, list.length); }
        });
        if (p.practice) {
          var on = list.filter(function (o) { return o.state === 'on'; })[0];
          if (on) api.hand(on.x + 8, on.y + 10); else api.hand(null);
        }
        if (done >= list.length) {
          phase = 'end'; api.hand(null);
          api.finish({ score: hits, text: U.res.hit(hits, list.length), delay: 500 });
        }
      },
      draw: function (c, clock) {
        A.text(c, L('きえる まえに タッチ！'), 180, 104, 22, '#fff', { lw: 6 });
        list.forEach(function (o) {
          if (o.state === 'wait') return;
          var s = p.size, left = o.state === 'on' ? Math.max(0, 1 - (t - o.at) / o.life) : 0;
          if (o.state === 'on') {
            var pop = Math.min(1, (t - o.at) * 7), z = s * (0.6 + 0.4 * pop);
            D.roundRect(c, o.x - z / 2, o.y - z / 2, z, z, z * 0.2); D.paint(c, o.color, D.INK, 3.2);
            D.sparkle(c, o.x, o.y, z * 0.2, '#fff');
            // the time left, as a shrinking bar under the square
            D.roundRect(c, o.x - s / 2, o.y + s / 2 + 6, s * left, 6, 3); D.paint(c, 'rgba(90,56,37,.55)');
          } else if (o.state === 'hit' && o.k < 0.4) {
            c.save(); c.globalAlpha = 1 - o.k / 0.4;
            var zz = s * (1 + o.k * 1.5);
            D.roundRect(c, o.x - zz / 2, o.y - zz / 2, zz, zz, zz * 0.2); D.paint(c, null, o.color, 4);
            c.restore();
          } else if (o.state === 'gone' && o.k < 0.3) {
            c.save(); c.globalAlpha = 0.5 * (1 - o.k / 0.3);
            D.roundRect(c, o.x - s / 2, o.y - s / 2, s, s, s * 0.2); D.paint(c, '#c9c1bb');
            c.restore();
          }
        });
      },
      peek: function () {   // for playtesting: the square that goes first
        var on = list.filter(function (o) { return o.state === 'on'; })[0];
        return on ? { x: on.x, y: on.y } : null;
      },
      down: function (q) {
        if (phase !== 'play') return;
        var best = null, bd = 1e9;
        list.forEach(function (o) { if (o.state !== 'on') return; var d = Math.hypot(q.x - o.x, q.y - o.y); if (d < bd) { bd = d; best = o; } });
        if (best && bd < p.size * 0.75) {
          best.state = 'hit'; best.k = 0; hits++; done++;
          api.sfx('pop'); api.burst(best.x, best.y, 8, '#fff6a8');
          api.progress(done, list.length);
        }
      }
    };
  }

  T.register({
    id: 'quicktouch', name: 'れんぞく タッチ', orig: '連続タッチ', kind: 'count',
    help: 'あちこちに しかくが でては きえるよ。\nきえる まえに すばやく タッチしてね！',
    levels: {
      e: { n: 16, every: 1.2, life: 2.0, size: 66 },
      n: { n: 20, every: 0.9, life: 1.45, size: 60 },
      h: { n: 24, every: 0.7, life: 1.1, size: 54 },
      a: { n: 28, every: 0.55, life: 0.85, size: 48 },
      test: { n: 20, every: 0.85, life: 1.3, size: 58 },
      testA: { n: 24, every: 0.55, life: 0.85, size: 48 },
      practice: { n: 5, every: 1.4, life: 2.6, size: 70 }
    },
    ranks: {
      e: [16, 15, 13, 11, 8, 5], n: [20, 19, 17, 14, 10, 6], h: [24, 22, 20, 16, 12, 7], a: [28, 26, 23, 19, 14, 8],
      test: [20, 19, 17, 14, 10, 6], testA: [24, 22, 20, 16, 12, 7]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = ((t || 0) * 1.2) % 1;
      [[28, 30, '#ff8fb0', 0], [70, 44, '#6cc6ff', 0.33], [40, 76, '#ffd23d', 0.66]].forEach(function (q) {
        var a = (k + q[3]) % 1, z = 26 * Math.min(1, a * 4) * (a > 0.8 ? (1 - a) * 5 : 1);
        if (z > 1) { D.roundRect(c, q[0] - z / 2, q[1] - z / 2, z, z, z * 0.2); D.paint(c, q[2], D.INK, 2.4); }
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
