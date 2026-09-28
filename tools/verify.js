// Checks the question makers of every training (many times at every level), the levels and rank limits,
// the data (eye check, eye facts, stretch), and the save data rules.
// usage: node tools/verify.js
'use strict';
global.Trainings = require('../js/trainings.js');
global.Data = require('../js/data.js');
const Data = global.Data;
const C = require('../js/core.js');
const IDS = ['shuffle', 'rushcount', 'flashnum', 'flashmark', 'triplec', 'countc', 'peric', 'updownc', 'quicktouch', 'numtouch',
  'baseball', 'boxing', 'pingpong', 'basket', 'volley', 'soccer', 'football'];
IDS.forEach(id => require('../js/tr/' + id + '.js'));
const T = global.Trainings, U = T.U;

let bad = 0, checks = 0;
const ngs = {};   // the same problem is counted, not printed again and again
function check(ok, msg) {
  checks++;
  if (ok) return;
  bad++;
  if (!ngs[msg]) { ngs[msg] = 0; if (Object.keys(ngs).length <= 60) console.log('  NG ' + msg); }
  ngs[msg]++;
}
const RUNS = 300;
function levelsOf(tr) { return Object.keys(tr.levels).filter(l => l !== 'practice'); }
function params(tr, lv, practice) {
  const p = Object.assign({}, tr.levels[lv]);
  if (practice) Object.assign(p, tr.levels.practice || {}, { practice: true });
  p.adult = lv === 'a' || lv === 'testA';
  return p;
}
function eachParams(tr, fn) {
  levelsOf(tr).forEach(lv => { fn(params(tr, lv, false), lv); if (tr.levels.practice) fn(params(tr, lv, true), lv + '+practice'); });
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function inBox(q, b, m) { m = m || 0; return q.x >= b.x0 - m && q.x <= b.x1 + m && q.y >= b.y0 - m && q.y <= b.y1 + m; }
function span(v) { return Array.isArray(v) ? v : [v, v]; }
function distToLine(q, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, k = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2));
  return Math.hypot(q.x - (a.x + dx * k), q.y - (a.y + dy * k));
}

// ---------------------------------------------------------------- the list, levels and rank limits
console.log('trainings, levels and ranks');
check(T.list.length === IDS.length, 'every training registers itself');
Data.TRAININGS.forEach(t => check(!!T.byId[t.id], 'missing training ' + t.id));
Data.CHECK.forEach(c => c.tests.forEach(id => check(!!T.byId[id] && T.byId[id].levels.test && T.byId[id].levels.testA, 'check test ' + id + ' needs test and testA levels')));
check(Data.CHECK.length === 5 && Data.CHECK.every(c => c.tests.length === 2), 'five eye powers with two basic trainings each');
check(Data.CATS.filter(c => c.id !== 'sports').every(c => Data.TRAININGS.filter(t => t.cat === c.id).length === 2), 'two trainings in each eye power');
check(Data.TRAININGS.filter(t => t.cat === 'sports').length === 7, 'seven sports');
{ // one more menu with every stamp (as in the original), five open from the start (one per eye power) and baseball
  const at = Data.TRAININGS.map(t => t.unlock).sort((a, b) => a - b);
  check(at.filter(n => n === 0).length === 6, 'six trainings open from the start');
  check(JSON.stringify(at.filter(n => n > 0)) === JSON.stringify(U.range(1, 11)), 'one new training for each stamp 1..11');
  check(Data.CHECK.every(c => c.tests.some(id => C.trainingInfo(id).unlock === 0)), 'every eye power has a training open from the start');
}
// the most a count training can score at a level
function maxScore(tr, p) {
  if (['shuffle', 'rushcount', 'flashnum', 'flashmark', 'triplec', 'countc', 'basket'].includes(tr.id)) return p.rounds;
  if (tr.id === 'updownc') return p.q;
  return p.n;
}
T.list.forEach(tr => {
  check(['time', 'count'].includes(tr.kind), tr.id + ' kind');
  check(typeof tr.icon === 'function' && typeof tr.start === 'function' && typeof tr.gen === 'function', tr.id + ' icon, start and gen');
  check(typeof tr.name === 'string' && typeof tr.help === 'string' && tr.help.length > 10, tr.id + ' name and help');
  ['e', 'n', 'h', 'a', 'practice'].forEach(lv => check(!!tr.levels[lv], tr.id + ' misses level ' + lv));
  if (tr.sport) check(!!tr.levels.endless && tr.levels.endless.endless === true, tr.id + ' needs an endless level');
  Object.keys(tr.ranks).forEach(lv => {
    const c = tr.ranks[lv], test = lv === 'test' || lv === 'testA';
    check(c.length === 6, tr.id + ' ' + lv + ' needs 6 limits');
    check(!!tr.levels[lv], tr.id + ' ranks for a level it does not have: ' + lv);
    for (let i = 1; i < 6; i++) {
      if (tr.kind === 'time') check(c[i] > c[i - 1], tr.id + ' ' + lv + ' limits out of order');
      else check(test ? c[i] <= c[i - 1] : c[i] < c[i - 1], tr.id + ' ' + lv + (test ? ' limits out of order' : ' limits must all differ (every animal reachable)'));
    }
    if (tr.kind === 'count' && tr.levels[lv]) {
      const top = maxScore(tr, tr.levels[lv]);
      check(c[0] <= top, `${tr.id} ${lv}: the best rank needs ${c[0]} but ${top} is the most`);
      check(c[5] >= 1, `${tr.id} ${lv}: no score should give nothing but もぐら`);
    }
  });
  levelsOf(tr).filter(lv => lv !== 'endless').forEach(lv => check(!!tr.ranks[lv], tr.id + ' level ' + lv + ' has no ranks'));
});

