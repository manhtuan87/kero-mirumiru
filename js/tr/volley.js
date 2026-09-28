/* バレー (the original sports training: バレー — 眼球運動, 周辺視野) — your teammate tosses the ball up by the
   net. Tap the ball while it is high up (in the band) to spike it into the other court.
   p.endless: きろくに ちょうせん, until three misses. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var FLOOR = 540, NET_X = 250, BAND = [170, 250];

  // p: { n (tosses), time (s up and down), spread (how far the tosses vary) }
  function gen(p, r, count) {
    var out = [];
    for (var i = 0; i < (count || p.n); i++) {
      out.push({ x0: 90 + r() * 40, x1: 140 + r() * p.spread, top: 140 + r() * 60, time: p.time * (0.85 + r() * 0.3) });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var tosses = gen(p, api.rnd, p.endless ? 300 : p.n), ti = -1, X = null, phase = 'wait', pt = 0, bt = 0;
    var hits = 0, misses = 0, tries = 0, spike = null, word = '', wordT = 0;

    function dur() { return X.time * (p.endless ? Math.max(0.55, 1 - hits * 0.012) : 1); }
    function next() {
      ti++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.n) {
        phase = 'end';
        api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 600 });
        return;
      }
      X = tosses[ti % tosses.length]; phase = 'set'; pt = 0; bt = 0; spike = null;
    }
    // the tossed ball: from the setter's hands up to its top and down again (k 0 .. 1)
    function ballAt(k) {
      var x = X.x0 + (X.x1 - X.x0) * k, start = 470;
      return { x: x, y: start - (start - X.top) * (1 - Math.pow(2 * k - 1, 2)) };
    }
    function done(ok) {
      tries++;
      if (ok) hits++; else misses++;
      word = ok ? 'スパイク！' : 'ミス！'; wordT = 0.8;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.n);
    }

    return {
      theme: 4,
      begin: next,
      update: function (dt, playing) {
        pt += dt; wordT = Math.max(0, wordT - dt);
        if (spike) spike.t += dt;
        if (!playing) return;
        if (phase === 'set' && pt > 0.5) { phase = 'toss'; pt = 0; bt = 0; api.sfx('pop'); }
        else if (phase === 'toss') {
          bt += dt;
          var k = bt / dur(), b = ballAt(k);
          if (p.practice) { if (b.y > BAND[0] && b.y < BAND[1] && k > 0.2) api.hand(b.x + 8, b.y + 10); else api.hand(null); }
          if (k > 1) { done(false); phase = 'after'; pt = 0; api.sfx('ng'); }
        } else if (phase === 'after' && pt > 0.9) next();
      },
      draw: function (c, clock) {
        // the court in side view: floor, net
        D.roundRect(c, -10, FLOOR, 380, 40, 0); D.paint(c, '#e9b877');
        c.beginPath(); c.moveTo(-10, FLOOR); c.lineTo(370, FLOOR); D.paint(c, null, D.INK, 3);
        D.roundRect(c, NET_X - 3, 230, 6, FLOOR - 230, 3); D.paint(c, '#fffdf5', D.INK, 2);
        c.save(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5;
        for (var y = 240; y < 330; y += 12) { c.beginPath(); c.moveTo(NET_X - 3, y); c.lineTo(NET_X + 3, y); c.stroke(); }
        c.restore();
        D.roundRect(c, NET_X - 5, 230, 10, 100, 4); D.paint(c, 'rgba(255,255,255,.45)', D.INK, 2);
        // the band where a spike works
        D.roundRect(c, 20, BAND[0], NET_X - 30, BAND[1] - BAND[0], 16); D.paint(c, 'rgba(255,255,255,.2)', 'rgba(255,255,255,.7)', 2.5);
        // the setter
        c.save(); c.translate(110, FLOOR - 10); c.scale(0.55, 0.55);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: 'cat', look: { x: 60, y: -200 }, mode: 'idle', mt: pt });
        c.restore();
        // you, jumping when you spike
        var jump = spike ? Math.sin(Math.min(1, spike.t * 2.5) * Math.PI) * 60 : 0;
        c.save(); c.translate(200, FLOOR - 10 - jump); c.scale(0.55, 0.55);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: api.partner, look: { x: -100, y: -200 }, mode: spike ? 'happy' : 'idle', mt: spike ? spike.t : 0 });
        c.restore();
        if (phase === 'toss') { var b = ballAt(bt / dur()); ball(c, b.x, b.y); }
        if (spike && spike.t < 0.6) {
          var kk = spike.t / 0.6;
          ball(c, spike.x + (330 - spike.x) * kk, spike.y + (FLOOR - 16 - spike.y) * kk);
        }
        if (wordT > 0) A.text(c, L(word), 180, 330, 34, word === 'スパイク！' ? '#ffd23d' : '#fff', { lw: 8 });
        A.text(c, L('たかい ところで タッチ！'), 180, 104, 22, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 138, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting: spike now?
        if (phase !== 'toss') return null;
        var k = bt / dur(), b = ballAt(k);
        return k > 0.3 && b.y > BAND[0] + 12 && b.y < BAND[1] - 12 ? { now: true, x: b.x, y: b.y } : null;
      },
      down: function (q) {
        if (phase !== 'toss') return;
        var b = ballAt(bt / dur());
        if (Math.hypot(q.x - b.x, q.y - b.y) > 70) return;
        var ok = b.y >= BAND[0] - 8 && b.y <= BAND[1] + 8 && bt / dur() > 0.2;
        if (ok) { spike = { x: b.x, y: b.y, t: 0 }; api.sfx('thud'); api.burst(b.x, b.y, 8, '#fff6a8'); }
        else api.sfx('ng');
        done(ok);
        phase = 'after'; pt = 0;
      }
    };
    function ball(c, x, y) {
      D.circle(c, x, y, 13); D.paint(c, '#fffdf5', D.INK, 2.4);
      c.save(); c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.clip();
      c.strokeStyle = '#ffd23d'; c.lineWidth = 4;
      c.beginPath(); c.arc(x - 12, y - 8, 16, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#6cc6ff';
      c.beginPath(); c.arc(x + 12, y + 8, 16, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
  }

  T.register({
    id: 'volley', name: 'バレー', orig: 'バレー', kind: 'count', sport: true,
    help: 'みかたが ボールを あげるよ。\nボールが たかい ところ（しろい おび）に\nきたら タッチして スパイク！',
    levels: {
      e: { n: 10, time: 2.2, spread: 30 },
      n: { n: 10, time: 1.7, spread: 60 },
      h: { n: 12, time: 1.35, spread: 80 },
      a: { n: 12, time: 1.1, spread: 90 },
      endless: { n: 10, time: 1.8, spread: 60, endless: true },
      practice: { n: 3, time: 2.6, spread: 20 }
    },
    ranks: { e: [10, 9, 8, 6, 4, 2], n: [10, 9, 8, 6, 4, 2], h: [12, 11, 9, 7, 5, 3], a: [12, 11, 9, 7, 5, 3] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = ((t || 0) * 0.8) % 1, y = 80 - Math.sin(k * Math.PI) * 58;
      D.roundRect(c, 70, 34, 5, 60, 2); D.paint(c, '#fffdf5', D.INK, 1.8);
      D.circle(c, 36 + k * 20, y, 10); D.paint(c, '#fffdf5', D.INK, 2);
      c.save(); c.beginPath(); c.arc(36 + k * 20, y, 10, 0, Math.PI * 2); c.clip(); c.strokeStyle = '#ffd23d'; c.lineWidth = 3;
      c.beginPath(); c.arc(26 + k * 20, y - 6, 12, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
