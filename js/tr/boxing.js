/* ボクシング (眼球運動, 周辺視野, 眼と手の協応) — the trainer holds up a mitt
   here or there: tap it quickly. Now and then the trainer punches: slide the way the arrow points to dodge.
   p.endless: どこまで いけるかな？, until three misses, getting faster.
   おに: now and then two mitts at once — tap both (a little more time for the two). */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var SPOTS = [[80, 250], [280, 250], [70, 360], [290, 360], [95, 470], [265, 470], [180, 200], [180, 480]];

  // p: { n (actions), window (s to hit), punch (chance of a punch), spots (how many places) }; おに: twin (chance of two mitts)
  function gen(p, r, count) {
    var out = [], last = -1;
    for (var i = 0; i < (count || p.n); i++) {
      if (i > 1 && r() < p.punch) { out.push({ punch: r() < 0.5 ? -1 : 1 }); continue; }
      var s = U.int(r, 0, p.spots - 1);
      if (s === last) s = (s + 1) % p.spots;
      last = s;
      var x = { spot: s };
      if (p.twin && i > 0 && r() < p.twin) {   // (the second mitt on the other side, so both hands can go)
        var others = U.range(0, p.spots - 1).filter(function (k) { return k !== s && Math.abs(SPOTS[k][0] - SPOTS[s][0]) > 60; });
        if (others.length) x.spot2 = U.pick(r, others);
      }
      out.push(x);
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art;
    var acts = gen(p, api.rnd, p.endless ? 300 : p.n), ai = -1, X = null, phase = 'wait', pt = 0;
    var hits = 0, misses = 0, tries = 0, drag = null, dodge = 0, flash = '', flashT = 0;

    function win() { return p.window * (p.endless ? Math.max(0.5, 1 - hits * 0.012) : 1) * (X && X.spot2 != null ? 1.4 : 1); }
    var got = {};   // (おに: the mitts already hit, of two)
    function next() {
      ai++;
      api.hand(null);
      if (p.endless ? misses >= 3 : tries >= p.n) {
        phase = 'end';
        api.finish({ score: hits, acc: hits / p.n, text: p.endless ? U.res.endless(hits) : U.res.hit(hits, p.n), delay: 600 });
        return;
      }
      X = acts[ai % acts.length]; phase = 'gap'; pt = 0; dodge = 0; got = {};
    }
    function done(ok, word) {
      tries++;
      if (ok) { hits++; api.sfx('ok'); } else misses++;
      flash = word; flashT = 0.7;
      api.progress(p.endless ? 0 : tries, p.endless ? 0 : p.n);
      phase = 'after'; pt = 0;
    }

    return {
      theme: 1,
      begin: next,
      update: function (dt, playing) {
        pt += dt; flashT = Math.max(0, flashT - dt);
        if (!playing) return;
        if (phase === 'gap' && pt > (X.punch ? 0.5 : 0.25)) { phase = 'on'; pt = 0; if (X.punch) api.sfx('whoosh'); }
        else if (phase === 'on') {
          if (p.practice) {
            var hs = X.spot2 != null && got[X.spot] ? X.spot2 : X.spot;
            if (X.punch) api.hand(180 + X.punch * 90, 360); else api.hand(SPOTS[hs][0] + 8, SPOTS[hs][1] + 10);
          }
          if (pt > win() * (X.punch ? 1.25 : 1)) { api.ng(180, 330, 40); done(false, X.punch ? 'いたっ！' : 'おそい！'); }
        } else if (phase === 'after' && pt > 0.3) next();
      },
      draw: function (c, clock) {
        // the ring
        D.roundRect(c, 10, 150, 340, 400, 20); D.paint(c, 'rgba(255,255,255,.35)');
        c.save(); c.strokeStyle = 'rgba(255,90,120,.6)'; c.lineWidth = 5;
        [170, 190].forEach(function (y) { c.beginPath(); c.moveTo(14, y); c.lineTo(346, y); c.stroke(); });
        c.restore();
        // the trainer
        var sway = X && X.punch && phase === 'on' ? X.punch * Math.min(1, pt / (win() * 0.7)) * 40 : 0;
        c.save(); c.translate(180 + sway * 0.4 + dodge * 0, 370); c.scale(0.95, 0.95);
        D.critter(c, { x: 0, y: 0, noSeat: true, t: clock, kind: 'dog', look: null, mode: phase === 'after' && flash === 'パン！' ? 'happy' : 'idle', mt: pt });
        c.restore();
        if (X && phase === 'on') {
          if (X.punch) {
            // a glove coming, and the arrow to dodge
            var k = Math.min(1, pt / win());
            D.circle(c, 180, 330, 30 + k * 40); D.paint(c, '#ff5a5a', D.INK, 3.4);
            A.dirArrow(c, 180 - X.punch * 110, 250, 1.6, X.punch > 0 ? 3 : 1, '#ffd23d');
            A.text(c, L('よけて！'), 180, 104, 26, '#fff', { lw: 7 });
          } else {
            var left = Math.max(0, 1 - pt / win());
            [X.spot, X.spot2].forEach(function (sp) {
              if (sp == null || got[sp]) return;
              var q = SPOTS[sp];
              D.circle(c, q[0], q[1], 40); D.paint(c, 'rgba(255,255,255,.5)');
              D.circle(c, q[0], q[1], 34); D.paint(c, '#ffd23d', D.INK, 3.4);
              D.circle(c, q[0], q[1], 16); D.paint(c, '#ff8f3d', D.INK, 2.4);
              c.save(); c.beginPath(); c.arc(q[0], q[1], 42, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2);
              c.lineWidth = 5; c.strokeStyle = 'rgba(90,56,37,.6)'; c.lineCap = 'round'; c.stroke(); c.restore();
            });
            A.text(c, L(X.spot2 != null ? 'ミットを 2つ タッチ！' : 'ミットを タッチ！'), 180, 104, 24, '#fff', { lw: 7 });
          }
        }
        if (flashT > 0) A.text(c, L(flash), 180, 560, 30, flash === 'パン！' || flash === 'よけた！' ? '#ffd23d' : '#fff', { lw: 7 });
        if (p.endless) for (var h = 0; h < 3; h++) D.heart(c, 290 + h * 24, 138, 9, h < 3 - misses ? '#ff6f91' : 'rgba(255,255,255,.5)');
      },
      peek: function () {   // for playtesting
        if (phase !== 'on') return null;
        if (X.punch) return { swipe: [180, 360, 180 - X.punch * 120, 360] };
        var sp = X.spot2 != null && got[X.spot] ? X.spot2 : X.spot;
        return { x: SPOTS[sp][0], y: SPOTS[sp][1] };
      },
      down: function (q, id) {
        if (phase !== 'on') return;
        if (X.punch) { drag = { x: q.x, y: q.y, id: id }; return; }
        [X.spot, X.spot2].forEach(function (sp) {
          if (sp == null || got[sp] || phase !== 'on') return;
          var s = SPOTS[sp];
          if (Math.hypot(q.x - s[0], q.y - s[1]) >= 48) return;
          got[sp] = true; api.sfx('thud'); api.burst(s[0], s[1], 8, '#fff6a8');
          if (X.spot2 == null || (got[X.spot] && got[X.spot2])) done(true, 'パン！');
          else api.sfx('ok');   // (the first of two: right so far)
        });
      },
      move: function (q, id) {
        if (!drag || drag.id !== id || phase !== 'on' || !X.punch) return;
        var dx = q.x - drag.x;
        if (Math.abs(dx) > 40) {
          drag = null;
          // slide away from the punch: the arrow points to -punch
          if ((dx < 0 ? -1 : 1) === -X.punch) { api.sfx('whoosh'); dodge = -X.punch; done(true, 'よけた！'); }
          else { api.ng(180, 330, 40); done(false, 'いたっ！'); }
        }
      },
      up: function () { drag = null; }
    };
  }

  T.register({
    id: 'boxing', name: 'ボクシング', kind: 'count', sport: true,
    help: 'トレーナーが だす ミットを\nすばやく タッチしよう！\nパンチが きたら やじるしの ほうへ\nゆびを スライドして よけてね',
    oniHelp: 'ミットが 2つ いっしょに でるよ。\nどっちも タッチしてね！',
    levels: {
      e: { n: 16, window: 1.7, punch: 0.15, spots: 4 },
      n: { n: 20, window: 1.25, punch: 0.2, spots: 6 },
      h: { n: 20, window: 0.95, punch: 0.25, spots: 8 },
      ae: { n: 20, window: 0.95, punch: 0.25, spots: 8 },
      a: { n: 24, window: 0.75, punch: 0.25, spots: 8 },
      ah: { n: 28, window: 0.62, punch: 0.3, spots: 8 },
      endless: { n: 20, window: 1.3, punch: 0.2, spots: 6, endless: true },
      practice: { n: 4, window: 2.6, punch: 0.3, spots: 4 },
      o: { n: 20, window: 1.0, punch: 0.25, spots: 8, twin: 0.35 },
      ao: { n: 28, window: 0.62, punch: 0.3, spots: 8, twin: 0.45 },
      practiceO: { n: 4, window: 2.6, punch: 0.3, spots: 4, twin: 0.5 }
    },
    ranks: {
      e: [16, 15, 13, 11, 8, 5], n: [20, 19, 17, 14, 10, 6], h: [20, 18, 16, 13, 9, 5], o: [20, 18, 16, 13, 9, 5],
      ae: [20, 18, 16, 13, 9, 5], a: [24, 22, 19, 15, 11, 6], ah: [28, 26, 22, 17, 12, 7], ao: [28, 26, 22, 17, 12, 7]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var D = G.Draw, k = Math.sin((t || 0) * 4);
      D.circle(c, 30, 40 + k * 4, 18); D.paint(c, '#ffd23d', D.INK, 2.4);
      D.circle(c, 30, 40 + k * 4, 8); D.paint(c, '#ff8f3d', D.INK, 1.8);
      D.circle(c, 70, 60 - k * 4, 18); D.paint(c, '#ff5a5a', D.INK, 2.4);
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