// ---------------------------------------------------------------- every question maker
function run(id, fn) {
  const tr = T.byId[id];
  console.log(id);
  eachParams(tr, (p, lv) => { for (let s = 1; s <= RUNS; s++) fn(tr, p, lv, U.rng(s * 7919 + lv.length * 131 + id.length)); });
}

run('shuffle', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `shuffle ${lv} count`);
  rs.forEach(x => {
    let pos = x.start;
    const [a0, b0] = span(p.swaps);
    check(x.swaps.length >= a0 && x.swaps.length <= b0, `shuffle ${lv} swaps ${x.swaps.length}`);
    x.swaps.forEach(([a, b]) => {
      check(a !== b && a >= 0 && b >= 0 && a < p.cups && b < p.cups, `shuffle ${lv} bad swap ${a},${b}`);
      if (pos === a) pos = b; else if (pos === b) pos = a;
    });
    check(pos === x.ans, `shuffle ${lv} answer`);
    check(x.swaps.some(([a, b]) => a === x.start || b === x.start), `shuffle ${lv} the chick's cup never moves`);
  });
});

run('rushcount', (tr, p, lv, r) => {
  const rs = tr.gen(p, r), ids = Data.PICS.map(x => x.id);
  check(rs.length === p.rounds, `rushcount ${lv} count`);
  rs.forEach(x => {
    check(x.items.length === p.items && x.dirs.length === p.items, `rushcount ${lv} items`);
    const n = x.items.filter(i => i === x.target).length, [a, b] = span(p.hits);
    check(n === x.ans && n >= a && n <= b, `rushcount ${lv} answer ${x.ans} / ${n}`);
    check(x.ans <= 10, `rushcount ${lv} answer above the pad`);
    if (p.letters) check(x.items.every(i => /^[A-Z]$/.test(i)), `rushcount ${lv} letters`);
    else check(x.items.every(i => ids.includes(i)), `rushcount ${lv} pictures`);
    check(x.dirs.every(d => d === 1 || d === -1), `rushcount ${lv} directions`);
    if (!p.mix) check(x.dirs.every(d => d === -1), `rushcount ${lv} one way only`);
  });
});

