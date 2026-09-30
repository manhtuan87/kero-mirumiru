/* バスケット (the original sports training: バスケット — 瞬間視, 眼球運動, 周辺視野) — players run in: green
   shirts are your team, orange shirts the other team. Then they all turn into shadows (and move about).
   Tap your teammates. p.endless: きろくに ちょうせん, rounds until three misses.
   おに: as shadows, a teammate and a player of the other team change places, one pair after another. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var BOX = { x0: 60, y0: 200, x1: 300, y1: 500 };
  var KINDS = ['frog', 'rabbit', 'cat', 'dog'];
  var MOVE_T = 1.2, SWAP_T = 0.85;   // (the shadows' first move; each change of places, おに)

  // p: { rounds, players, mates, show (s in colour), move (px the shadows move) };
  // おに: swaps (how many times a teammate and a player of the other team change places: pl[k].path = the places after each)
  function gen(p, r, count) {
    var out = [];
    for (var i = 0; i < (count || p.rounds); i++) {
      var pts = U.scatter(r, p.players, BOX, 92) || U.range(0, p.players - 1).map(function (k) { return { x: 80 + (k % 3) * 100, y: 240 + Math.floor(k / 3) * 150 }; });
      var ends = pts.map(function (q) {
        var a = r() * Math.PI * 2;
        return { x: Math.max(BOX.x0, Math.min(BOX.x1, q.x + Math.cos(a) * p.move)), y: Math.max(BOX.y0, Math.min(BOX.y1, q.y + Math.sin(a) * p.move)) };
      });
      var mates = U.sample(r, U.range(0, p.players - 1), p.mates);
      var pl = pts.map(function (q, k) {
        return { x: q.x, y: q.y, x1: ends[k].x, y1: ends[k].y, mate: mates.indexOf(k) >= 0, kind: KINDS[U.int(r, 0, 3)], from: r() < 0.5 ? -1 : 1 };
      });
      if (p.swaps) {
        var at = pl.map(function (q) { return { x: q.x1, y: q.y1 }; });
        pl.forEach(function (q, k) { q.path = [at[k]]; });
        for (var sw = 0; sw < p.swaps; sw++) {
          // a teammate and the nearest player of the other team (not the same pair twice in a row)
          var m = U.pick(r, U.range(0, pl.length - 1).filter(function (k) { return pl[k].mate; })), best = -1, bd = 1e9;
          pl.forEach(function (o, k) {
            if (o.mate || (sw > 0 && pl[k].lastWith === m)) return;
            var d = Math.hypot(at[k].x - at[m].x, at[k].y - at[m].y) * (0.8 + r() * 0.4);
            if (d < bd) { bd = d; best = k; }
          });
          if (best < 0) continue;
          var t = at[m]; at[m] = at[best]; at[best] = t;
          pl[best].lastWith = m;
          pl.forEach(function (q, k) { q.path.push(at[k]); });
        }
        pl.forEach(function (q) { delete q.lastWith; });
      }
      out.push({ pl: pl });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var rounds = gen(p, api.rnd, p.endless ? 200 : p.rounds), ri = -1, R = null, phase = 'wait', pt = 0;
    var right = 0, misses = 0, tries = 0, found = 0, bad = -1, shadows = {};

    // A player's shadow, drawn once per kind (a canvas filter on every frame is too slow on phones).
    function shadowOf(kind) {
      if (shadows[kind]) return shadows[kind];
      var k = 1.6, cv = document.createElement('canvas'), g = cv.getContext('2d');
      cv.width = 180 * k; cv.height = 190 * k;
      g.setTransform(k, 0, 0, k, 90 * k, 110 * k);
      D.critter(g, { x: 0, y: 0, t: 0, kind: kind, look: null, mode: 'idle', mt: 0, noSeat: true });
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#3a2d25'; g.fillRect(0, 0, cv.width, cv.height);
      return (shadows[kind] = cv);
    }

    function next() {
      ri++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.rounds) {
        phase = 'end';
        api.finish({ score: right, acc: right / p.rounds, text: p.endless ? U.res.endless(right) : U.res.hit(right, p.rounds), delay: 600 });
        return;
      }
      R = rounds[ri % rounds.length]; found = 0; bad = -1;
      R.pl.forEach(function (q) { q.got = false; });
      phase = 'run'; pt = 0;
      api.sfx('whoosh');
    }
    function posOf(q) {
      if (phase === 'run') { var k = Math.min(1, pt / 0.6), e = 1 - Math.pow(1 - k, 3); return { x: (q.from < 0 ? -40 : 400) + (q.x - (q.from < 0 ? -40 : 400)) * e, y: q.y }; }
      if (phase === 'look') return { x: q.x, y: q.y };
      if (q.path && (phase !== 'shadow' || pt >= MOVE_T)) {   // (おに: changing places, one pair at a time)
        var tt = phase === 'shadow' ? (pt - MOVE_T) / SWAP_T : 1e9, st = Math.floor(tt);
        if (st >= q.path.length - 1) return q.path[q.path.length - 1];
        var a = q.path[st], b = q.path[st + 1], f = tt - st, e = f * f * (3 - 2 * f);
        if (a.x === b.x && a.y === b.y) return a;
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), bul = Math.sin(f * Math.PI) * 30;
        return { x: a.x + dx * e + dy / len * bul, y: a.y + dy * e - dx / len * bul };
      }
      var m = phase === 'shadow' ? Math.min(1, pt / MOVE_T) : 1, s = m * m * (3 - 2 * m);
      return { x: q.x + (q.x1 - q.x) * s, y: q.y + (q.y1 - q.y) * s };
    }
    function swapTime() { return R.pl[0].path ? (R.pl[0].path.length - 1) * SWAP_T : 0; }   // (おに: the changes of places)
    function endRound(ok) {
      api.timer(0);
      tries++;
      if (ok) { right++; api.ok(180, 350, 60); api.sfx('cheer'); } else { misses++; api.ng(180, 350, 50); }
      phase = ok ? 'good' : 'bad'; pt = 0;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.rounds);
    }

    return {
      theme: 2,
      begin: next,
      update: function (dt, playing) {
        pt += dt;
        if (!playing) return;
        if (phase === 'run' && pt > 0.65) { phase = 'look'; pt = 0; }
        // (きろくに ちょうせん: the colours show a little shorter with every round won)
        else if (phase === 'look' && pt > p.show * (p.endless ? Math.max(0.5, 1 - right * 0.02) : 1)) {
          phase = 'shadow'; pt = 0; api.sfx('flip');
          api.timer(p.limit + swapTime(), function () { if (phase === 'shadow') endRound(false); });   // (time up: wrong)
        }
        else if (phase === 'shadow' && p.practice && pt > 2 + swapTime()) {
          var m = R.pl.filter(function (q) { return q.mate && !q.got; })[0];
          if (m) { var w = posOf(m); api.hand(w.x + 8, w.y + 10); }
        } else if ((phase === 'good' && pt > 1.0) || (phase === 'bad' && pt > 1.8)) next();
      },
      draw: function (c, clock) {
        // the court
        D.roundRect(c, 14, 150, 332, 400, 16); D.paint(c, '#e9b877', D.INK, 3);
        c.save(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
        c.beginPath(); c.arc(180, 350, 46, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.moveTo(14, 350); c.lineTo(346, 350); c.stroke();
        c.restore();
        if (!R) return;
        var shadow = phase === 'shadow';
        R.pl.forEach(function (q, k) {
          var w = posOf(q), reveal = phase === 'good' || phase === 'bad' || q.got;
          c.save(); c.translate(w.x, w.y); c.scale(0.5, 0.5);
          if (shadow && !q.got) {
            c.save(); c.globalAlpha = 0.85;
            c.drawImage(shadowOf(q.kind), -90, -110, 180, 190);
            c.restore();
          } else {
            D.critter(c, { x: 0, y: 0, t: clock, kind: q.kind, look: null, mode: reveal && q.mate ? 'happy' : 'idle', mt: pt, noSeat: true });
            // the shirt: green for your team, orange for the other
            D.roundRect(c, -36, 22, 72, 30, 12); D.paint(c, q.mate ? '#5ccf52' : '#ff9a3d', D.INK, 3.4);
            A.text(c, String(k + 4), 0, 38, 22, '#fff', { lw: 5 });
          }
          c.restore();
          if (k === bad) { D.circle(c, w.x, w.y - 10, 44); D.paint(c, null, '#4f8dff', 4); }
        });
        var head = phase === 'shadow' ? 'みかた（みどり）は どこ？' : phase === 'look' || phase === 'run' ? 'みどりの ふくが みかた だよ' : null;
        if (head) A.text(c, L(head), 180, 104, 21, '#fff', { lw: 6 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 138, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting
        if (phase !== 'shadow' || pt < MOVE_T + swapTime()) return null;
        var m = R.pl.filter(function (q) { return q.mate && !q.got; })[0];
        return m ? posOf(m) : null;
      },
      down: function (q) {
        if (phase !== 'shadow') return;
        var best = -1, bd = 1e9;
        R.pl.forEach(function (pl, k) { if (pl.got) return; var w = posOf(pl), d = Math.hypot(q.x - w.x, q.y - (w.y - 8)); if (d < bd) { bd = d; best = k; } });
        if (best < 0 || bd > 50) return;
        var pl = R.pl[best];
        if (pl.mate) {
          pl.got = true; found++;
          if (found >= p.mates) endRound(true); else api.sfx('ok');
        } else { bad = best; endRound(false); }
      }
    };
  }

  T.register({
    id: 'basket', name: 'バスケット', orig: 'バスケット', kind: 'count', sport: true,
    help: 'せんしゅが はしって くるよ。\nみどりの ふくが みかた、オレンジが あいて。\nかげに なったら、みかたを タッチしてね！',
    oniHelp: 'かげに なった あと、せんしゅが いれかわるよ。\nめで おいかけてね！',
    levels: {
      e: { rounds: 6, players: 3, mates: 1, show: 1.4, move: 0, limit: 8 },
      n: { rounds: 6, players: 4, mates: 1, show: 1.1, move: 30, limit: 7 },
      h: { rounds: 6, players: 5, mates: 2, show: 0.9, move: 55, limit: 6 },
      ae: { rounds: 6, players: 5, mates: 2, show: 0.9, move: 55, limit: 6 },
      a: { rounds: 6, players: 6, mates: 2, show: 0.7, move: 75, limit: 5 },
      ah: { rounds: 6, players: 6, mates: 3, show: 0.55, move: 90, limit: 5 },
      endless: { rounds: 5, players: 4, mates: 1, show: 1.0, move: 40, endless: true, limit: 6 },
      practice: { rounds: 2, players: 2, mates: 1, show: 1.8, move: 0 },
      o: { rounds: 6, players: 6, mates: 2, show: 0.9, move: 55, swaps: 2, limit: 7 },
      ao: { rounds: 6, players: 8, mates: 3, show: 0.6, move: 90, swaps: 3, limit: 6 },
      practiceO: { rounds: 2, players: 3, mates: 1, show: 1.8, move: 0, swaps: 1 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], o: [6, 5, 4, 3, 2, 1],
      ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1], ao: [6, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, on = Math.sin((t || 0) * 2.5) > 0;
      D.roundRect(c, 6, 10, 88, 80, 12); D.paint(c, '#e9b877', D.INK, 2.4);
      [[30, 52, true], [70, 52, false]].forEach(function (q) {
        D.circle(c, q[0], q[1] - 10, 12); D.paint(c, on ? '#3a2d25' : '#86d65c', D.INK, 2);
        D.roundRect(c, q[0] - 12, q[1] + 2, 24, 16, 6); D.paint(c, on ? '#3a2d25' : q[2] ? '#5ccf52' : '#ff9a3d', D.INK, 2);
      });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
