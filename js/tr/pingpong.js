/* たっきゅう (the original sports training: 卓球 — 動体視力, 眼球運動, 眼と手の協応) — the ball comes over the
   net, bounces, and flies towards you: tap the ball as it reaches your end to hit it back. Keep the rally going.
   p.endless: きろくに ちょうせん, until three misses, getting faster. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var TOP = 150, NET = 330, BOT = 510, ZONE = [455, 545];

  // p: { n (returns to make), time (s from the far end to you), spread (how far left and right it lands) }
  function gen(p, r, count) {
    var out = [];
    for (var i = 0; i < (count || p.n); i++) {
      out.push({ x0: 180 + (r() - 0.5) * 120, x1: 180 + (r() - 0.5) * p.spread * 2, bounce: 0.55 + r() * 0.15, spin: (r() - 0.5) * p.spin });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var shots = gen(p, api.rnd, p.endless ? 400 : p.n), si = -1, S0 = null, phase = 'wait', pt = 0, bt = 0;
    var hits = 0, misses = 0, tries = 0, back = null, word = '', wordT = 0;

    function dur() { return p.time * (p.endless ? Math.max(0.5, 1 - hits * 0.01) : 1); }
    function next() {
      si++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.n) {
        phase = 'end';
        api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 600 });
        return;
      }
      S0 = shots[si % shots.length]; phase = 'serve'; pt = 0; bt = 0;
    }
    // where the ball is: k 0 (the far end) .. 1 (your end) and beyond; it bounces once on your side
    function ballAt(k) {
      var y = TOP + (BOT - TOP) * k, x = S0.x0 + (S0.x1 - S0.x0) * k + Math.sin(k * Math.PI) * S0.spin;
      var hgt = k < S0.bounce ? Math.sin(k / S0.bounce * Math.PI) * 60 : Math.sin((k - S0.bounce) / (1.25 - S0.bounce) * Math.PI) * 45;
      return { x: x, y: y, h: Math.max(0, hgt), r: 8 + 6 * k };
    }
    function done(ok) {
      tries++;
      if (ok) hits++; else misses++;
      word = ok ? 'ナイス！' : 'ミス！'; wordT = 0.6;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.n);
    }

    return {
      theme: 0,
      begin: next,
      update: function (dt, playing) {
        pt += dt; wordT = Math.max(0, wordT - dt);
        if (back) { back.t += dt; }
        if (!playing) return;
        if (phase === 'serve' && pt > 0.45) { phase = 'come'; pt = 0; bt = 0; api.sfx('pop'); }
        else if (phase === 'come') {
          bt += dt;
          var k = bt / dur(), b = ballAt(k);
          if (p.practice) { if (b.y > ZONE[0]) api.hand(b.x + 8, b.y - b.h + 10); else api.hand(null); }
          if (b.y > ZONE[1] + 10) { done(false); api.ng(b.x, BOT, 30); phase = 'after'; pt = 0; }
        } else if (phase === 'after' && pt > 0.55) next();
      },
      draw: function (c) {
        // the table, seen from your end
        c.save();
        c.beginPath(); c.moveTo(70, TOP - 10); c.lineTo(290, TOP - 10); c.lineTo(340, BOT + 20); c.lineTo(20, BOT + 20); c.closePath();
        D.paint(c, '#3f8fd6', D.INK, 3.4);
        c.beginPath(); c.moveTo(180, TOP - 10); c.lineTo(180, BOT + 20); D.paint(c, null, 'rgba(255,255,255,.7)', 2.5);
        c.beginPath(); c.moveTo(60, NET); c.lineTo(300, NET); c.lineWidth = 8; c.strokeStyle = '#fffdf5'; c.stroke();
        c.beginPath(); c.moveTo(60, NET); c.lineTo(300, NET); D.paint(c, null, D.INK, 2);
        c.restore();
        // your zone
        D.roundRect(c, 20, ZONE[0], 320, ZONE[1] - ZONE[0], 18); D.paint(c, 'rgba(255,255,255,.18)', 'rgba(255,255,255,.55)', 2.5);
        // the other player (far)
        c.save(); c.translate(180, TOP - 12); c.scale(0.38, 0.38);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: 0, kind: 'rabbit', look: { x: 0, y: 300 }, mode: 'idle', mt: 0 });
        c.restore();
        if (phase === 'come') {
          var b = ballAt(bt / dur());
          D.ellipse(c, b.x, b.y, b.r * 0.9, b.r * 0.35); D.paint(c, 'rgba(0,0,0,.2)');
          D.circle(c, b.x, b.y - b.h, b.r); D.paint(c, '#fff6e0', D.INK, 2.2);
        }
        if (back && back.t < 0.5) {
          var kk = back.t / 0.5;
          D.circle(c, back.x + (180 - back.x) * kk, back.y + (TOP - back.y) * kk - Math.sin(kk * Math.PI) * 50, 12 - kk * 5); D.paint(c, '#fff6e0', D.INK, 2);
        }
        if (wordT > 0) A.text(c, L(word), 180, 590, 30, word === 'ナイス！' ? '#ffd23d' : '#fff', { lw: 7 });
        A.text(c, p.endless ? L('ラリー {n}', { n: hits }) : L('ボールを タッチして うちかえそう'), 180, 104, p.endless ? 26 : 20, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 138, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting: hit now?
        if (phase !== 'come') return null;
        var b = ballAt(bt / dur());
        return b.y > ZONE[0] + 20 && b.y < ZONE[1] - 20 ? { now: true, x: b.x, y: b.y - b.h } : null;
      },
      down: function (q) {
        if (phase !== 'come') return;
        var b = ballAt(bt / dur());
        if (b.y < ZONE[0] - 10) return;   // too early: nothing happens yet
        if (Math.hypot(q.x - b.x, q.y - (b.y - b.h)) < 70) {
          api.sfx('pop'); api.burst(b.x, b.y - b.h, 6, '#fff6a8');
          back = { x: b.x, y: b.y - b.h, t: 0 };
          done(true);
          phase = 'after'; pt = 0.15;
        }
      }
    };
  }

  T.register({
    id: 'pingpong', name: 'たっきゅう', orig: '卓球', kind: 'count', sport: true,
    help: 'あいてが うった ボールが とんで くるよ。\nてまえに きた ボールを タッチして\nうちかえそう！ ラリーを つづけてね',
    levels: {
      e: { n: 15, time: 1.7, spread: 50, spin: 0 },
      n: { n: 20, time: 1.3, spread: 80, spin: 20 },
      h: { n: 20, time: 1.0, spread: 110, spin: 40 },
      ae: { n: 20, time: 1.0, spread: 110, spin: 40 },
      a: { n: 24, time: 0.82, spread: 120, spin: 55 },
      ah: { n: 28, time: 0.7, spread: 130, spin: 70 },
      endless: { n: 20, time: 1.35, spread: 90, spin: 25, endless: true },
      practice: { n: 4, time: 2.0, spread: 30, spin: 0 }
    },
    ranks: { e: [15, 14, 12, 10, 7, 4], n: [20, 19, 17, 14, 10, 6], h: [20, 18, 16, 13, 9, 5], ae: [20, 18, 16, 13, 9, 5], a: [24, 22, 19, 15, 11, 6], ah: [28, 26, 22, 17, 12, 7] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = ((t || 0) * 0.9) % 1;
      c.beginPath(); c.moveTo(22, 14); c.lineTo(78, 14); c.lineTo(94, 90); c.lineTo(6, 90); c.closePath(); D.paint(c, '#3f8fd6', D.INK, 2.4);
      c.beginPath(); c.moveTo(12, 50); c.lineTo(88, 50); c.lineWidth = 4; c.strokeStyle = '#fffdf5'; c.stroke();
      D.circle(c, 40 + k * 20, 20 + k * 60 - Math.sin(k * Math.PI) * 14, 5 + k * 3); D.paint(c, '#fff6e0', D.INK, 1.8);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