run('flashnum', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `flashnum ${lv} count`);
  rs.forEach(x => {
    check(x.n.length === p.len && /^[1-9][0-9]*$/.test(x.n), `flashnum ${lv} number ${x.n}`);
    check(x.opts.length === 4 && new Set(x.opts).size === 4 && x.opts[x.ans] === x.n, `flashnum ${lv} choices`);
    check(x.opts.every(o => /^[1-9][0-9]*$/.test(o)), `flashnum ${lv} a choice starts with 0`);
    check(x.opts.filter(o => o.length === p.len).length >= 3, `flashnum ${lv} choices of another length`);
    check(x.x >= 70 && x.x <= 290 && x.y >= 150 && x.y <= 370, `flashnum ${lv} place`);
  });
});

run('flashmark', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `flashmark ${lv} count`);
  rs.forEach(x => {
    const ks = Object.keys(x.marks).map(Number);
    check(ks.length === Math.min(p.fill, p.cols * p.rows) && ks.every(k => k >= 0 && k < p.cols * p.rows), `flashmark ${lv} marks`);
    check(x.marks[x.ans] === 'maru' && ks.filter(k => x.marks[k] === 'maru').length === 1, `flashmark ${lv} exactly one ○`);
  });
});

const BOX_TRIPLE = { x0: 50, y0: 150, x1: 310, y1: 420 };
run('triplec', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `triplec ${lv} count`);
  rs.forEach(x => {
    check(x.cs.length === p.k, `triplec ${lv} Cs`);
    x.cs.forEach((a, i) => {
      check(a.dir >= 0 && a.dir <= 3 && inBox(a, BOX_TRIPLE), `triplec ${lv} C`);
      x.cs.forEach((b, j) => { if (i < j) check(dist(a, b) >= 2 * p.size + 10, `triplec ${lv} Cs too close (${Math.round(dist(a, b))})`); });
    });
  });
});

const BOX_COUNT = { x0: 50, y0: 160, x1: 310, y1: 420 };
let countcNear = 0, countcAll = 0;
run('countc', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `countc ${lv} count`);
  rs.forEach(x => {
    check(x.cs.length === p.items, `countc ${lv} Cs`);
    const n = x.cs.filter(c => c.dir === x.target).length, [a, b] = span(p.hits);
    check(n === x.ans && n >= a && n <= b, `countc ${lv} answer`);
    x.cs.forEach((c, i) => {
      check(c.dir >= 0 && c.dir <= 3 && inBox(c, BOX_COUNT), `countc ${lv} C`);
      if (i) { countcAll++; if (dist(c, x.cs[i - 1]) <= 90) countcNear++; }
    });
  });
});
check(countcNear / countcAll < 0.002, `countc: a C often shows next to the one before (${countcNear} / ${countcAll})`);

run('peric', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `peric ${lv} count`);
  qs.forEach(q => {
    check(q.cs.length === p.around && q.cs.filter(c => c.dir === q.dir).length === 1 && q.cs[q.ans].dir === q.dir, `peric ${lv} exactly one match`);
    q.cs.forEach((a, i) => {
      check(a.x - p.size >= 0 && a.x + p.size <= 360 && a.y - p.size >= 120 && a.y + p.size <= 520, `peric ${lv} C off the field`);
      check(dist(a, { x: 180, y: 310 }) >= p.size * 2.5 + 10, `peric ${lv} C on top of the middle one`);
      q.cs.forEach((b, j) => { if (i < j) check(dist(a, b) >= 2 * p.size + 16, `peric ${lv} Cs too close`); });
    });
  });
});

run('updownc', (tr, p, lv, r) => {
  const qs = tr.gen(p, r);
  check(qs.length === p.q, `updownc ${lv} count`);
  qs.forEach(q => check((q.a === q.b) === q.same && q.a >= 0 && q.a <= 3 && q.b >= 0 && q.b <= 3, `updownc ${lv} same / not the same`));
  check(qs.some(q => q.same) || qs.length < 5, `updownc ${lv} never the same`);
});

