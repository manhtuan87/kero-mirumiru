/* かぞえて びゅん (the original: ABC速読, 動体視力) — first a picture to look for; then pictures rush
   across the screen one after another. How many of them were that picture? Grown-ups get letters,
   as in the original. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var DATA = typeof Data !== 'undefined' ? Data : require('../data.js');
  var LANE_Y = 300, LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

  // p: { rounds, items, hits: [a, b], speed (px/s), gap (s between items), mix (0 one way, 1 each round, 2 each item), letters }
  function gen(p, r) {
    var ids = DATA.PICS.map(function (x) { return x.id; }), out = [];
    for (var i = 0; i < p.rounds; i++) {
      var pool = p.letters ? LETTERS.split('') : ids;
      var target = U.pick(r, pool), others = pool.filter(function (x) { return x !== target; });
      var n = p.items, hits = U.span(r, p.hits), items = [];
      for (var k = 0; k < n; k++) items.push(k < hits ? target : U.pick(r, others));
      items = U.shuffle(r, items);
      var d0 = r() < 0.5 ? 1 : -1, dirs = items.map(function (x, k) {
        return p.mix === 2 ? (r() < 0.5 ? 1 : -1) : p.mix === 1 ? (i % 2 ? -d0 : d0) : -1;
      });
      out.push({ target: target, items: items, dirs: dirs, ans: hits });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, P = G.Pics;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, flying = [], sent = 0, next = 0, got = null;
    var pad = api.answerPad({ expect: function () { return R ? R.ans : 0; }, onAnswer: answer });
    pad.enable(false);

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end'; pad.remove();
        api.finish({ score: right, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri]; flying = []; sent = 0; next = 0; got = null;
      phase = 'target'; pt = 0;
      pad.enable(false);
      api.progress(ri, rounds.length);
      api.sfx('pop');
    }
    function answer(v) {
      if (phase !== 'ask') return;
      got = v;
      var good = v === R.ans;
      if (good) { right++; api.ok(180, LANE_Y, 60); }
      else { api.ng(180, LANE_Y, 50); pad.hint(R.ans); }
      phase = good ? 'good' : 'bad'; pt = 0;
      pad.enable(false);
      api.progress(ri + 1, rounds.length);
    }
    function drawItem(c, id, x, y, s, clock) {
      A.disc(c, x, y, 34 * s, '#fffdf5', 3);
      if (p.letters) A.text(c, id, x, y + 1, 40 * s, D.INK, { stroke: false });
      else P.draw(c, id, x, y, 50 * s, clock);
    }

    return {
      theme: 5,
      begin: startRound,
      update: function (dt, playing) {
        pt += dt;
        flying.forEach(function (f) { f.x += f.dir * p.speed * dt; });
        flying = flying.filter(function (f) { return f.x > -60 && f.x < 420; });
        if (!playing) return;
        if (phase === 'target' && pt > 1.8) { phase = 'rush'; pt = 0; next = 0.3; }
        else if (phase === 'rush') {
          next -= dt;
          if (next <= 0 && sent < R.items.length) {
            var dir = R.dirs[sent];
            flying.push({ id: R.items[sent], dir: dir, x: dir > 0 ? -50 : 410 });
            sent++; next = p.gap;
            api.sfx('whoosh');
          }
          if (sent >= R.items.length && !flying.length) { phase = 'ask'; pt = 0; pad.enable(true); }
        } else if (phase === 'ask' && p.practice && pt > 3) pad.hint(R.ans);
        else if ((phase === 'good' && pt > 1.1) || (phase === 'bad' && pt > 1.9)) { pad.hint(null); startRound(); }
      },
      draw: function (c, clock) {
        if (!R) return;
        // the lane the pictures rush along
        D.roundRect(c, -20, LANE_Y - 46, 400, 92, 20); D.paint(c, 'rgba(255,255,255,.45)');
        if (phase === 'target') {
          A.text(c, L('この えを かぞえてね！'), 180, 120, 22, '#fff', { lw: 6 });
          drawItem(c, R.target, 180, LANE_Y, 1.4 + Math.sin(pt * 6) * 0.04, clock);
        } else {
          // the one to count stays small in the corner
          A.disc(c, 318, 118, 30, '#fff4b0', 3);
          if (p.letters) A.text(c, R.target, 318, 119, 32, D.INK, { stroke: false }); else P.draw(c, R.target, 318, 118, 40, clock);
          A.text(c, L(phase === 'ask' ? 'いくつ あった？' : 'いくつ でるかな？'), 150, 120, 22, '#fff', { lw: 6, max: 230 });
          flying.forEach(function (f) { drawItem(c, f.id, f.x, LANE_Y, 1, clock); });
          if (phase === 'good' || phase === 'bad') A.text(c, L('こたえは {n}', { n: R.ans }), 180, LANE_Y + 80, 26, '#fff', { lw: 7 });
        }
      },
      peek: function () { return phase === 'ask' ? { pad: R.ans } : null; },   // for playtesting
      end: function () { pad.remove(); }
    };
  }

  T.register({
    id: 'rushcount', name: 'かぞえて びゅん', orig: 'ABC速読', kind: 'count',
    help: 'さいしょに でた えと おなじ えが、\nよこに びゅんと ながれるよ。\nいくつ あったか かぞえてね！',
    levels: {
      e: { rounds: 6, items: 5, hits: [1, 3], speed: 150, gap: 1.0, mix: 0 },
      n: { rounds: 6, items: 7, hits: [2, 4], speed: 210, gap: 0.8, mix: 1 },
      h: { rounds: 6, items: 9, hits: [2, 5], speed: 280, gap: 0.62, mix: 2 },
      a: { rounds: 6, items: 12, hits: [3, 6], speed: 360, gap: 0.5, mix: 2, letters: true },
      test: { rounds: 5, items: 7, hits: [2, 4], speed: 230, gap: 0.75, mix: 1 },
      testA: { rounds: 5, items: 11, hits: [3, 6], speed: 340, gap: 0.52, mix: 2, letters: true },
      practice: { rounds: 2, items: 4, hits: [1, 2], speed: 130, gap: 1.1, mix: 0 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1],
      test: [5, 5, 4, 3, 2, 1], testA: [5, 5, 4, 3, 2, 1]
    },
    gen: gen,
    start: start,
    icon: function (c, t) {
      var A = G.Art, P = G.Pics, k = ((t || 0) * 40) % 100;
      [[20 - k * 0.3, 'apple'], [55 - k * 0.3, 'star'], [90 - k * 0.3, 'apple']].forEach(function (it) {
        var x = ((it[0] % 110) + 110) % 110 - 5;
        A.disc(c, x, 56, 16, '#fffdf5', 2.4); P.draw(c, it[1], x, 56, 22, t || 0);
      });
      A.text(c, L('？'), 82, 20, 22, '#fff', { lw: 5 });
    }
  });
}(typeof Trainings !== 'undefined' ? Trainings : require('../trainings.js')));
