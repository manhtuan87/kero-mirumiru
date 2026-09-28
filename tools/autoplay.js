/* For checking the game in a browser without touching it: a pretend player that answers every training.
   Load it into the page from the console:
     var s = document.createElement('script'); s.src = 'tools/autoplay.js'; document.head.appendChild(s);
   then e.g.  TT.start('shuffle', 'n'); TT.play(90);  (the page must be on localhost, where the game is silent).
   A training's peek() tells what a player would do now:
     { x, y }             tap there              { cho: i }        tap answer button i
     { pad: n }           type n on the pad      { swipe: [x0, y0, x1, y1] }   slide a finger
     { now: true, x, y }  tap there right now (timing: baseball, table tennis, volleyball, football) */
window.TT = {
  press: function (v) {
    var b = Array.prototype.find.call(document.querySelectorAll('.nkey'), function (x) { return x.textContent === String(v); });
    if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  },
  cho: function (i) {
    var b = document.querySelectorAll('.cho')[i];
    if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  },
  // a finger touching the play field and lifting again (as the canvas's pointer events do)
  tap: function (x, y) {
    var se = MIRU.run && MIRU.run.session;
    if (!se) return;
    if (se.down) se.down({ x: x, y: y }, 1);
    if (se.up && MIRU.run && MIRU.run.session === se) se.up({ x: x, y: y }, 1);
  },
  swipe: function (s) {
    var se = MIRU.run && MIRU.run.session;
    if (!se) return;
    if (se.down) se.down({ x: s[0], y: s[1] }, 1);
    if (se.move) { se.move({ x: (s[0] + s[2]) / 2, y: (s[1] + s[3]) / 2 }, 1); se.move({ x: s[2], y: s[3] }, 1); }
    if (se.up) se.up({ x: s[2], y: s[3] }, 1);
  },
  // one right move, if the training is waiting for one
  act: function (wrong) {
    var r = MIRU.run;
    if (!r || r.done || r.state !== 'play' || !r.session.peek) return false;
    var v = r.session.peek();
    if (v == null) return false;
    if (wrong) return TT.wrong(v);
    if (v.pad != null) { if (r.params.adult) String(v.pad).split('').forEach(TT.press); else TT.press(v.pad); }
    else if (v.cho != null) TT.cho(v.cho);
    else if (v.swipe) TT.swipe(v.swipe);
    else TT.tap(v.x, v.y);
    return true;
  },
  // a wrong move instead (for checking what a miss looks like)
  wrong: function (v) {
    var r = MIRU.run;
    if (v.pad != null) { var w = (v.pad + 1) % 10; if (r.params.adult) String(v.pad + 1).split('').forEach(TT.press); else TT.press(w); }
    else if (v.cho != null) TT.cho(v.cho === 0 ? 1 : 0);
    else if (v.swipe) TT.swipe([v.swipe[0], v.swipe[1], v.swipe[0] - (v.swipe[2] - v.swipe[0]), v.swipe[3]]);
    else if (!v.now) TT.tap(v.x < 180 ? v.x + 150 : v.x - 150, v.y < 330 ? v.y + 150 : v.y - 150);
    return true;
  },
  // plays for up to `sec` game seconds, thinking `think` seconds before each answer; o.miss: chance of a wrong move
  play: function (sec, think, o) {
    think = think || 0.6; o = o || {};
    var t = 0, skip = 0;
    while (t < sec && MIRU.run && !MIRU.run.done) {
      var r = MIRU.run, v = r.state === 'play' && r.session.peek && r.session.peek();
      if (v != null && v !== false && t >= skip) {
        var miss = o.miss && Math.random() < o.miss;
        if (miss && v.now) skip = t + 1.5;   // (a timing miss: let the moment pass)
        else {
          if (!v.now) { MIRU.tick(think); t += think; }
          TT.act(miss);
        }
      }
      // (the sports need the right moment: look at every frame there)
      var dt = r.tr.sport || (v && v.now) ? 1 / 30 : 0.1;
      MIRU.tick(dt); t += dt;
    }
    return [MIRU.screen, MIRU.run && MIRU.run.tr.id, !MIRU.run || MIRU.run.done, Math.round(t)];
  },
  // opens a training (skipping its practice) and runs the countdown
  start: function (id, lv, opts) {
    var s = MIRU.save;
    s.data[s.cur].seen[id] = true;
    document.getElementById('overlay').classList.remove('on');
    MIRU.go('list');
    MIRU.openIntro(MIRU.T.byId[id]);
    MIRU.startRun(MIRU.T.byId[id], lv, opts || {});
    MIRU.tick(2.4);
    return MIRU.run.state;
  },
  // until the training asks something
  until: function (max) { var n = 0; while (MIRU.run && MIRU.run.session.peek && MIRU.run.session.peek() == null && n++ < (max || 300)) MIRU.tick(0.1); return n; },
  result: function () { MIRU.tick(1.5); return [MIRU.screen, document.getElementById('r-title').textContent, document.getElementById('r-detail').textContent]; }
};