const BOX_QUICK = { x0: 50, y0: 150, x1: 310, y1: 560 };
let quickClose = 0, quickPairs = 0;
run('quicktouch', (tr, p, lv, r) => {
  const list = tr.gen(p, r);
  check(list.length === p.n, `quicktouch ${lv} count`);
  list.forEach((a, i) => {
    check(inBox(a, BOX_QUICK) && a.life === p.life, `quicktouch ${lv} square`);
    if (i) check(a.at > list[i - 1].at, `quicktouch ${lv} order`);
    for (let j = 0; j < i; j++) {
      const b = list[j];
      if (b.at + b.life > a.at) { quickPairs++; if (dist(a, b) < p.size * 1.1) quickClose++; }
    }
  });
});
check(quickClose / Math.max(1, quickPairs) < 0.01, `quicktouch: squares on top of each other (${quickClose} / ${quickPairs})`);

run('numtouch', (tr, p, lv, r) => {
  const bs = tr.gen(p, r);
  check(bs.length === p.boards, `numtouch ${lv} boards`);
  bs.forEach(b => check(b.cells.length === p.n && new Set(b.cells).size === p.n && b.cells.every(k => k >= 0 && k < p.cols * p.rows), `numtouch ${lv} cells`));
});

run('baseball', (tr, p, lv, r) => {
  const ps = tr.gen(p, r);
  check(ps.length === p.n, `baseball ${lv} count`);
  ps.forEach(x => check(x.time >= p.time[0] * 0.95 - 1e-9 && x.time <= Math.max(p.time[0] * 1.05, p.time[1]) + 1e-9 && Math.abs(x.curve) <= (p.curve || 0), `baseball ${lv} pitch`));
});

run('boxing', (tr, p, lv, r) => {
  const as = tr.gen(p, r);
  check(as.length === p.n, `boxing ${lv} count`);
  check(!as[0].punch && !as[1].punch, `boxing ${lv} starts with two mitts`);
  let last = -1;
  as.forEach(a => {
    if (a.punch) { check(a.punch === 1 || a.punch === -1, `boxing ${lv} punch`); return; }
    check(a.spot >= 0 && a.spot < p.spots && a.spot !== last, `boxing ${lv} mitt spot`);
    last = a.spot;
  });
});

run('pingpong', (tr, p, lv, r) => {
  const ss = tr.gen(p, r);
  check(ss.length === p.n, `pingpong ${lv} count`);
  ss.forEach(s => check(s.x1 >= 40 && s.x1 <= 320 && s.bounce > 0.5 && s.bounce < 0.75, `pingpong ${lv} shot`));
});

const BOX_BASKET = { x0: 60, y0: 200, x1: 300, y1: 500 };
run('basket', (tr, p, lv, r) => {
  const rs = tr.gen(p, r);
  check(rs.length === p.rounds, `basket ${lv} count`);
  rs.forEach(x => {
    check(x.pl.length === p.players && x.pl.filter(q => q.mate).length === p.mates, `basket ${lv} players`);
    x.pl.forEach((a, i) => {
      check(inBox(a, BOX_BASKET) && inBox({ x: a.x1, y: a.y1 }, BOX_BASKET), `basket ${lv} player off the court`);
      x.pl.forEach((b, j) => { if (i < j) check(dist(a, b) >= 60, `basket ${lv} players on top of each other`); });
    });
  });
});

run('volley', (tr, p, lv, r) => {
  const ts = tr.gen(p, r);
  check(ts.length === p.n, `volley ${lv} count`);
  ts.forEach(t => check(t.top >= 140 && t.top <= 230 && t.time > 0.5 && t.x1 < 250, `volley ${lv} toss (it must go up into the band, left of the net)`));
});

const BALL = { x: 180, y: 540 };
run('soccer', (tr, p, lv, r) => {
  const ps = tr.gen(p, r);
  check(ps.length === p.n, `soccer ${lv} count`);
  ps.forEach(x => {
    check(x.mates.length === p.mates && x.free >= 0 && x.free < p.mates, `soccer ${lv} mates`);
    const ang = x.mates.map(m => Math.atan2(m.y - BALL.y, m.x - BALL.x));
    ang.forEach((a, i) => ang.forEach((b, j) => { if (i < j) check(Math.abs(a - b) >= 0.4, `soccer ${lv} two teammates in the same direction`); }));
    const free = x.mates[x.free];
    check(x.defs.every(d => distToLine(d, BALL, free) > 24), `soccer ${lv} the free teammate is blocked`);
    x.mates.forEach((m, k) => { if (k !== x.free) check(x.defs.some(d => distToLine(d, BALL, m) < 12), `soccer ${lv} a teammate nobody blocks`); });
    check(x.defs.length >= p.mates - 1, `soccer ${lv} defenders`);
  });
});

