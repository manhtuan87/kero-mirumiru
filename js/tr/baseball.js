/* やきゅう (動体視力, 眼と手の協応) — ケロちゃん is at bat. The pitcher
   throws; tap just as the ball reaches the plate to hit it. Fast balls, slow balls and (harder) curve balls.
   p.endless: どこまで いけるかな？, pitches until three misses, getting faster.
   おに: balls that vanish on the way (きえる まきゅう) and balls that change speed half way. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var MOUND = { x: 180, y: 190 }, PLATE = { x: 180, y: 500 }, SWEET = 482;

  // p: { n (pitches), time: [fast, slow] (s from hand to plate), slow (chance of a slow ball), curve (px) };
  // おに: vanish (chance of a ball that cannot be seen from 30 % to 65 % of the way), change (chance of a ball that is
  // fast first and slow at the end, or the other way; it still takes the same time to the plate)
  function gen(p, r, count) {
    var out = [];
    for (var i = 0; i < (count || p.n); i++) {
      var slow = r() < p.slow;
      var x = { time: slow ? p.time[1] : p.time[0] * (0.95 + r() * 0.1), curve: p.curve ? (r() < 0.5 ? -1 : 1) * p.curve * (0.5 + r() * 0.5) : 0, slow: slow };
      if (p.vanish && r() < p.vanish) x.vanish = true;
      if (p.change && r() < p.change) x.change = r() < 0.5 ? 1 : -1;
      out.push(x);
    }
    return out;
  }
  // How far the ball is (0 hand .. 1 plate) after u of its time: straight on, or (change) fast then slow / slow then fast.
  function along(P, u) {
    if (!P.change) return u;
    var a = P.change > 0 ? 1.4 : 0.6, b = 2 - a;   // (the speed in the first half and in the second: 70 % / 30 % of the way)
    return u < 0.5 ? a * u : a * 0.5 + b * (u - 0.5);
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var pitches = gen(p, api.rnd, p.endless ? 200 : p.n), pi = -1, P = null, phase = 'wait', pt = 0, bt = 0;
    var hits = 0, misses = 0, tries = 0, swing = -1, word = '', ballOut = null;

    function speedUp() { return p.endless ? Math.max(0.55, 1 - hits * 0.015) : 1; }
    function nextPitch() {
      pi++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.n) {
        phase = 'end';
        api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 600 });
        return;
      }
      P = pitches[pi % pitches.length]; phase = 'windup'; pt = 0; bt = 0; swing = -1; ballOut = null;
    }
    function ballAt(k) {   // k: 0 (hand) .. 1 (plate) and a bit further
      var y = MOUND.y + (PLATE.y - MOUND.y) * k;
      var x = MOUND.x + Math.sin(k * Math.PI * 0.9) * P.curve;
      return { x: x, y: y, r: 6 + 12 * k };
    }
    // swung: the player tapped now (otherwise the ball went by)
    function judge(swung) {
      tries++;
      var b = ballAt(Math.min(1.2, along(P, bt / (P.time * speedUp())))), d = Math.abs(b.y - SWEET);
      var ok = swung && d < 30;
      if (ok) {
        hits++;
        word = d < 11 ? 'ホームラン！' : 'ヒット！';
        api.sfx('ok'); if (d < 11) api.sfx('fanfare');
        api.burst(b.x, b.y, 10, '#fff6a8');
        ballOut = { x: b.x, y: b.y, vx: (b.x - 180) * 3 + (Math.random() - 0.5) * 120, vy: -520 - (d < 11 ? 220 : 0), t: 0 };
      } else {
        misses++;
        word = swing >= 0 ? 'からぶり' : 'ストライク';
        api.sfx('ng');
      }
      phase = 'after'; pt = 0;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.n);
    }

    return {
      theme: 2,
      begin: nextPitch,
      update: function (dt, playing) {
        pt += dt;
        if (ballOut) { ballOut.t += dt; ballOut.x += ballOut.vx * dt; ballOut.y += ballOut.vy * dt; ballOut.vy += 700 * dt; }
        if (!playing) return;
        if (phase === 'windup' && pt > 0.9) { phase = 'pitch'; pt = 0; bt = 0; api.sfx('whoosh'); }
        else if (phase === 'pitch') {
          bt += dt;
          var k = along(P, bt / (P.time * speedUp()));
          if (p.practice) { if (Math.abs(ballAt(k).y - SWEET) < 26) api.hand(250, 470); else api.hand(null); }
          if (k > 1.12) judge(false);
        } else if (phase === 'after' && pt > 1.1) nextPitch();
      },
      draw: function (c, clock) {
        // the field
        c.save();
        c.beginPath(); c.moveTo(180, 120); c.lineTo(380, 470); c.lineTo(380, 700); c.lineTo(-20, 700); c.lineTo(-20, 470); c.closePath();
        c.fillStyle = '#9fdc7c'; c.fill();
        c.beginPath(); c.moveTo(180, 300); c.lineTo(300, 470); c.lineTo(180, 600); c.lineTo(60, 470); c.closePath();
        c.fillStyle = '#e2b77f'; c.fill();
        c.restore();
        D.ellipse(c, MOUND.x, MOUND.y + 26, 42, 12); D.paint(c, '#d8a86c');
        // pitcher
        var arm = phase === 'windup' ? Math.sin(pt * 6) * 0.6 : phase === 'pitch' && bt < 0.15 ? 1 : 0;
        c.save(); c.translate(MOUND.x, MOUND.y); c.scale(0.42, 0.42);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: 'dog', look: { x: 0, y: 400 }, mode: arm > 0.5 ? 'happy' : 'idle', mt: pt });
        c.restore();
        // home plate
        c.beginPath(); c.moveTo(160, 510); c.lineTo(200, 510); c.lineTo(200, 522); c.lineTo(180, 534); c.lineTo(160, 522); c.closePath();
        D.paint(c, '#fffdf5', D.INK, 2.4);
        // the sweet spot, a soft ring
        D.circle(c, 180, SWEET, 34); D.paint(c, 'rgba(255,255,255,.28)', 'rgba(255,255,255,.7)', 3);
        // the ball
        var bk = phase === 'pitch' ? Math.min(1.2, along(P, bt / (P.time * speedUp()))) : 0;
        if (phase === 'pitch' && !(P.vanish && bk > 0.3 && bk < 0.65)) {   // (おに: the vanishing ball is not there for a while)
          var b = ballAt(bk);
          D.ellipse(c, b.x, b.y + b.r * 1.4, b.r * 0.9, b.r * 0.3); D.paint(c, 'rgba(0,0,0,.15)');
          D.circle(c, b.x, b.y, b.r); D.paint(c, '#fffdf5', D.INK, 2.2);
          c.beginPath(); c.arc(b.x - b.r * 0.9, b.y, b.r * 0.7, -0.9, 0.9); c.arc(b.x + b.r * 0.9, b.y, b.r * 0.7, Math.PI - 0.9, Math.PI + 0.9);
          D.paint(c, null, '#ff5a5a', 1.6);
        }
        if (ballOut && ballOut.t < 1.2) { D.circle(c, ballOut.x, ballOut.y, 10); D.paint(c, '#fffdf5', D.INK, 2); }
        // ケロちゃん at bat
        var sw = swing >= 0 && phase === 'after' ? Math.min(1, pt * 7) : 0;
        c.save(); c.translate(262, 566); c.scale(0.62, 0.62);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: api.partner === 'frog' ? 'frog' : api.partner, look: { x: -200, y: -200 }, mode: phase === 'after' && ballOut ? 'happy' : 'idle', mt: pt });
        c.restore();
        c.save(); c.translate(236, 540); c.rotate(-2.2 + sw * 2.4);
        D.roundRect(c, -6, -86, 12, 90, 6); D.paint(c, '#d9a066', D.INK, 2.6);
        c.restore();
        if (phase === 'after') A.text(c, L(word), 180, 330, word.length > 5 ? 34 : 40, ballOut ? '#ffd23d' : '#fff', { lw: 8 });
        if (phase === 'windup') A.text(c, L('ボールが きたら タッチ！'), 180, 104, 21, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 138, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting: tap now?
        if (phase !== 'pitch' || swing >= 0) return null;
        var b = ballAt(along(P, bt / (P.time * speedUp())));
        return Math.abs(b.y - SWEET) < 14 ? { now: true, x: 180, y: 400 } : null;   // (the hit counts within 30 px)
      },
      down: function () {
        if (phase !== 'pitch' || swing >= 0) return;
        swing = bt; api.sfx('whoosh');
        judge(true);
      }
    };
  }

  T.register({
    id: 'baseball', name: 'やきゅう', kind: 'count', sport: true,
    help: 'ピッチャーが ボールを なげるよ。\nボールが ホームに きた ときに\nタッチして うちかえそう！',
    oniHelp: 'とちゅうで きえる ボールや、\nはやさが かわる ボールが くるよ！',
    levels: {
      e: { n: 10, time: [1.6, 2.1], slow: 0.2, curve: 0 },
      n: { n: 10, time: [1.2, 1.7], slow: 0.25, curve: 0 },
      h: { n: 10, time: [0.95, 1.5], slow: 0.3, curve: 30 },
      ae: { n: 10, time: [0.95, 1.5], slow: 0.3, curve: 30 },
      a: { n: 10, time: [0.8, 1.35], slow: 0.3, curve: 45 },
      ah: { n: 10, time: [0.68, 1.2], slow: 0.35, curve: 60 },
      endless: { n: 10, time: [1.3, 1.8], slow: 0.25, curve: 20, endless: true },
      practice: { n: 3, time: [1.9, 1.9], slow: 0, curve: 0 },
      o: { n: 10, time: [1.0, 1.5], slow: 0.3, curve: 30, vanish: 0.4, change: 0.3 },
      ao: { n: 10, time: [0.72, 1.2], slow: 0.3, curve: 60, vanish: 0.5, change: 0.35 },
      practiceO: { n: 3, time: [1.9, 1.9], slow: 0, curve: 0, vanish: 1, change: 0 }
    },
    ranks: {
      e: [10, 9, 8, 6, 4, 2], n: [10, 9, 8, 6, 4, 2], h: [10, 9, 7, 5, 3, 2], o: [10, 9, 7, 5, 3, 2],
      ae: [10, 9, 7, 5, 3, 2], a: [10, 9, 7, 5, 3, 1], ah: [10, 9, 7, 5, 3, 1], ao: [10, 9, 7, 5, 3, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = ((t || 0) * 0.8) % 1;
      D.roundRect(c, 6, 6, 88, 88, 16); D.paint(c, '#9fdc7c', D.INK, 2.4);
      c.save(); c.translate(70, 78); c.rotate(-1.9 + (k > 0.7 ? 2 : 0));
      D.roundRect(c, -4, -54, 8, 56, 4); D.paint(c, '#d9a066', D.INK, 2);
      c.restore();
      var bx = 50, by = 16 + k * 60, br = 4 + k * 7;
      D.circle(c, bx, by, br); D.paint(c, '#fffdf5', D.INK, 1.8);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
