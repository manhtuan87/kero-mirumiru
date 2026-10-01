/* ぽんぽん タッチ (眼と手の協応) — squares pop up here and there and fade away.
   Tap each one before it is gone.
   おに: the squares drift about, and dark squares with a × come too — those must not be touched (they go away
   by themselves). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 50, y0: 150, x1: 310, y1: 560 }, SIZE = 58;
  var COLORS = ['#ff8fb0', '#6cc6ff', '#ffd23d', '#8bd86a', '#b58cff', '#ffa552'];
  var BAD_COLOR = '#6b4a3a';

  // p: { n (squares), every (s between them), life (s each), size }; おに: bad (× squares besides the n), drift (px/s)
  function gen(p, r) {
    var out = [], t = 0.3, total = p.n + (p.bad || 0);
    // the × squares go somewhere after the first two (never two in a row)
    var bads = {}, left = p.bad || 0;
    for (var tries = 0; left > 0 && tries < 500; tries++) {
      var at = U.int(r, 2, total - 1);
      if (!bads[at] && !bads[at - 1] && !bads[at + 1]) { bads[at] = true; left--; }
    }
    for (var i = 0; i < total; i++) {
      var q = null;
      for (var k = 0; k < 40; k++) {
        q = { x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: BOX.y0 + r() * (BOX.y1 - BOX.y0) };
        // away from the ones that may still be showing
        var clear = out.every(function (o) { return o.at + o.life < t || Math.hypot(o.x - q.x, o.y - q.y) > p.size * 1.4; });
        if (clear) break;
      }
      var a = r() * Math.PI * 2, v = (p.drift || 0) * (0.7 + r() * 0.6);
      out.push({ x: q.x, y: q.y, at: t, life: p.life, color: COLORS[i % COLORS.length], bad: !!bads[i], vx: Math.cos(a) * v, vy: Math.sin(a) * v });
      t += p.every * (0.8 + r() * 0.4);
    }
    return out;
  }
  // Where a square is at time t: drifting squares bounce inside the box.
  function where(o, t) {
    if (!o.vx && !o.vy) return { x: o.x, y: o.y };
    var k = Math.max(0, t - o.at);
    function bounce(v, a, b) { var w = b - a, x = ((v - a) % (2 * w) + 2 * w) % (2 * w); return a + (x > w ? 2 * w - x : x); }
    return { x: bounce(o.x + o.vx * k, BOX.x0, BOX.x1), y: bounce(o.y + o.vy * k, BOX.y0, BOX.y1) };
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var list = gen(p, api.rnd), t = 0, hits = 0, bads = 0, done = 0, phase = 'wait', pt = 0;
    var goods = list.filter(function (o) { return !o.bad; }).length;
    list.forEach(function (o) { o.state = 'wait'; o.k = 0; });

    return {
      theme: 3,
      begin: function () { phase = 'play'; api.progress(0, goods); },
      update: function (dt, playing) {
        pt += dt;
        list.forEach(function (o) { if (o.state === 'hit' || o.state === 'gone' || o.state === 'oops') o.k += dt; });
        if (!playing || phase !== 'play') return;
        t += dt;
        list.forEach(function (o) {
          if (o.state === 'wait' && t >= o.at) { o.state = 'on'; api.sfx('pop'); }
          else if (o.state === 'on' && t >= o.at + o.life) {
            // (a × square that was left alone is just right: it goes away)
            o.state = 'gone'; o.k = 0; o.pos = where(o, t);
            if (!o.bad) { done++; api.progress(done, goods); }
          }
        });
        if (p.practice) {
          var on = list.filter(function (o) { return o.state === 'on' && !o.bad; })[0];
          if (on) { var w = where(on, t); api.hand(w.x + 8, w.y + 10); } else api.hand(null);
        }
        if (list.every(function (o) { return o.state !== 'wait' && o.state !== 'on'; })) {
          phase = 'end'; api.hand(null);
          var score = Math.max(0, hits - bads);
          api.finish({ score: score, acc: score / goods, text: U.res.hit(score, goods), delay: 500 });
        }
      },
      draw: function (c, clock) {
        A.text(c, L(p.bad ? 'きえる まえに タッチ！ ×は さわらないでね' : 'きえる まえに タッチ！'), 180, 104, p.bad ? 18 : 22, '#fff', { lw: 6, max: 330 });
        list.forEach(function (o) {
          if (o.state === 'wait') return;
          var s = p.size, left = o.state === 'on' ? Math.max(0, 1 - (t - o.at) / o.life) : 0;
          var q = o.state === 'on' ? where(o, t) : o.pos || where(o, t);
          if (o.state === 'on') {
            var pop = Math.min(1, (t - o.at) * 7), z = s * (0.6 + 0.4 * pop);
            D.roundRect(c, q.x - z / 2, q.y - z / 2, z, z, z * 0.2); D.paint(c, o.bad ? BAD_COLOR : o.color, D.INK, 3.2);
            if (o.bad) {   // (a big ×: do not touch)
              c.save(); c.lineCap = 'round'; c.strokeStyle = '#fff'; c.lineWidth = z * 0.12;
              c.beginPath(); c.moveTo(q.x - z * 0.24, q.y - z * 0.24); c.lineTo(q.x + z * 0.24, q.y + z * 0.24);
              c.moveTo(q.x + z * 0.24, q.y - z * 0.24); c.lineTo(q.x - z * 0.24, q.y + z * 0.24); c.stroke(); c.restore();
            } else D.sparkle(c, q.x, q.y, z * 0.2, '#fff');
            // the time left, as a shrinking bar under the square
            D.roundRect(c, q.x - s / 2, q.y + s / 2 + 6, s * left, 6, 3); D.paint(c, 'rgba(90,56,37,.55)');
          } else if (o.state === 'hit' && o.k < 0.4) {
            c.save(); c.globalAlpha = 1 - o.k / 0.4;
            var zz = s * (1 + o.k * 1.5);
            D.roundRect(c, q.x - zz / 2, q.y - zz / 2, zz, zz, zz * 0.2); D.paint(c, null, o.color, 4);
            c.restore();
          } else if ((o.state === 'gone' || o.state === 'oops') && o.k < 0.3) {
            c.save(); c.globalAlpha = 0.5 * (1 - o.k / 0.3);
            D.roundRect(c, q.x - s / 2, q.y - s / 2, s, s, s * 0.2); D.paint(c, '#c9c1bb');
            c.restore();
          }
        });
      },
      peek: function () {   // for playtesting: the square that goes first (never a × square)
        var on = list.filter(function (o) { return o.state === 'on' && !o.bad; })[0];
        if (!on) return null;
        var w = where(on, t);
        return { x: w.x, y: w.y };
      },
      down: function (q) {
        if (phase !== 'play') return;
        var best = null, bd = 1e9;
        list.forEach(function (o) { if (o.state !== 'on') return; var w = where(o, t), d = Math.hypot(q.x - w.x, q.y - w.y); if (d < bd) { bd = d; best = o; } });
        if (best && bd < p.size * 0.75) {
          best.pos = where(best, t); best.k = 0;
          if (best.bad) {   // (a × square: a mistake)
            best.state = 'oops'; bads++;
            api.ng(best.pos.x, best.pos.y, 26);
            return;
          }
          best.state = 'hit'; hits++; done++;
          api.sfx('ok'); api.burst(best.pos.x, best.pos.y, 8, '#fff6a8');
          api.progress(done, goods);
        } else api.sfx('ng');   // (a tap where there is no square)
      }
    };
  }

  T.register({
    id: 'quicktouch', name: 'ぽんぽん タッチ', kind: 'count',
    help: 'あちこちに しかくが でては きえるよ。\nきえる まえに すばやく タッチしてね！',
    oniHelp: 'しかくが うごくよ。\n×の しかくは さわらないでね！',
    levels: {
      e: { n: 16, every: 1.2, life: 2.0, size: 66 },
      n: { n: 20, every: 0.9, life: 1.45, size: 60 },
      h: { n: 24, every: 0.7, life: 1.1, size: 54 },
      o: { n: 24, bad: 6, every: 0.7, life: 1.2, size: 54, drift: 40 },
      ae: { n: 24, every: 0.7, life: 1.05, size: 52 },
      a: { n: 28, every: 0.55, life: 0.85, size: 48 },
      ah: { n: 32, every: 0.45, life: 0.7, size: 42 },
      ao: { n: 32, bad: 10, every: 0.45, life: 0.8, size: 44, drift: 70 },
      test: { n: 20, every: 0.85, life: 1.3, size: 58 },
      testA: { n: 24, every: 0.55, life: 0.85, size: 48 },
      practice: { n: 5, every: 1.4, life: 2.6, size: 70 },
      practiceO: { n: 6, bad: 2, every: 1.4, life: 2.6, size: 70, drift: 20 }
    },
    ranks: {
      e: [16, 15, 13, 11, 8, 5], n: [20, 19, 17, 14, 10, 6], h: [24, 22, 20, 16, 12, 7], o: [24, 22, 20, 16, 12, 7],
      ae: [24, 22, 20, 16, 12, 7], a: [28, 26, 23, 19, 14, 8], ah: [32, 30, 26, 21, 16, 9], ao: [32, 30, 26, 21, 16, 9],
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
