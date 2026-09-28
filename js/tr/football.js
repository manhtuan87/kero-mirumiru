/* アメフト (the original sports training: アメフト — 瞬間視, 周辺視野) — run up the field with the ball while
   the other team rushes at you. Tap the left or right side (or slide) to step into a free lane and get past.
   p.endless: きろくに ちょうせん, until three tackles. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var LANES = [80, 180, 280], ME_Y = 520;

  // p: { n (rushers), speed (px/s), every (s between waves), two (chance of two at once) }
  // Waves of one or two rushers, n rushers in all.
  function gen(p, r, count) {
    var out = [], left = count || p.n;
    while (left > 0) {
      var a = U.int(r, 0, 2), lanes = [a];
      if (left > 1 && r() < p.two) { var b = U.int(r, 0, 1); lanes.push(b >= a ? b + 1 : b); }
      out.push({ lanes: lanes, gap: p.every * (0.85 + r() * 0.3) });
      left -= lanes.length;
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var waves = gen(p, api.rnd, p.endless ? 400 : p.n), wi = 0, next = 1.0, rushers = [], me = 1, meX = LANES[1];
    var passed = 0, hits = 0, tackles = 0, phase = 'wait', stun = 0, scroll = 0, word = '', wordT = 0, drag = null;

    function speed() { return p.speed * (p.endless ? Math.min(1.8, 1 + passed * 0.012) : 1); }
    function finish() {
      phase = 'end';
      api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 700 });
    }
    function step(dir) {
      if (phase !== 'play' || stun > 0) return;
      var n = Math.max(0, Math.min(2, me + dir));
      if (n !== me) { me = n; api.sfx('step'); }
    }

    return {
      theme: 0,
      begin: function () { phase = 'play'; },
      update: function (dt, playing) {
        wordT = Math.max(0, wordT - dt);
        meX += (LANES[me] - meX) * Math.min(1, dt * 14);
        if (!playing || phase !== 'play') return;
        scroll += speed() * dt;
        stun = Math.max(0, stun - dt);
        next -= dt;
        if (next <= 0 && (p.endless || wi < waves.length)) {
          var w = waves[wi++ % waves.length];
          w.lanes.forEach(function (l) { rushers.push({ lane: l, y: 130, done: false }); });
          next = w.gap;
        }
        rushers.forEach(function (rs) {
          rs.y += speed() * 1.15 * dt;
          if (!rs.done && rs.y > ME_Y - 30 && rs.y < ME_Y + 20 && rs.lane === me && stun <= 0) {
            rs.done = true; rs.hit = true; tackles++;
            stun = 0.6; word = 'タックル！'; wordT = 0.7;
            api.sfx('bump'); api.ng(meX, ME_Y - 50, 28);
          } else if (!rs.done && rs.y > ME_Y + 20) {
            rs.done = true; passed++; hits++;
            word = 'よけた！'; wordT = 0.4; api.sfx('ok');
          }
        });
        rushers = rushers.filter(function (rs) { return rs.y < 700; });
        var total = p.endless ? 0 : p.n;
        api.progress(p.endless ? 0 : Math.min(total, passed + tackles), total);
        if (p.practice) {
          var danger = rushers.filter(function (rs) { return !rs.done && rs.lane === me && rs.y > ME_Y - 220; })[0];
          if (danger) api.hand(me === 2 ? 60 : 300, 560); else api.hand(null);
        }
        if (p.endless ? tackles >= 3 : (wi >= waves.length && !rushers.some(function (rs) { return !rs.done; }))) finish();
      },
      draw: function (c, clock) {
        // the field, its lines sliding down as you run
        D.roundRect(c, 10, 130, 340, 470, 12); D.paint(c, '#76c65a', D.INK, 3);
        c.save(); c.beginPath(); c.rect(10, 130, 340, 470); c.clip();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
        for (var y = 130 + (scroll % 70); y < 600; y += 70) { c.beginPath(); c.moveTo(10, y); c.lineTo(350, y); c.stroke(); }
        c.restore();
        rushers.forEach(function (rs) {
          if (rs.y < 130 || rs.y > 600) return;
          c.save(); c.translate(LANES[rs.lane], rs.y + 14); c.scale(0.42, 0.42);
          D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: 'dog', look: { x: 0, y: 300 }, mode: rs.hit ? 'happy' : 'idle', mt: 0 });
          c.restore();
          D.roundRect(c, LANES[rs.lane] - 16, rs.y + 13, 32, 15, 5); D.paint(c, '#ff6b6b', D.INK, 2);   // (on the body)
        });
        // you, with the ball
        c.save(); c.translate(meX, ME_Y + 16 + (stun > 0 ? Math.sin(stun * 30) * 3 : 0)); c.scale(0.5, 0.5);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: api.partner, look: { x: 0, y: -300 }, mode: stun > 0 ? 'sad' : 'idle', mt: 0 });
        c.restore();
        D.ellipse(c, meX + 22, ME_Y - 4, 11, 7, -0.5); D.paint(c, '#a8633a', D.INK, 2);
        // tap areas
        A.dirArrow(c, 40, 590, 0.9, 3, 'rgba(255,255,255,.8)');
        A.dirArrow(c, 320, 590, 0.9, 1, 'rgba(255,255,255,.8)');
        if (wordT > 0) A.text(c, L(word), 180, 400, 30, word === 'よけた！' ? '#ffd23d' : '#fff', { lw: 7 });
        A.text(c, L('ひだりか みぎを タッチして よけよう'), 180, 104, 20, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 150, 9, h < 3 - tackles ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting: step away from the nearest rusher in your lane
        if (phase !== 'play') return null;
        var danger = rushers.filter(function (rs) { return !rs.done && rs.lane === me && rs.y > ME_Y - 180; })[0];
        if (!danger) return null;
        var free = [0, 1, 2].filter(function (l) { return !rushers.some(function (rs) { return !rs.done && rs.lane === l && rs.y > ME_Y - 180; }); });
        if (!free.length) return null;
        var target = free.reduce(function (b, l) { return Math.abs(l - me) < Math.abs(b - me) ? l : b; }, free[0]);
        return { now: true, x: target < me ? 60 : 300, y: 560 };
      },
      down: function (q, id) { drag = { x: q.x, id: id, used: false }; },
      move: function (q, id) {
        if (!drag || drag.id !== id || drag.used) return;
        if (Math.abs(q.x - drag.x) > 36) { drag.used = true; step(q.x < drag.x ? -1 : 1); }
      },
      up: function (q, id) {
        if (drag && drag.id === id && !drag.used) step(q.x < meX ? -1 : 1);
        drag = null;
      }
    };
  }

  T.register({
    id: 'football', name: 'アメフト', orig: 'アメフト', kind: 'count', sport: true,
    help: 'ボールを もって はしるよ。\nあいてが つっこんで くるから、\nひだりか みぎを タッチして よけてね！',
    levels: {
      e: { n: 12, speed: 150, every: 1.6, two: 0 },
      n: { n: 15, speed: 200, every: 1.25, two: 0.25 },
      h: { n: 18, speed: 250, every: 1.0, two: 0.4 },
      ae: { n: 18, speed: 250, every: 1.0, two: 0.4 },
      a: { n: 20, speed: 300, every: 0.85, two: 0.5 },
      ah: { n: 24, speed: 350, every: 0.72, two: 0.6 },
      endless: { n: 15, speed: 200, every: 1.2, two: 0.3, endless: true },
      practice: { n: 4, speed: 120, every: 2.0, two: 0 }
    },
    ranks: { e: [12, 11, 10, 8, 6, 3], n: [15, 14, 12, 10, 7, 4], h: [18, 16, 14, 11, 8, 4], ae: [18, 16, 14, 11, 8, 4], a: [20, 18, 15, 12, 9, 5], ah: [24, 22, 18, 14, 10, 5] },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = Math.sin((t || 0) * 3);
      D.roundRect(c, 6, 6, 88, 88, 12); D.paint(c, '#76c65a', D.INK, 2.4);
      D.circle(c, 50 + k * 18, 74, 10); D.paint(c, '#86d65c', D.INK, 2);
      D.circle(c, 50, 30, 10); D.paint(c, '#ff6b6b', D.INK, 2);
      D.ellipse(c, 64 + k * 18, 70, 7, 4.5, -0.5); D.paint(c, '#a8633a', D.INK, 1.6);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
