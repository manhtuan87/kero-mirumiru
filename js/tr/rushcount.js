/* かぞえて びゅん (the original: ABC速読, 動体視力) — first a picture to look for; then pictures rush
   across the screen one after another. How many of them were that picture? Grown-ups get letters,
   as in the original. おに: two lanes rush at the same time, the top one to the right and the bottom one to the
   left; count them all. */
(function (T) {
  'use strict';
  var U = T.U, G = typeof window !== 'undefined' ? window : {};
  var DATA = typeof Data !== 'undefined' ? Data : require('../data.js');
  var LANE_Y = 300, LANES_Y = [252, 372], LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  // letters that look like each letter (おとな むずかしい: most of the others are these)
  var ALIKE = { A: 'HR', B: 'DPRE', C: 'GDU', D: 'BPRC', E: 'FBH', F: 'EPT', G: 'CD', H: 'NMK', J: 'LT', K: 'XHR', L: 'JTE', M: 'NWH',
    N: 'MHZ', P: 'RBF', R: 'PBK', S: 'ZG', T: 'FYL', U: 'VC', V: 'UYW', W: 'MV', X: 'KY', Y: 'VXT', Z: 'SN' };

  // p: { rounds, items, hits: [a, b], speed (px/s), gap (s between items), mix (0 one way, 1 each round, 2 each item), letters,
  //      alike (the others look like the letter), recent (pictures shown lately: they come last),
  //      lanes: 2 (おに: half the items in each lane, the top one to the right, the bottom one to the left; gap is per lane) }
  function gen(p, r) {
    var all = DATA.PICS.map(function (x) { return x.id; }), ids = U.fresh(r, all, Math.min(all.length, 14), p.recent), out = [];
    var looks = U.sample(r, ids, Math.min(ids.length, p.rounds));   // (a different picture to look for in every round)
    for (var i = 0; i < p.rounds; i++) {
      var pool = p.letters ? LETTERS.split('') : ids;
      var target = p.letters ? U.pick(r, pool) : looks[i % looks.length], others = pool.filter(function (x) { return x !== target; });
      var near = p.alike ? (ALIKE[target] || '').split('') : [];
      var n = p.items, hits = U.span(r, p.hits), items = [];
      for (var k = 0; k < n; k++) items.push(k < hits ? target : near.length && r() < 0.7 ? U.pick(r, near) : U.pick(r, others));
      items = U.shuffle(r, items);
      var d0 = r() < 0.5 ? 1 : -1, dirs = items.map(function (x, k) {
        return p.mix === 2 ? (r() < 0.5 ? 1 : -1) : p.mix === 1 ? (i % 2 ? -d0 : d0) : -1;
      });
      // two lanes: every other item in each (the items are shuffled already), so both keep coming till the end
      var lanes = items.map(function (x, k) { return p.lanes === 2 ? k % 2 : 0; });
      if (p.lanes === 2) dirs = lanes.map(function (l) { return l === 0 ? 1 : -1; });
      out.push({ target: target, items: items, dirs: dirs, lanes: lanes, ans: hits });
    }
    return out;
  }

  function start(api, p) {
    var D = G.Draw, A = G.Art, P = G.Pics;
    var rounds = gen(p, api.rnd), ri = -1, phase = 'wait', pt = 0, right = 0, R = null, flying = [], sent = 0, next = 0, got = null;
    var two = p.lanes === 2, laneNext = [0, 0], laneSent = [0, 0];
    function laneY(l) { return two ? LANES_Y[l] : LANE_Y; }
    if (!p.letters) api.used(rounds.map(function (x) { return x.target; }));
    var pad = api.answerPad({ expect: function () { return R ? R.ans : 0; }, onAnswer: answer });
    pad.enable(false);

    function startRound() {
      ri++;
      api.hand(null);
      if (ri >= rounds.length) {
        phase = 'end'; pad.remove();
        api.finish({ score: right, acc: right / rounds.length, text: U.res.right(right, rounds.length) });
        return;
      }
      R = rounds[ri]; flying = []; sent = 0; next = 0; got = null; laneNext = [0.3, 0.3 + p.gap / 2]; laneSent = [0, 0];
      phase = 'target'; pt = 0;
      pad.enable(false);
      api.progress(ri, rounds.length);
      api.sfx('pop');
    }
    function timeUp() {   // (no answer in time)
      if (phase !== 'ask') return;
      api.ng(180, LANE_Y, 50); pad.hint(R.ans);
      phase = 'bad'; pt = 0; pad.enable(false);
      api.progress(ri + 1, rounds.length);
    }
    function answer(v) {
      if (phase !== 'ask') return;
      api.timer(0);
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
        else if (phase === 'rush' && two) {
          // each lane sends its own items, half a gap apart from the other lane
          for (var l = 0; l < 2; l++) {
            laneNext[l] -= dt;
            if (laneNext[l] > 0) continue;
            var k = -1, seen = 0;
            for (var j = 0; j < R.items.length; j++) if (R.lanes[j] === l && seen++ === laneSent[l]) { k = j; break; }
            if (k < 0) continue;
            flying.push({ id: R.items[k], dir: R.dirs[k], x: R.dirs[k] > 0 ? -50 : 410, lane: l });
            laneSent[l]++; sent++; laneNext[l] = p.gap * (0.85 + api.rnd() * 0.3);
            api.sfx('whoosh');
          }
          if (sent >= R.items.length && !flying.length) { phase = 'ask'; pt = 0; pad.enable(true); api.timer(p.limit, timeUp); }
        } else if (phase === 'rush') {
          next -= dt;
          if (next <= 0 && sent < R.items.length) {
            var dir = R.dirs[sent];
            flying.push({ id: R.items[sent], dir: dir, x: dir > 0 ? -50 : 410, lane: 0 });
            sent++; next = p.gap;
            api.sfx('whoosh');
          }
          if (sent >= R.items.length && !flying.length) { phase = 'ask'; pt = 0; pad.enable(true); api.timer(p.limit, timeUp); }
        } else if (phase === 'ask' && p.practice && pt > 3) pad.hint(R.ans);
        else if ((phase === 'good' && pt > 1.1) || (phase === 'bad' && pt > 1.9)) { pad.hint(null); startRound(); }
      },
      draw: function (c, clock) {
        if (!R) return;
        // the lane (or the two lanes) the pictures rush along; in two lanes a little arrow shows each lane's way
        for (var l = 0; l < (two ? 2 : 1); l++) {
          D.roundRect(c, -20, laneY(l) - 46, 400, 92, 20); D.paint(c, 'rgba(255,255,255,.45)');
          if (two && phase !== 'target') A.text(c, l === 0 ? '→' : '←', l === 0 ? 26 : 334, laneY(l) - 34, 16, 'rgba(90,56,37,.45)', { stroke: false });
        }
        if (phase === 'target') {
          A.text(c, L('この えを かぞえてね！'), 180, 120, 22, '#fff', { lw: 6 });
          drawItem(c, R.target, 180, LANE_Y, 1.4 + Math.sin(pt * 6) * 0.04, clock);
        } else {
          // the one to count stays small in the corner
          A.disc(c, 318, 118, 30, '#fff4b0', 3);
          if (p.letters) A.text(c, R.target, 318, 119, 32, D.INK, { stroke: false }); else P.draw(c, R.target, 318, 118, 40, clock);
          A.text(c, L(phase === 'ask' ? 'いくつ あった？' : 'いくつ でるかな？'), 150, 120, 22, '#fff', { lw: 6, max: 230 });
          flying.forEach(function (f) { drawItem(c, f.id, f.x, laneY(f.lane || 0), two ? 0.92 : 1, clock); });
          if (phase === 'good' || phase === 'bad') A.text(c, L('こたえは {n}', { n: R.ans }), 180, two ? 312 : LANE_Y + 80, 26, '#fff', { lw: 7 });
        }
      },
      peek: function () { return phase === 'ask' ? { pad: R.ans } : null; },   // for playtesting
      end: function () { pad.remove(); }
    };
  }

  T.register({
    id: 'rushcount', name: 'かぞえて びゅん', orig: 'ABC速読', kind: 'count', pool: 'pics',
    help: 'さいしょに でた えと おなじ えが、\nよこに びゅんと ながれるよ。\nいくつ あったか かぞえてね！',
    oniHelp: 'うえと したの 2れつで いっしょに ながれるよ。\nりょうほう あわせて かぞえてね！',
    levels: {
      e: { rounds: 6, items: 5, hits: [1, 3], speed: 150, gap: 1.0, mix: 0, limit: 10 },
      n: { rounds: 6, items: 7, hits: [2, 4], speed: 210, gap: 0.8, mix: 1, limit: 8 },
      h: { rounds: 6, items: 9, hits: [2, 5], speed: 280, gap: 0.62, mix: 2, limit: 7 },
      o: { rounds: 6, items: 12, hits: [3, 6], speed: 250, gap: 0.9, mix: 0, lanes: 2, limit: 8 },
      ae: { rounds: 6, items: 10, hits: [2, 5], speed: 300, gap: 0.6, mix: 2, letters: true, limit: 7 },
      a: { rounds: 6, items: 12, hits: [3, 6], speed: 360, gap: 0.5, mix: 2, letters: true, limit: 6 },
      ah: { rounds: 6, items: 15, hits: [4, 7], speed: 420, gap: 0.42, mix: 2, letters: true, alike: true, limit: 6 },
      ao: { rounds: 6, items: 20, hits: [5, 9], speed: 380, gap: 0.55, mix: 0, lanes: 2, letters: true, alike: true, limit: 7 },
      test: { rounds: 5, items: 7, hits: [2, 4], speed: 230, gap: 0.75, mix: 1, limit: 8 },
      testA: { rounds: 5, items: 11, hits: [3, 6], speed: 340, gap: 0.52, mix: 2, letters: true, limit: 6 },
      practice: { rounds: 2, items: 4, hits: [1, 2], speed: 130, gap: 1.1, mix: 0 },
      practiceO: { rounds: 2, items: 6, hits: [1, 2], speed: 140, gap: 1.2, mix: 0, lanes: 2 }
    },
    ranks: {
      e: [6, 5, 4, 3, 2, 1], n: [6, 5, 4, 3, 2, 1], h: [6, 5, 4, 3, 2, 1], o: [6, 5, 4, 3, 2, 1],
      ae: [6, 5, 4, 3, 2, 1], a: [6, 5, 4, 3, 2, 1], ah: [6, 5, 4, 3, 2, 1], ao: [6, 5, 4, 3, 2, 1],
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