run('football', (tr, p, lv, r) => {
  const ws = tr.gen(p, r);
  check(ws.reduce((a, w) => a + w.lanes.length, 0) === p.n, `football ${lv} rushers in all`);
  ws.forEach(w => check(w.lanes.length >= 1 && w.lanes.length <= 2 && new Set(w.lanes).size === w.lanes.length && w.lanes.every(l => l >= 0 && l <= 2) && w.gap > 0, `football ${lv} wave`));
  if (!p.two) check(ws.every(w => w.lanes.length === 1), `football ${lv} two at once at a level without them`);
});

// ---------------------------------------------------------------- data
console.log('data');
check(Data.TIPS.length === 48 && new Set(Data.TIPS).size === 48, '48 different eye facts');
check(Data.ANIMALS.length === 7 && new Set(Data.ANIMALS.map(a => a.id)).size === 7, 'seven animals');
check(Data.STRETCH.every(s => typeof s[0] === 'string' && s[1] > 1 && s[1] < 10), 'stretch steps');
{ const total = Data.STRETCH.reduce((a, s) => a + s[1], 0); check(total >= 40 && total <= 75, 'the stretch takes about a minute (' + total + ' s)'); }
check(Data.PICS.length >= 20 && new Set(Data.PICS.map(x => x.id)).size === Data.PICS.length, 'pictures');

