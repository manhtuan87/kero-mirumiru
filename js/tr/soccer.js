/* サッカー (周辺視野, 眼球運動) — you have the ball. Look around:
   the other team (red) stands in the way of all your teammates but one. Slide from the ball towards the free
   teammate to pass (a tap on the teammate works too). p.endless: どこまで いけるかな？, until three misses.
   おに: part of the way through the time, a defender moves over to the free teammate — and another one is free. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BALL = { x: 180, y: 540 }, BOX = { x0: 50, y0: 180, x1: 310, y1: 420 };

  function lerp(a, b, k) { return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }

  // Where teammates may stand: above the ball, inside the pitch; seen from the ball, from A0 (left) to A1 (right).
  var FIELD = { x0: 40, x1: 320, y0: 180, y1: 430 }, A0 = -2.45, A1 = -0.69, GAP = 0.48;

  // p: { n (plays), mates, extra (defenders that block nobody), time (s to pass) }; おに: shift (chance that a defender moves)
  function gen(p, r, count) {
    var out = [];
    for (var i = 0; i < (count || p.n); i++) out.push(withShift(p, r, play(p, r)));
    return out;
  }
  // おに: the defender in the way of another teammate moves over to the free one, so that other teammate is free now.
  // play.shift = { at (part of the time), def (which defender), to (where it goes), free (the teammate free after it) }
  function withShift(p, r, X) {
    if (!p.shift || r() >= p.shift || X.mates.length < 2) return X;
    var nf = U.pick(r, U.range(0, X.mates.length - 1).filter(function (k) { return k !== X.free; })), j = -1, bd = 1e9;
    X.defs.forEach(function (d, k) { var dd = distToLine(d, BALL, X.mates[nf]); if (dd < bd) { bd = dd; j = k; } });
    if (j < 0 || bd > 34) return X;
    var q = lerp(BALL, X.mates[X.free], 0.5 + r() * 0.2), to = { x: q.x + (r() - 0.5) * 10, y: q.y + (r() - 0.5) * 10 };
    var defs2 = X.defs.map(function (d, k) { return k === j ? to : d; });
    if (defs2.some(function (d) { return distToLine(d, BALL, X.mates[nf]) < 34; })) return X;
    X.shift = { at: 0.35 + r() * 0.25, def: j, to: to, free: nf };
    return X;
  }
  // One play: the teammates stand in clearly different directions from the ball (so a slide picks one of them),
  // a defender stands on the way to each of them but one, and nobody stands on the way to that free one.
  function play(p, r) {
    for (var tries = 0; tries < 100; tries++) {
      var gap = GAP + r() * Math.max(0, Math.min(0.8, (A1 - A0) / Math.max(1, p.mates - 1)) - GAP);
      var a0 = A0 + r() * Math.max(0, (A1 - A0) - gap * (p.mates - 1)), mates = [];
      for (var k = 0; k < p.mates; k++) {
        var a = a0 + k * gap, ca = Math.cos(a), sa = -Math.sin(a);   // (sa > 0: up the pitch)
        var dmin = (BALL.y - FIELD.y1) / sa, dmax = Math.min((BALL.y - FIELD.y0) / sa, Math.abs(ca) > 0.01 ? (ca < 0 ? BALL.x - FIELD.x0 : FIELD.x1 - BALL.x) / Math.abs(ca) : 1e9);
        if (dmax < dmin) break;
        var d = dmin + r() * (dmax - dmin);
        mates.push({ x: BALL.x + ca * d, y: BALL.y - sa * d });
      }
      if (mates.length < p.mates) continue;
      var apart = mates.every(function (m, i) { return mates.every(function (n, j) { return i === j || Math.hypot(m.x - n.x, m.y - n.y) >= 70; }); });
      if (!apart) continue;
      var free = U.int(r, 0, p.mates - 1), defs = [], clear = true;
      mates.forEach(function (m, j) {
        if (j === free) return;
        var q = lerp(BALL, m, 0.5 + r() * 0.2), dd = { x: q.x + (r() - 0.5) * 10, y: q.y + (r() - 0.5) * 10 };
        if (distToLine(dd, BALL, mates[free]) < 34) clear = false;
        defs.push(dd);
      });
      if (!clear) continue;
      // the rest stand somewhere that does not block the free teammate
      for (var e = 0; e < p.extra; e++) {
        for (var t = 0; t < 40; t++) {
          var x = { x: BOX.x0 + r() * (BOX.x1 - BOX.x0), y: BOX.y0 + r() * (BOX.y1 - BOX.y0 + 60) };
          if (distToLine(x, BALL, mates[free]) > 50 && mates.every(function (m) { return Math.hypot(m.x - x.x, m.y - x.y) > 50; }) &&
            defs.every(function (o) { return Math.hypot(o.x - x.x, o.y - x.y) > 40; })) { defs.push(x); break; }
        }
      }
      return { mates: mates, free: free, defs: defs, sway: r() * 6 };
    }
    // (never needed in practice) a fixed play
    var fm = U.range(0, p.mates - 1).map(function (k) { return { x: 60 + k * (240 / Math.max(1, p.mates - 1)), y: 250 }; });
    return { mates: fm, free: 0, defs: fm.slice(1).map(function (m) { return lerp(BALL, m, 0.6); }), sway: 0 };
  }
  function distToLine(q, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, k = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2));
    return Math.hypot(q.x - (a.x + dx * k), q.y - (a.y + dy * k));
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var plays = gen(p, api.rnd, p.endless ? 200 : p.n), pi = -1, X = null, phase = 'wait', pt = 0;
    var hits = 0, misses = 0, tries = 0, drag = null, kick = null, word = '', wordT = 0;
    var shiftGo = -1;   // (おに: when the defender started to move, -1 not yet)
    function freeNow() { return X.shift && shiftGo >= 0 ? X.shift.free : X.free; }
    function defAt(k) {
      if (!X.shift || k !== X.shift.def || shiftGo < 0) return X.defs[k];
      var e = Math.min(1, (pt - shiftGo) / 0.35); e = e * e * (3 - 2 * e);
      return lerp(X.defs[k], X.shift.to, e);
    }

    function limit() { return p.time * (p.endless ? Math.max(0.55, 1 - hits * 0.015) : 1); }
    function next() {
      pi++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.n) {
        phase = 'end';
        api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 600 });
        return;
      }
      X = plays[pi % plays.length]; phase = 'look'; pt = 0; kick = null; shiftGo = -1;
    }
    function done(ok, w) {
      tries++;
      if (ok) { hits++; api.sfx('ok'); } else misses++;
      word = w; wordT = 0.8;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.n);
      phase = 'after'; pt = 0;
    }
    // Kick towards (tx, ty): the teammate closest to that direction gets it, unless the line is blocked.
    function kickTo(tx, ty) {
      var a = Math.atan2(ty - BALL.y, tx - BALL.x), best = -1, bd = 1e9;
      X.mates.forEach(function (m, k) {
        var d = Math.abs(Math.atan2(Math.sin(Math.atan2(m.y - BALL.y, m.x - BALL.x) - a), Math.cos(Math.atan2(m.y - BALL.y, m.x - BALL.x) - a)));
        if (d < bd) { bd = d; best = k; }
      });
      api.sfx('whoosh');
      if (best < 0 || bd > 0.35) { kick = { to: { x: BALL.x + Math.cos(a) * 420, y: BALL.y + Math.sin(a) * 420 }, t: 0 }; done(false, 'そとへ…'); return; }
      var m = X.mates[best];
      if (best === freeNow()) { kick = { to: m, t: 0 }; api.sfx('cheer'); done(true, 'ナイスパス！'); }
      else {
        var blocker = X.defs.map(function (d, k) { return defAt(k); }).reduce(function (b, d) { return !b || distToLine(d, BALL, m) < distToLine(b, BALL, m) ? d : b; }, null);
        kick = { to: blocker || m, t: 0 }; done(false, 'とられた！');
      }
    }

    return {
      theme: 0,
      begin: next,
      update: function (dt, playing) {
        pt += dt; wordT = Math.max(0, wordT - dt);
        if (kick) kick.t += dt;
        if (!playing) return;
        if (phase === 'look' && pt > 0.35) { phase = 'play'; pt = 0; }
        else if (phase === 'play') {
          if (X.shift && shiftGo < 0 && pt >= X.shift.at * limit()) { shiftGo = pt; api.sfx('step'); }   // (おに: a defender moves)
          if (p.practice && pt > 1.8 && !(X.shift && shiftGo < 0)) { var f = X.mates[freeNow()]; api.hand(f.x + 8, f.y + 10); }
          if (pt > limit()) { api.ng(BALL.x, BALL.y - 40, 30); done(false, 'おそい！'); }
        } else if (phase === 'after' && pt > 0.9) next();
      },
      draw: function (c, clock) {
        // the pitch
        D.roundRect(c, 10, 140, 340, 460, 14); D.paint(c, '#8fd46a', D.INK, 3);
        c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
        c.strokeRect(100, 140, 160, 70);
        c.beginPath(); c.arc(180, 600, 70, Math.PI, Math.PI * 2); c.stroke();
        c.restore();
        D.roundRect(c, 130, 132, 100, 14, 4); D.paint(c, '#fffdf5', D.INK, 2.4);
        if (!X) return;
        var sway = Math.sin(clock * 3 + X.sway) * 3;
        X.defs.forEach(function (d0, k) { var d = defAt(k); player(c, d.x + sway, d.y, '#ff6b6b', clock); });
        X.mates.forEach(function (m, k) { player(c, m.x, m.y, '#5ccf52', clock, phase === 'after' && k === freeNow() && hits && word === 'ナイスパス！'); });
        // you and the ball
        c.save(); c.translate(BALL.x, BALL.y + 34); c.scale(0.5, 0.5);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: api.partner, look: { x: 0, y: -300 }, mode: 'idle', mt: 0 });
        c.restore();
        var bp = kick ? lerp(BALL, kick.to, Math.min(1, kick.t / 0.45)) : BALL;
        soccerBall(c, bp.x, bp.y - (kick ? 0 : 20), 11);
        if (drag && drag.moved) { c.save(); c.setLineDash([6, 6]); c.beginPath(); c.moveTo(BALL.x, BALL.y - 20); c.lineTo(drag.x, drag.y); D.paint(c, null, 'rgba(255,255,255,.9)', 3); c.restore(); }
        if (phase === 'play') {
          var left = Math.max(0, 1 - pt / limit());
          D.roundRect(c, 80, 612, 200 * left, 8, 4); D.paint(c, 'rgba(90,56,37,.6)');
        }
        if (wordT > 0) A.text(c, L(word), 180, 470, 30, word === 'ナイスパス！' ? '#ffd23d' : '#fff', { lw: 7 });
        A.text(c, L('フリーの みかたに パス！'), 180, 104, 22, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 164, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting: slide towards the free teammate
        if (phase !== 'play' || (X.shift && shiftGo < 0)) return null;   // (おに: a good player waits to see who is free)
        var f = X.mates[freeNow()];
        return { swipe: [BALL.x, BALL.y - 20, BALL.x + (f.x - BALL.x) * 0.4, BALL.y - 20 + (f.y - BALL.y) * 0.4] };
      },
      down: function (q, id) { if (phase === 'play') drag = { x0: q.x, y0: q.y, x: q.x, y: q.y, id: id, moved: false }; },
      move: function (q, id) {
        if (!drag || drag.id !== id) return;
        drag.x = q.x; drag.y = q.y;
        if (Math.hypot(q.x - drag.x0, q.y - drag.y0) > 30) drag.moved = true;
      },
      up: function (q, id) {
        if (!drag || drag.id !== id || phase !== 'play') { drag = null; return; }
        var d = drag; drag = null;
        if (d.moved) kickTo(BALL.x + (q.x - d.x0), BALL.y + (q.y - d.y0));
        else {
          // a tap on a teammate passes to them too
          var m = X.mates.filter(function (mm) { return Math.hypot(mm.x - q.x, mm.y - q.y) < 40; })[0];
          if (m) kickTo(m.x, m.y);
        }
      }
    };
    function player(c, x, y, shirt, clock, happy) {
      c.save(); c.translate(x, y + 16); c.scale(0.36, 0.36);
      D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: shirt === '#5ccf52' ? 'frog' : 'dog', look: null, mode: happy ? 'happy' : 'idle', mt: 0 });
      c.restore();
      D.roundRect(c, x - 14, y + 14, 28, 13, 5); D.paint(c, shirt, D.INK, 2);   // (on the body)
    }
    function soccerBall(c, x, y, r) {
      D.circle(c, x, y, r); D.paint(c, '#fffdf5', D.INK, 2.4);
      D.circle(c, x, y, r * 0.38); D.paint(c, '#3a2d25');
      for (var k = 0; k < 5; k++) { var a = k * Math.PI * 0.4 - Math.PI / 2; D.circle(c, x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, r * 0.2); D.paint(c, '#3a2d25'); }
    }
  }

  T.register({
    id: 'soccer', name: 'サッカー', kind: 'count', sport: true,
    help: 'あかい あいてが じゃまを しているよ。\nじゃまされて いない みかた（みどり）へ\nボールから ゆびを スライドして パス！',
    oniHelp: 'パスの まえに あいてが うごくよ。\nさいごまで よく みてね！',
    levels: {
      e: { n: 8, mates: 2, extra: 0, time: 5 },
      n: { n: 10, mates: 3, extra: 1, time: 4 },
      h: { n: 10, mates: 3, extra: 2, time: 3 },
      ae: { n: 10, mates: 3, extra: 2, time: 3 },
      a: { n: 12, mates: 4, extra: 2, time: 2.4 },
      ah: { n: 12, mates: 4, extra: 3, time: 2.0 },
      endless: { n: 10, mates: 3, extra: 1, time: 4, endless: true },
      practice: { n: 3, mates: 2, extra: 0, time: 8 },
      o: { n: 10, mates: 3, extra: 2, time: 3.2, shift: 0.6 },
      ao: { n: 12, mates: 4, extra: 3, time: 2.2, shift: 0.8 },
      practiceO: { n: 3, mates: 2, extra: 0, time: 8, shift: 1 }
    },
    ranks: {
      e: [8, 7, 6, 5, 3, 2], n: [10, 9, 8, 6, 4, 2], h: [10, 9, 8, 6, 4, 2], o: [10, 9, 8, 6, 4, 2],
      ae: [10, 9, 8, 6, 4, 2], a: [12, 11, 9, 7, 5, 3], ah: [12, 11, 9, 7, 5, 3], ao: [12, 11, 9, 7, 5, 3]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = ((t || 0) * 0.8) % 1;
      D.roundRect(c, 6, 6, 88, 88, 12); D.paint(c, '#8fd46a', D.INK, 2.4);
      D.circle(c, 26, 30, 9); D.paint(c, '#5ccf52', D.INK, 2); D.circle(c, 74, 30, 9); D.paint(c, '#5ccf52', D.INK, 2);
      D.circle(c, 62, 50, 9); D.paint(c, '#ff6b6b', D.INK, 2);
      var bx = 50 + (26 - 50) * k, by = 80 + (30 - 80) * k;
      D.circle(c, bx, by, 7); D.paint(c, '#fffdf5', D.INK, 1.8);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
