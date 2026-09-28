/* ケロちゃん みるみる — the list of trainings and small helpers they share.
   Each training (js/tr/*.js) registers itself here with
     id, name, help (the explanation), kind ('time': lower score is better / 'count': higher is better),
     levels { e, n, h, a, test, testA, practice }, ranks { same keys: 6 limits, best first },
     gen(params, rnd)   the questions (pure, so the Node.js tools can check them),
     start(api, params) a play session: { begin, update, draw, down, move, up, key, end }.
   The app (app.js) runs the explanation, practice, countdown, pause, results and records;
   a training only asks its questions and reports { score, acc, text }
   (acc: how much of the run was right, 0..1 — the ★ need it: see core.js starsOf). */
(function (root, factory) {
  var T = factory();
  if (typeof module === 'object' && module.exports) module.exports = T;
  root.Trainings = T;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var list = [], byId = {};
  function register(def) { list.push(def); byId[def.id] = def; return def; }

  // r is a random function returning 0 <= x < 1 (Math.random in the game, a seeded one in the tools).
  var U = {
    int: function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); },
    pick: function (r, arr) { return arr[Math.floor(r() * arr.length)]; },
    shuffle: function (r, arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample: function (r, arr, k) { return U.shuffle(r, arr).slice(0, k); },
    range: function (a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; },
    // a number from [a, b] given as a pair, or the number itself
    span: function (r, v) { return Array.isArray(v) ? U.int(r, v[0], v[1]) : v; },
    // acc where a wrong answer is simply tried again: 1, less an equal share (1/n) for each mistake
    acc: function (miss, n) { return n > 0 ? Math.max(0, 1 - miss / n) : miss ? 0 : 1; },
    rng: function (seed) {
      var s = Math.abs(Math.floor(seed)) % 2147483647 || 1;
      return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
    },
    // n points inside box {x0, y0, x1, y1}, at least minD apart (tries hard, then relaxes the distance)
    scatter: function (r, n, box, minD) {
      for (var d = minD; d > minD * 0.5; d *= 0.94) {
        for (var attempt = 0; attempt < 30; attempt++) {
          var pts = [], ok = true;
          for (var i = 0; i < n && ok; i++) {
            var placed = false;
            for (var k = 0; k < 200 && !placed; k++) {
              var p = { x: box.x0 + r() * (box.x1 - box.x0), y: box.y0 + r() * (box.y1 - box.y0) };
              var far = true;
              for (var j = 0; j < pts.length && far; j++) {
                var dx = pts[j].x - p.x, dy = pts[j].y - p.y;
                if (dx * dx + dy * dy < d * d) far = false;
              }
              if (far) { pts.push(p); placed = true; }
            }
            if (!placed) ok = false;
          }
          if (ok) return pts;
        }
      }
      return null;
    },
    fmtTime: function (s) { return (Math.round(s * 10) / 10).toFixed(1) + 'びょう'; },
    // What a run says on the result screen (and in the records): a small object that the game puts into
    // words in the chosen language (app.js resText), so a record reads right after the language changes.
    res: {
      time: function (t, m) { return { k: 'time', t: Math.round(t * 10) / 10, m: m || 0 }; },
      right: function (a, b) { return { k: 'right', a: a, b: b }; },
      hit: function (a, b) { return { k: 'hit', a: a, b: b }; },
      endless: function (a) { return { k: 'endless', a: a }; }
    }
  };

  return { list: list, byId: byId, register: register, U: U };
}));