// ---------------------------------------------------------------- save data and rules
console.log('save data');
{
  const f = C.sanitize(null);
  check(f.users.length === 1 && f.data[f.cur], 'fresh save');
  [undefined, 5, 'x', [], { v: 1 }, { v: 1, users: 'x' }, { v: 1, users: [{ id: 3 }], data: 9 },
    { v: 1, users: [{ id: 'u1', name: 42 }], data: { u1: { days: 'x', rec: [1], endless: { baseball: 'x' }, tipN: 999 } } }].forEach((s, i) => {
    let out = null;
    try { out = C.sanitize(s); } catch (e) { check(false, 'sanitize throws on case ' + i); }
    check(out && out.users.length >= 1 && out.data[out.cur], 'sanitize case ' + i);
  });
  check(C.sanitize({ v: 1, users: [{ id: 'u1' }], data: { u1: { tipN: 999 } } }).data.u1.tipN === 48, 'tipN stays within the facts');
  const store = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; } };
  store.v = '{broken json';
  check(C.load(store).users.length === 1, 'broken json loads as fresh');

  const s = C.fresh(), cuts = T.byId.shuffle.ranks.n;
  check(C.rankOf('count', cuts, 6) === 7 && C.rankOf('count', cuts, 5) === 6 && C.rankOf('count', cuts, 0) === 1, 'count ranks');
  const tcuts = T.byId.peric.ranks.n;
  check(C.rankOf('time', tcuts, 1) === 7 && C.rankOf('time', tcuts, 999) === 1, 'time ranks');
  let prev = 8;
  for (let sc = 0; sc < 100; sc += 0.5) { const rk = C.rankOf('time', tcuts, sc); check(rk <= prev, 'ranks go down as time grows'); prev = rk; }
  const a = C.addRun(s, { id: 'shuffle', level: 'n', kind: 'count', cuts, score: 3, text: 'x', today: '2026-10-01' });
  check(a.stampNew && a.firstPlay && a.stamps === 1 && a.rank === 4, 'first run gives a stamp');
  check(a.opened.trainings.length === 1 && a.opened.trainings[0] === 'rushcount', 'the first stamp opens かぞえて びゅん');
  check(!C.hardOpen(s, 'shuffle'), 'むずかしい is closed at first');
  const b = C.addRun(s, { id: 'shuffle', level: 'n', kind: 'count', cuts, score: 4, text: 'y', today: '2026-10-01' });
  check(!b.stampNew && b.newBest && !b.firstOfDay && b.runsToday === 2, 'second run the same day');
  check(b.opened.hard.length === 1 && b.opened.hard[0] === 'shuffle' && C.hardOpen(s, 'shuffle'), 'カメレオン at ふつう opens むずかしい');
  check(!C.hardOpen(s, 'flashnum'), 'only for that training');
  check(C.udata(s).rec.shuffle.n.hist.length === 1, 'graph keeps the first run of the day');
  C.addRun(s, { id: 'shuffle', level: 'n', kind: 'count', cuts, score: 2, text: 'z', today: '2026-10-02' });
  check(C.udata(s).rec.shuffle.n.best === 4 && C.udata(s).rec.shuffle.n.hist.length === 2, 'best stays, graph grows');
  check(C.stampCount(C.udata(s)) === 2 && C.isOpen(s, 'flashmark') && !C.isOpen(s, 'countc'), 'two stamps open two trainings');
  const nu = C.nextUnlock(s);
  check(nu && nu.training === 'countc' && nu.need === 1, 'next unlock');
  // the eye check
  const ck = C.addCheck(s, { ranks: [7, 7, 7, 7, 7], tests: ['shuffle', 'flashnum', 'triplec', 'peric', 'quicktouch'], today: '2026-10-02' });
  check(ck.recorded && ck.rank === 7 && ck.age == null && !ck.stampNew, 'check for a child (no eye age)');
  check(!C.addCheck(s, { ranks: [1, 1, 1, 1, 1], tests: ['shuffle', 'flashnum', 'triplec', 'peric', 'quicktouch'], today: '2026-10-02' }).recorded, 'second check of a day is practice');
  check(C.lastCheck(s).rank === 7 && C.checkedToday(s, '2026-10-02') && !C.checkedToday(s, '2026-10-03'), 'last check');
  const ck2 = C.addCheck(s, { ranks: [1, 2, 3, 4, 5], tests: ['rushcount', 'flashmark', 'countc', 'updownc', 'numtouch'], today: '2026-10-03' });
  check(ck2.stampNew && ck2.stamps === 3 && ck2.opened.trainings[0] === 'countc', 'a check alone gives a stamp too');
  check(C.eyeAge(1) === 20 && C.eyeAge(0) === 80, 'eye age range');
  for (let p = 0; p < 1; p += 0.01) check(C.eyeAge(p) >= C.eyeAge(p + 0.01), 'eye age gets younger as the check gets better');
  // きろくに ちょうせん
  const e1 = C.addEndless(s, 'baseball', 7, '2026-10-03');
  check(e1.first && e1.best === 7 && !e1.newBest, 'first endless record');
  const e2 = C.addEndless(s, 'baseball', 5, '2026-10-03');
  check(!e2.newBest && e2.best === 7 && C.udata(s).endless.baseball === 7, 'a lower endless score keeps the record');
  const e3 = C.addEndless(s, 'baseball', 12, '2026-10-03');
  check(e3.newBest && e3.best === 12 && e3.prev === 7, 'a new endless record');
  // the eye facts: one a day, in order
  check(C.tipToday(s, '2026-10-03') === 0, 'the first fact');
  C.tipSeen(s, '2026-10-03');
  check(C.tipToday(s, '2026-10-03') === -1 && C.tipToday(s, '2026-10-04') === 1, 'one fact a day');
  // users
  const u = C.addUser(s, 'パパ', 'adult');
  check(u && s.users.length === 2, 'add user');
  s.cur = u.id;
  check(C.isAdult(s) && C.stampCount(C.udata(s)) === 0 && C.tipToday(s, '2026-10-03') === 0, 'users have their own data');
  check(C.addCheck(s, { ranks: [4, 4, 4, 4, 4], tests: ['a', 'b', 'c', 'd', 'e'], today: '2026-10-03' }).age === C.eyeAge(0.5), 'grown-ups get an eye age');
  check(C.removeUser(s, u.id) && s.users.length === 1 && s.cur === 'u1', 'remove user');
  check(!C.removeUser(s, 'u1'), 'the last user stays');
  // ★: what the animal gives, but ★3 only with no mistakes and ★1 at half or less right
  check(C.starsOf(7) === 3 && C.starsOf(5) === 2 && C.starsOf(2) === 1, '★ from the animal');
  check(C.starsOf(7, 1) === 3 && C.starsOf(7, 7 / 8) === 2 && C.starsOf(7, 0.51) === 2 && C.starsOf(7, 3 / 6) === 1 && C.starsOf(7, 0) === 1, '★ from how much was right');
  check(C.starsOf(4, 1) === 2 && C.starsOf(2, 1) === 1, 'no more ★ than the animal gives');
  check(T.U.acc(0, 10) === 1 && T.U.acc(5, 10) === 0.5 && T.U.acc(30, 10) === 0 && T.U.acc(0, 0) === 1, 'acc: a share less for each mistake');
  {
    const s3 = C.fresh(), c3 = T.byId.updownc.ranks.n;
    const w1 = C.addRun(s3, { id: 'updownc', level: 'n', kind: 'count', cuts: c3, score: 9, acc: 0.9, text: '', today: '2026-10-01' });
    check(w1.rank >= 6 && w1.stars === 2 && C.udata(s3).rec.updownc.n.stars === 2, 'a good run with a mistake gets ★2');
    check(C.addRun(s3, { id: 'updownc', level: 'n', kind: 'count', cuts: c3, score: 10, acc: 1, text: '', today: '2026-10-01' }).stars === 3 && C.udata(s3).rec.updownc.n.stars === 3, 'a run with no mistakes gets ★3');
    check(C.addRun(s3, { id: 'updownc', level: 'n', kind: 'count', cuts: c3, score: 5, acc: 0.5, text: '', today: '2026-10-01' }).stars === 1 && C.udata(s3).rec.updownc.n.stars === 3, 'half right gets ★1 (the best ★ stays)');
  }
  // every training that keeps records says how much of a run was right
  T.list.filter(tr => !tr.checkOnly && !tr.versusOnly).forEach(tr => {
    const code = require('fs').readFileSync(require('path').join(__dirname, '../js/tr/' + tr.id + '.js'), 'utf8'), calls = code.split('api.finish(').slice(1);
    check(calls.length > 0 && calls.every(x => /^\{[^}]*\bacc: /.test(x)), tr.id + ' finishes without acc');
  });
  check(C.wallet(C.udata(s)) === C.starsEarned(C.udata(s)), 'wallet');
  const back = C.sanitize(JSON.parse(JSON.stringify(s)));
  check(JSON.stringify(back.data.u1) === JSON.stringify(s.data.u1), 'save survives a round trip');
  // 11 days open everything, 10 stamps open every むずかしい
  const s2 = C.fresh();
  for (let d = 1; d <= 11; d++) C.addRun(s2, { id: 'shuffle', level: 'e', kind: 'count', cuts, score: 1, text: '', today: '2026-11-' + String(d).padStart(2, '0') });
  check(Data.TRAININGS.every(t => C.isOpen(s2, t.id)) && !C.nextUnlock(s2), 'everything opens by 11 stamps');
  check(Data.TRAININGS.every(t => C.hardOpen(s2, t.id)), 'every むずかしい opens by 10 stamps');
  check(C.stampDays(C.udata(s2)).filter(x => x.big).length === 2, 'every 5th stamp is はなまる');
  const s3 = C.fresh(); s3.all = true;
  check(Data.TRAININGS.every(t => C.isOpen(s3, t.id) && C.hardOpen(s3, t.id)), 'the admin switch opens everything');
}

Object.keys(ngs).filter(m => ngs[m] > 1).forEach(m => console.log(`  (${ngs[m]} times) ${m}`));
console.log(`\n${checks} checks, ${bad ? bad + ' NG' : 'all OK'}`);
process.exit(bad ? 1 : 0);
