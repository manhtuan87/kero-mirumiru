/* ケロちゃん みるみる — save data and the rules around it:
   users, days and stamps, records, ranks, ★, what is open (trainings and むずかしい), the daily eye check,
   the eye facts, and the best records of どこまで いけるかな？.
   Shared by the browser game and the Node.js tools (nothing here touches the page). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.Core = factory(root.Data);
}(typeof self !== 'undefined' ? self : this, function (Data) {
  'use strict';

  var KEY = 'kero-mirumiru-v1';
  var MAX_USERS = 4, HIST = 60, NAME_MAX = 10, RECENT = 80;
  var COLORS = ['#86d65c', '#ff8fc0', '#6cc6ff', '#ffb347', '#b58cff', '#ffd23d'];
  var LEVEL_IDS = ['e', 'n', 'h', 'o', 'ae', 'a', 'ah', 'ao'];   // (a level not listed here loses its records when read)
  var NCHECK = Data.CHECK.length;

  // ---------------------------------------------------------------- dates (the phone's own clock)

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseDay(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  // ---------------------------------------------------------------- a fresh save

  function newData() {
    return { days: {}, rec: {}, lv: {}, seen: {}, spent: 0, owned: ['frog'], chara: 'frog', tipN: 0, tipDay: '', endless: {}, recent: {} };
  }
  function fresh() {
    return {
      v: 1, sfx: true, music: true, voice: true, all: false, stopAfter: 3, intro: false,
      users: [{ id: 'u1', name: '', type: 'kid', color: 0 }], cur: 'u1', next: 2,
      data: { u1: newData() }
    };
  }

  // ---------------------------------------------------------------- reading a save safely

  function num(v, def) { return typeof v === 'number' && isFinite(v) ? v : def; }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function clampInt(v, a, b) { return Math.max(a, Math.min(b, Math.round(num(v, a)))); }
  function isDay(k) { return /^\d{4}-\d\d-\d\d$/.test(k); }

  function cleanData(d) {
    d = obj(d);
    var out = newData();
    var days = obj(d.days);
    Object.keys(days).forEach(function (k) {
      if (!isDay(k)) return;
      var v = obj(days[k]), o = { stamp: !!v.stamp, runs: clampInt(v.runs, 0, 999) };
      if (v.nudged) o.nudged = true;
      var c = obj(v.check);
      if (typeof c.p === 'number') {
        o.check = {
          p: Math.max(0, Math.min(1, c.p)), rank: clampInt(c.rank, 1, 7),
          ranks: Array.isArray(c.ranks) ? c.ranks.slice(0, NCHECK).map(function (r) { return clampInt(r, 1, 7); }) : [],
          tests: Array.isArray(c.tests) ? c.tests.slice(0, NCHECK).filter(function (t) { return typeof t === 'string'; }) : []
        };
      }
      out.days[k] = o;
    });
    var rec = obj(d.rec);
    Object.keys(rec).forEach(function (id) {
      var r = obj(rec[id]), o = {};
      Object.keys(r).forEach(function (lv) {
        if (LEVEL_IDS.indexOf(lv) < 0) return;
        var x = obj(r[lv]);
        if (typeof x.best !== 'number' || !isFinite(x.best)) return;
        o[lv] = {
          best: x.best, rank: clampInt(x.rank, 1, 7), stars: clampInt(x.stars, 0, 3), plays: clampInt(x.plays, 0, 1e6),
          bt: typeof x.bt === 'string' ? x.bt.slice(0, 60) : '',
          hist: (Array.isArray(x.hist) ? x.hist : []).filter(function (h) {
            return Array.isArray(h) && isDay(h[0]) && typeof h[1] === 'number' && typeof h[2] === 'number';
          }).slice(-HIST)
        };
      });
      out.rec[id] = o;
    });
    var lv = obj(d.lv);
    Object.keys(lv).forEach(function (id) { if (LEVEL_IDS.indexOf(lv[id]) >= 0) out.lv[id] = lv[id]; });
    var seen = obj(d.seen);
    Object.keys(seen).forEach(function (id) { if (seen[id]) out.seen[id] = true; });
    var recent = obj(d.recent);
    Object.keys(recent).forEach(function (k) {
      if (Array.isArray(recent[k])) out.recent[k] = recent[k].filter(function (x) { return typeof x === 'string'; }).slice(-RECENT);
    });
    out.spent = clampInt(d.spent, 0, 1e6);
    if (Array.isArray(d.owned)) {
      d.owned.forEach(function (c) { if (typeof c === 'string' && out.owned.indexOf(c) < 0) out.owned.push(c); });
    }
    out.chara = out.owned.indexOf(d.chara) >= 0 ? d.chara : 'frog';
    out.tipN = clampInt(d.tipN, 0, Data.TIPS.length);
    out.tipDay = isDay(d.tipDay) ? d.tipDay : '';
    var en = obj(d.endless);
    Object.keys(en).forEach(function (id) { if (typeof en[id] === 'number' && en[id] > 0) out.endless[id] = clampInt(en[id], 0, 1e6); });
    return out;
  }

  function sanitize(s) {
    var out = fresh();
    if (!s || typeof s !== 'object' || s.v !== 1) return out;
    out.sfx = s.sfx !== false; out.music = s.music !== false; out.voice = s.voice !== false;
    out.all = !!s.all; out.intro = !!s.intro;
    out.shared = !!s.shared;   // (the players come from the shared list, js/accounts.js)
    out.stopAfter = [0, 3, 5].indexOf(s.stopAfter) >= 0 ? s.stopAfter : 3;
    var users = [], data = {};
    (Array.isArray(s.users) ? s.users : []).forEach(function (u) {
      u = obj(u);
      if (typeof u.id !== 'string' || !u.id || data[u.id] || users.length >= MAX_USERS) return;
      users.push({
        id: u.id, name: typeof u.name === 'string' ? u.name.slice(0, NAME_MAX) : '',
        type: u.type === 'adult' ? 'adult' : 'kid', color: clampInt(u.color, 0, COLORS.length - 1)
      });
      data[u.id] = cleanData(obj(s.data)[u.id]);
    });
    if (users.length) { out.users = users; out.data = data; }
    out.cur = data[s.cur] ? s.cur : out.users[0].id;
    var next = 2;
    out.users.forEach(function (u) { var m = /^u(\d+)$/.exec(u.id); if (m) next = Math.max(next, +m[1] + 1); });
    out.next = Math.max(next, clampInt(s.next, 2, 1e6));
    return out;
  }

  function load(storage) {
    var s = null;
    try { s = JSON.parse(storage.getItem(KEY)); } catch (e) { /* no storage or broken data */ }
    return sanitize(s);
  }
  function store(storage, s) { try { storage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }

  // ---------------------------------------------------------------- users

  function user(s) { for (var i = 0; i < s.users.length; i++) if (s.users[i].id === s.cur) return s.users[i]; return s.users[0]; }
  function udata(s) { return s.data[s.cur] || (s.data[s.cur] = newData()); }
  function isAdult(s) { return user(s).type === 'adult'; }
  function addUser(s, name, type) {
    if (s.users.length >= MAX_USERS) return null;
    var used = s.users.map(function (u) { return u.color; }), color = 0;
    while (used.indexOf(color) >= 0 && color < COLORS.length - 1) color++;
    var u = { id: 'u' + s.next++, name: (name || '').slice(0, NAME_MAX), type: type === 'adult' ? 'adult' : 'kid', color: color };
    s.users.push(u);
    s.data[u.id] = newData();
    return u;
  }
  function removeUser(s, id) {
    if (s.users.length <= 1) return false;
    s.users = s.users.filter(function (u) { return u.id !== id; });
    delete s.data[id];
    if (s.cur === id) s.cur = s.users[0].id;
    return true;
  }
  function resetUser(s, id) { s.data[id] = newData(); }

  // ---------------------------------------------------------------- ranks and ★

  // cuts: 6 limits from the best rank (7) down. 'time': lower is better; 'count': higher is better.
  function rankOf(kind, cuts, score) {
    for (var i = 0; i < 6; i++) {
      if (kind === 'time' ? score <= cuts[i] + 1e-9 : score >= cuts[i] - 1e-9) return 7 - i;
    }
    return 1;
  }
  /* ★ for a run: what the animal gives (rank 1-2 ★1, 3-5 ★2, 6-7 ★3), but no more than
     acc allows (how much of the run was right, 0..1): ★3 only with no mistakes, ★1 at half or less right. */
  function starsOf(rank, acc) {
    var s = rank <= 2 ? 1 : rank <= 5 ? 2 : 3;
    if (acc == null) return s;
    return Math.min(s, acc >= 1 - 1e-9 ? 3 : acc > 0.5 + 1e-9 ? 2 : 1);
  }
  function better(kind, a, b) { return kind === 'time' ? a < b - 1e-9 : a > b + 1e-9; }

  // ---------------------------------------------------------------- stamps and what is open

  function stampCount(u) { var n = 0; for (var k in u.days) if (u.days[k].stamp) n++; return n; }
  // Days with a stamp, oldest first, and which of them are every 5th stamp (はなまる).
  function stampDays(u) {
    var ks = Object.keys(u.days).filter(function (k) { return u.days[k].stamp; }).sort();
    return ks.map(function (k, i) { return { day: k, n: i + 1, big: (i + 1) % 5 === 0 }; });
  }
  function trainingInfo(id) { for (var i = 0; i < Data.TRAININGS.length; i++) if (Data.TRAININGS[i].id === id) return Data.TRAININGS[i]; return null; }
  function isOpen(s, id) {
    var t = trainingInfo(id);
    return !!t && (s.all || stampCount(udata(s)) >= t.unlock);
  }
  // むずかしい (and おとな むずかしい): a good result at the level before it, or enough stamps (as in the original).
  function hardFrom(lv) { for (var i = 0; i < Data.LEVELS.length; i++) if (Data.LEVELS[i].id === lv) return Data.LEVELS[i].hard || null; return null; }
  function hardOpen(s, id, lv) {
    var from = hardFrom(lv || 'h'), u = udata(s), x = from && u.rec[id] && u.rec[id][from];
    return !from || s.all || stampCount(u) >= Data.HARD_STAMPS || !!(x && x.rank >= Data.HARD_RANK);
  }
  function hardOpenAll(s) {
    var out = {};
    Data.TRAININGS.forEach(function (t) { Data.LEVELS.forEach(function (l) { if (l.hard) out[t.id + '/' + l.id] = hardOpen(s, t.id, l.id); }); });
    return out;
  }
  // おに (and おとな おに): ★3 at the level before it, or enough stamps.
  function oniFrom(lv) { for (var i = 0; i < Data.LEVELS.length; i++) if (Data.LEVELS[i].id === lv) return Data.LEVELS[i].oni || null; return null; }
  function oniOpen(s, id, lv) {
    var from = oniFrom(lv), u = udata(s), x = from && u.rec[id] && u.rec[id][from];
    return !from || s.all || stampCount(u) >= Data.ONI_STAMPS || !!(x && x.stars >= 3);
  }
  function oniOpenAll(s) {
    var out = {};
    Data.TRAININGS.forEach(function (t) { Data.LEVELS.forEach(function (l) { if (l.oni) out[t.id + '/' + l.id] = oniOpen(s, t.id, l.id); }); });
    return out;
  }
  // Can this level be played now (むずかしい and おに have their own rules)?
  function levelOpen(s, id, lv) { return hardOpen(s, id, lv) && oniOpen(s, id, lv); }
  function openedBetween(a, b) {
    var out = { trainings: [] };
    Data.TRAININGS.forEach(function (t) { if (t.unlock > a && t.unlock <= b) out.trainings.push(t.id); });
    return out;
  }
  // The next training more stamps will open: { need, training }.
  function nextUnlock(s) {
    var have = stampCount(udata(s)), best = null;
    Data.TRAININGS.forEach(function (t) { if (t.unlock > have && (!best || t.unlock < best.at)) best = { at: t.unlock, training: t.id }; });
    if (!best || s.all) return null;
    best.need = best.at - have;
    return best;
  }
  // The trainings whose むずかしい (or おに) opened between two states (for the "you can play むずかしい" card).
  function hardOpened(before, after) {
    return Object.keys(after).filter(function (k) { return after[k] && !before[k]; })
      .map(function (k) { var p = k.split('/'); return { id: p[0], lv: p[1] }; });
  }

  // ---------------------------------------------------------------- finishing a training

  /* info: { id, level, kind, cuts, score, acc, text, today? }
     Returns what happened, for the result screen. */
  function addRun(s, info) {
    var u = udata(s), today = info.today || dayKey();
    var hardBefore = hardOpenAll(s), oniBefore = oniOpenAll(s);
    var day = u.days[today] || (u.days[today] = { stamp: false, runs: 0 });
    var before = stampCount(u), stampNew = !day.stamp;
    var rank = rankOf(info.kind, info.cuts, info.score), stars = starsOf(rank, info.acc);
    var r = u.rec[info.id] || (u.rec[info.id] = {});
    var x = r[info.level], firstPlay = !x, newBest = false, prevBest = x ? x.best : null;
    if (!x) x = r[info.level] = { best: info.score, rank: rank, stars: stars, plays: 0, bt: info.text || '', hist: [] };
    else if (better(info.kind, info.score, x.best)) { x.best = info.score; x.bt = info.text || ''; newBest = true; }
    x.rank = Math.max(x.rank, rank);
    x.stars = Math.max(x.stars, stars);
    x.plays++;
    var last = x.hist[x.hist.length - 1], firstOfDay = !last || last[0] !== today;
    if (firstOfDay) { x.hist.push([today, info.score, rank]); if (x.hist.length > HIST) x.hist.shift(); }
    day.runs++;
    day.stamp = true;
    var opened = openedBetween(before, stampCount(u));
    opened.hard = hardOpened(hardBefore, hardOpenAll(s));
    opened.oni = hardOpened(oniBefore, oniOpenAll(s));
    return {
      rank: rank, stars: stars, firstPlay: firstPlay, newBest: newBest, prevBest: prevBest, firstOfDay: firstOfDay,
      stampNew: stampNew, stamps: stampCount(u), opened: opened, runsToday: day.runs
    };
  }

  // どこまで いけるかな？ (a sport until three misses): keeps the best number of successes.
  function addEndless(s, id, score, today) {
    var u = udata(s), prev = u.endless[id] || 0, newBest = score > prev;
    if (newBest) u.endless[id] = score;
    var day = u.days[today || dayKey()] || (u.days[today || dayKey()] = { stamp: false, runs: 0 });
    day.runs++;
    return { best: Math.max(prev, score), prev: prev, newBest: newBest && prev > 0, first: prev === 0 };
  }

  // ---------------------------------------------------------------- the daily eye check

  /* How today's check (p: 0..1) compares with the player's own usual, for the grown-ups' result. There is no proven
     way to turn these scores into an age, so we compare with the mean of the last COND_DAYS recorded checks:
     'up' / 'down' when today is at least one spread (their standard deviation, never less than COND_BAND) above or
     below it, else 'same'; 'warmup' (with `need`) until there are COND_MIN checks to compare with. */
  var COND_DAYS = 10, COND_MIN = 3, COND_BAND = 0.05;
  function condition(s, today, p) {
    var u = udata(s), ps = Object.keys(u.days).filter(function (k) { return k < today && u.days[k].check; }).sort()
      .slice(-COND_DAYS).map(function (k) { return u.days[k].check.p; });
    if (ps.length < COND_MIN) return { state: 'warmup', need: COND_MIN - ps.length };
    var mean = ps.reduce(function (a, b) { return a + b; }, 0) / ps.length;
    var sd = Math.sqrt(ps.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / ps.length);
    var band = Math.max(COND_BAND, sd);
    return { state: p >= mean + band ? 'up' : p <= mean - band ? 'down' : 'same', mean: mean, band: band };
  }
  function checkedToday(s, today) { var d = udata(s).days[today || dayKey()]; return !!(d && d.check); }

  /* info: { ranks: [5 ranks], tests: [5 ids], today? }  Only the first check of a day is kept. */
  function addCheck(s, info) {
    var u = udata(s), today = info.today || dayKey();
    var hardBefore = hardOpenAll(s), oniBefore = oniOpenAll(s);
    var day = u.days[today] || (u.days[today] = { stamp: false, runs: 0 });
    var before = stampCount(u), stampNew = !day.stamp, recorded = !day.check;
    var p = 0;
    info.ranks.forEach(function (r) { p += (r - 1) / 6; });
    p /= info.ranks.length || 1;
    var res = { p: p, rank: 1 + Math.round(p * 6), score: Math.round(p * 100), cond: condition(s, today, p) };
    if (recorded) day.check = { p: p, rank: res.rank, ranks: info.ranks.slice(), tests: info.tests.slice() };
    day.stamp = true;
    res.recorded = recorded;
    res.stampNew = stampNew;
    res.stamps = stampCount(u);
    res.opened = openedBetween(before, res.stamps);
    res.opened.hard = hardOpened(hardBefore, hardOpenAll(s));
    res.opened.oni = hardOpened(oniBefore, oniOpenAll(s));
    return res;
  }
  // The latest recorded check (for the recommendation): { day, ranks, tests } or null.
  function lastCheck(s) {
    var u = udata(s), ks = Object.keys(u.days).filter(function (k) { return u.days[k].check; }).sort();
    return ks.length ? u.days[ks[ks.length - 1]].check : null;
  }

  // ---------------------------------------------------------------- the eye facts (one a day, 48 in all)

  // The fact to show before today's first training (its index), or -1 (already shown today, or all seen).
  function tipToday(s, today) {
    var u = udata(s);
    today = today || dayKey();
    if (u.tipDay === today || u.tipN >= Data.TIPS.length) return -1;
    return u.tipN;
  }
  function tipSeen(s, today) {
    var u = udata(s);
    if (u.tipN < Data.TIPS.length) u.tipN++;
    u.tipDay = today || dayKey();
  }

  // ---------------------------------------------------------------- questions shown lately

  // Pictures (and the like) shown lately, the latest last: the next runs pick others first, so a pool is used up
  // before anything comes back.
  function recentOf(s, key) { return (udata(s).recent[key] || []).slice(); }
  function addRecent(s, key, ids) {
    var u = udata(s), r = u.recent[key] || (u.recent[key] = []);
    ids.forEach(function (id) { id = String(id); var i = r.indexOf(id); if (i >= 0) r.splice(i, 1); r.push(id); });
    if (r.length > RECENT) r.splice(0, r.length - RECENT);
  }

  // ---------------------------------------------------------------- the shop

  function starsEarned(u) {
    var n = 0;
    for (var id in u.rec) for (var lv in u.rec[id]) n += u.rec[id][lv].stars || 0;
    return n;
  }
  function wallet(u) { return Math.max(0, starsEarned(u) - u.spent); }

  return {
    KEY: KEY, MAX_USERS: MAX_USERS, NAME_MAX: NAME_MAX, COLORS: COLORS,
    dayKey: dayKey, parseDay: parseDay, fresh: fresh, sanitize: sanitize, load: load, store: store,
    user: user, udata: udata, isAdult: isAdult, addUser: addUser, removeUser: removeUser, resetUser: resetUser,
    rankOf: rankOf, starsOf: starsOf, better: better,
    stampCount: stampCount, stampDays: stampDays, isOpen: isOpen, hardOpen: hardOpen, oniOpen: oniOpen, levelOpen: levelOpen,
    nextUnlock: nextUnlock, trainingInfo: trainingInfo,
    addRun: addRun, addEndless: addEndless, addCheck: addCheck, checkedToday: checkedToday, condition: condition, lastCheck: lastCheck,
    tipToday: tipToday, tipSeen: tipSeen,
    recentOf: recentOf, addRecent: addRecent,
    starsEarned: starsEarned, wallet: wallet
  };
}));
