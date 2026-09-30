/* ケロちゃん みるみる — the pictures of this game, in the same sticker style as draw.js:
   ケロはかせ's glasses and cap, the seven rank animals (sharp eyes), stamps, and the things the
   eye trainings share (the C ring, arrows, marks, cups, targets).
   Everything is drawn with canvas paths; there are no image files. */
var Art = (function () {
  'use strict';
  var D = Draw, INK = D.INK, TAU = Math.PI * 2;
  var circle = D.circle, ellipse = D.ellipse, paint = D.paint, roundRect = D.roundRect;
  var FONT = '"M PLUS Rounded 1c", "Jua", "Hiragino Maru Gothic ProN", "BIZ UDPGothic", sans-serif';

  // ---------------------------------------------------------------- small helpers

  // A shape given as data: ['c', x, y, r] circle, ['e', x, y, rx, ry, rot] ellipse, ['r', cx, cy, w, h, radius, rot] box.
  function pathOf(ctx, p) {
    if (p[0] === 'c') circle(ctx, p[1], p[2], p[3]);
    else if (p[0] === 'e') ellipse(ctx, p[1], p[2], p[3], p[4], p[5] || 0);
    else if (p[0] === 'r') {
      ctx.save(); ctx.translate(p[1], p[2]); if (p[6]) ctx.rotate(p[6]);
      roundRect(ctx, -p[3] / 2, -p[4] / 2, p[3], p[4], p[5]);
      ctx.restore();
    }
  }
  // Several shapes that read as one body: outline them all first, then fill, so the seams disappear.
  function blob(ctx, parts, fill, lw) {
    ctx.lineJoin = 'round';
    parts.forEach(function (p) { pathOf(ctx, p); paint(ctx, null, INK, lw || 6); });
    parts.forEach(function (p) { pathOf(ctx, p); paint(ctx, fill); });
  }
  function eyeDot(ctx, x, y, r) {
    ellipse(ctx, x, y, r * 0.82, r); paint(ctx, '#2e1d14');
    circle(ctx, x - r * 0.3, y - r * 0.42, r * 0.38); paint(ctx, '#fff');
  }
  function smile(ctx, x, y, w) {
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.95, x + w, y);
    ctx.lineCap = 'round'; paint(ctx, null, INK, 2.4);
  }
  function blush(ctx, x, y, r) { ellipse(ctx, x, y, r, r * 0.62); paint(ctx, 'rgba(255,140,170,.75)'); }
  function stroke(ctx, pts, w, color) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; paint(ctx, null, color || INK, w);
  }
  // A thick line with an outline (tails, stalks, stems).
  function tube(ctx, draw, w, fill) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    draw(); paint(ctx, null, INK, w + 5);
    draw(); paint(ctx, null, fill, w);
  }

  // Outlined text in the game's rounded font.
  function text(ctx, str, x, y, size, fill, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || 800) + ' ' + size + 'px ' + FONT;
    // a text that would not fit (a long one in another language) is drawn smaller: o.max, or 330 wide
    var fit = Math.min(1, (o.max || 330) / Math.max(1, ctx.measureText(str).width));
    if (fit < 1) { size *= fit; ctx.font = (o.weight || 800) + ' ' + size + 'px ' + FONT; if (o.lw) o = Object.assign({}, o, { lw: o.lw * fit }); }
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (o.stroke !== false) { ctx.lineWidth = o.lw || size * 0.2; ctx.strokeStyle = o.stroke || INK; ctx.strokeText(str, x, y); }
    ctx.fillStyle = fill || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ---------------------------------------------------------------- ケロはかせ (use as f.wear on the frog)

  function hakase(ctx, kind) {
    if (kind !== 'frog') return;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // round glasses around the eyes
    for (var s = -1; s <= 1; s += 2) {
      circle(ctx, s * 20, -22, 16); paint(ctx, 'rgba(255,255,255,.16)', INK, 3.4);
      ctx.beginPath(); ctx.arc(s * 20, -22, 12.5, -2.6, -1.9); paint(ctx, null, 'rgba(255,255,255,.8)', 2);
    }
    ctx.beginPath(); ctx.moveTo(-5, -25); ctx.quadraticCurveTo(0, -30, 5, -25); paint(ctx, null, INK, 3.2);
    stroke(ctx, [-36, -24, -44, -19], 3.2); stroke(ctx, [36, -24, 44, -19], 3.2);
    // doctor's cap
    ellipse(ctx, -3, -37, 21, 9); paint(ctx, '#3f4466', INK, 3);
    ctx.beginPath(); ctx.moveTo(-40, -44); ctx.lineTo(-3, -57); ctx.lineTo(34, -44); ctx.lineTo(-3, -32); ctx.closePath();
    paint(ctx, '#4b517a', INK, 3);
    ctx.beginPath(); ctx.moveTo(-34, -44); ctx.lineTo(-3, -54); paint(ctx, null, 'rgba(255,255,255,.25)', 2.5);
    circle(ctx, -3, -44, 3.2); paint(ctx, '#ffd23d', INK, 1.8);
    // tassel
    stroke(ctx, [-3, -44, 22, -43, 25, -30], 2.4, '#ffd23d');
    roundRect(ctx, 21.5, -32, 7, 11, 3); paint(ctx, '#ffd23d', INK, 1.8);
    ctx.restore();
  }

  // おに: ケロはかせ with two little oni horns sticking out from under his cap (drawn first, so the cap sits over them).
  function hakaseOni(ctx, kind) {
    if (kind !== 'frog') return;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (var k = -1; k <= 1; k += 2) {
      ctx.save(); ctx.translate(-3 + k * 25, -46); ctx.rotate(k * 0.42);
      ctx.beginPath(); ctx.moveTo(-8.5, 6); ctx.quadraticCurveTo(-7, -12, k * 3, -27); ctx.quadraticCurveTo(7, -12, 8.5, 6); ctx.closePath();
      paint(ctx, '#fff1b3', INK, 3);
      ctx.beginPath(); ctx.moveTo(-6.4, -4); ctx.quadraticCurveTo(0, -7, 6.4, -4); paint(ctx, null, '#f0a93a', 3);
      ctx.beginPath(); ctx.moveTo(-4.6, -13); ctx.quadraticCurveTo(k * 1.2, -15.5, 4.8, -13); paint(ctx, null, '#f0a93a', 2.6);
      ctx.restore();
    }
    ctx.restore();
    hakase(ctx, kind);
  }

  // ---------------------------------------------------------------- the rank animals (feet at y = 0, facing right)
  // From the weakest eyes to the sharpest: もぐら, いぬ, ねこ, ふくろう, カメレオン, トンボ, わし.

  // A leg seen from the side, from the shoulder or hip (x, y) down to the ground (len): thick at the top, thin at the
  // ankle, a knee that bends (knee +1: forwards, the front legs; -1: backwards, the hind legs), and a paw (or a hoof).
  function leg(ctx, x, y, len, a, w0, w1, knee, col, hoof) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    var kx = knee * w0 * 0.3, ky = len * 0.55, fy = len - (hoof ? 6 : 4);
    ctx.beginPath();
    ctx.moveTo(-w0 / 2, -4);
    ctx.quadraticCurveTo(-w0 / 2 + kx * 0.4, ky * 0.6, -w1 / 2 + kx, ky);
    ctx.quadraticCurveTo(-w1 / 2 + kx * 0.3, fy * 0.9, -w1 / 2, fy);
    ctx.lineTo(w1 / 2, fy);
    ctx.quadraticCurveTo(w1 / 2 + kx * 0.3, fy * 0.9, w1 / 2 + kx, ky);
    ctx.quadraticCurveTo(w0 / 2 + kx * 0.4, ky * 0.6, w0 / 2, -4);
    ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, col, INK, 2.4);
    if (hoof) { roundRect(ctx, -w1 / 2 - 1.5, fy - 1, w1 + 3, 7, 2.5); paint(ctx, hoof, INK, 2); }
    else { ellipse(ctx, 2, fy + 0.5, w1 / 2 + 3, 3.8); paint(ctx, col, INK, 2.2); }
    ctx.restore();
  }
  // A cat's pointed ear, with its pink inside.
  function catEar(ctx, x, y, rot, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-7, 5); ctx.quadraticCurveTo(-4, -8, 0, -14); ctx.quadraticCurveTo(5, -6, 7, 4); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, col, INK, 2.4);
    ctx.beginPath(); ctx.moveTo(-3.5, 3); ctx.quadraticCurveTo(-1.5, -5, 0, -8); ctx.quadraticCurveTo(3, -3, 3.5, 2.5); ctx.closePath(); paint(ctx, '#ffb3c6');
    ctx.restore();
  }
  // A big bird's wing seen from the side, raised: broad, with the long feathers at its tip spread like fingers.
  function bigWing(ctx, x, y, a, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.bezierCurveTo(8, -14, 2, -30, -8, -40);
    ctx.lineTo(-10, -54); ctx.lineTo(-15, -42);
    ctx.lineTo(-19, -55); ctx.lineTo(-23, -41);
    ctx.lineTo(-29, -52); ctx.lineTo(-31, -38);
    ctx.lineTo(-38, -45); ctx.lineTo(-37, -33);
    ctx.bezierCurveTo(-30, -20, -22, -8, -14, 4);
    ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, col, INK, 2.6);
    [[2, -22, -30, -31], [5, -10, -24, -17]].forEach(function (l) { stroke(ctx, l, 1.8, 'rgba(0,0,0,.18)'); });
    ctx.restore();
  }

  function mole(ctx, t, run) {
    var k = run ? Math.sin(t * 12) : 0;
    // a little mound of earth
    ctx.beginPath(); ctx.moveTo(-54, 0); ctx.quadraticCurveTo(-34, -24, 0, -20); ctx.quadraticCurveTo(36, -22, 56, 0); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, '#c9935f', INK, 3);
    [[-30, -8], [-6, -10], [22, -9], [40, -4]].forEach(function (p) { circle(ctx, p[0], p[1], 2.6); paint(ctx, '#a8753f'); });
    blob(ctx, [['e', -2, -36, 30, 24], ['e', 28, -38, 15, 12]], '#6f625b');
    ellipse(ctx, 6, -30, 17, 13); paint(ctx, '#8b7d76');
    // big pink digging paws
    [[-6 + k * 4, -20, -0.4], [20 - k * 4, -19, 0.4]].forEach(function (p) {
      ellipse(ctx, p[0], p[1], 10, 7, p[2]); paint(ctx, '#ffb0c0', INK, 2.4);
      for (var c = -1; c <= 1; c++) stroke(ctx, [p[0] + c * 5, p[1] + 5, p[0] + c * 6, p[1] + 10], 2, '#fff4f6');
    });
    ellipse(ctx, 44, -40, 7, 5.5); paint(ctx, '#ff8fa6', INK, 2.4);
    // tiny eyes: it lives under the ground and hardly sees
    ctx.beginPath(); ctx.moveTo(28, -46); ctx.quadraticCurveTo(31, -48.5, 34, -46); ctx.lineCap = 'round'; paint(ctx, null, INK, 2.4);
    blush(ctx, 34, -35, 3.6);
    stroke(ctx, [42, -35, 54, -31], 1.5); stroke(ctx, [42, -39, 55, -40], 1.5);
  }

  function dog(ctx, t, run) {
    var g = run ? t * 12 : 0, bob = run ? -Math.abs(Math.sin(g)) * 2.5 : 0, wag = Math.sin(t * (run ? 14 : 8)) * 5;
    var C = '#f2c48a', FAR = '#e0ae74', E = '#c98b56', LT = '#fbe3c2';
    var sw = function (ph) { return run ? Math.sin(g + ph) * 0.5 : 0; };
    ctx.save(); ctx.translate(0, bob);
    // the far legs (a little darker), the tail, the near legs, then the body over their tops
    leg(ctx, 15, -30, 31, sw(Math.PI), 9.5, 6.5, 1, FAR);
    leg(ctx, -20, -30, 31, sw(0), 11, 6.5, -1, FAR);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-28, -42); ctx.quadraticCurveTo(-40 + wag * 0.3, -48, -38 + wag, -62); }, 6, C);
    leg(ctx, 19, -30, 31, sw(0), 10, 7, 1, C);
    leg(ctx, -16, -30, 31, sw(Math.PI), 12, 7, -1, C);
    ctx.beginPath();
    ctx.moveTo(-27, -26);
    ctx.bezierCurveTo(-37, -30, -37, -46, -23, -48);
    ctx.bezierCurveTo(-8, -51, 8, -50, 19, -47);
    ctx.bezierCurveTo(30, -44, 30, -30, 23, -26);
    ctx.bezierCurveTo(12, -22, -1, -26, -10, -25);
    ctx.bezierCurveTo(-17, -24, -23, -22, -27, -26);
    ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, C, INK, 3);
    // a red collar
    ctx.save(); ctx.translate(24, -46); ctx.rotate(-1.0); roundRect(ctx, -9, -3, 18, 6, 3); paint(ctx, '#ff6b6b', INK, 2); ctx.restore();
    // the head, the muzzle, the black nose
    ellipse(ctx, 34, -57, 14, 13); paint(ctx, C, INK, 3);
    ctx.beginPath(); ctx.moveTo(41, -62); ctx.quadraticCurveTo(55, -64, 57, -55); ctx.quadraticCurveTo(57, -48, 47, -47); ctx.quadraticCurveTo(41, -47, 39, -51); ctx.closePath();
    paint(ctx, LT, INK, 2.6);
    circle(ctx, 56, -57, 3.8); paint(ctx, '#3a2618'); circle(ctx, 55, -58.5, 1.2); paint(ctx, '#fff');
    ctx.beginPath(); ctx.moveTo(53, -51); ctx.quadraticCurveTo(49, -48.5, 45, -50); ctx.lineCap = 'round'; paint(ctx, null, INK, 1.8);
    eyeDot(ctx, 38, -61, 3.3);
    // the floppy ear
    ctx.save(); ctx.translate(28, -65); ctx.rotate(0.35 + (run ? Math.sin(g * 2) * 0.12 : 0));
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-9, 12, -4, 20); ctx.quadraticCurveTo(2, 23, 5, 16); ctx.quadraticCurveTo(7, 6, 4, -2); ctx.closePath();
    paint(ctx, E, INK, 2.4);
    ctx.restore();
    blush(ctx, 41, -52, 3.4);
    ctx.restore();
  }

  function cat(ctx, t, run) {
    var g = run ? t * 11 : 0, bob = run ? -Math.abs(Math.sin(g)) * 2.5 : 0, C = '#ffb86b', FAR = '#eba05a', S = '#e08a3c';
    var sw = function (ph) { return run ? Math.sin(g + ph) * 0.5 : 0; };
    ctx.save(); ctx.translate(0, bob);
    // the far legs (a little darker), the tail up with a curl, the near legs, then the body over their tops
    leg(ctx, 14, -28, 29, sw(Math.PI), 8.5, 5.5, 1, FAR);
    leg(ctx, -19, -28, 29, sw(0), 10, 5.5, -1, FAR);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-27, -40); ctx.bezierCurveTo(-43, -38, -50, -54, -42, -66); ctx.quadraticCurveTo(-38, -72, -32, -69); }, 6, C);
    leg(ctx, 18, -28, 29, sw(0), 9, 6, 1, C);
    leg(ctx, -15, -28, 29, sw(Math.PI), 11, 6, -1, C);
    ctx.beginPath();
    ctx.moveTo(-26, -24);
    ctx.bezierCurveTo(-36, -28, -36, -44, -22, -46);
    ctx.bezierCurveTo(-7, -49, 8, -48, 19, -44);
    ctx.bezierCurveTo(28, -41, 28, -28, 22, -24);
    ctx.bezierCurveTo(12, -20, -1, -24, -10, -23);
    ctx.bezierCurveTo(-17, -22, -22, -20, -26, -24);
    ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, C, INK, 3);
    [[-16, -46], [-7, -47], [2, -47]].forEach(function (q) { stroke(ctx, [q[0], q[1], q[0] + 1.5, q[1] + 7], 2.4, S); });
    // the head: the far ear, the round head, the near ear
    catEar(ctx, 26, -61, -0.35, FAR);
    ellipse(ctx, 34, -52, 14.5, 12.5); paint(ctx, C, INK, 3);
    catEar(ctx, 38, -62, 0.1, C);
    stroke(ctx, [28, -61, 30, -57], 2, S); stroke(ctx, [33, -63, 34, -58], 2, S);
    // the muzzle, a pink nose, a little mouth, whiskers and a round dark eye
    ellipse(ctx, 44, -48, 6.5, 5); paint(ctx, '#fff1dc');
    ctx.beginPath(); ctx.moveTo(46.5, -51.5); ctx.lineTo(50.5, -51); ctx.lineTo(48, -48.5); ctx.closePath(); paint(ctx, '#ff8fa6', INK, 1.4);
    ctx.beginPath(); ctx.moveTo(48, -48.5); ctx.quadraticCurveTo(47, -44.5, 43.5, -45.5); ctx.lineCap = 'round'; paint(ctx, null, INK, 1.8);
    eyeDot(ctx, 38, -54, 3.3);
    stroke(ctx, [44, -49, 57, -51], 1.3); stroke(ctx, [44, -47, 57, -44.5], 1.3);
    blush(ctx, 34, -46, 3.4);
    ctx.restore();
  }

  function owl(ctx, t, run) {
    var hop = run ? Math.abs(Math.sin(t * 8)) * 6 : 0, f = run ? Math.sin(t * 16) * 0.5 : 0, C = '#a8805a', LT = '#f3dcc0';
    ctx.save(); ctx.translate(0, -hop);
    [[-8, -2], [8, -2]].forEach(function (p) { ellipse(ctx, p[0], p[1], 6.5, 3.8); paint(ctx, '#ffab3d', INK, 2); });
    [[-1, -0.25 - f], [1, 0.25 + f]].forEach(function (w) {
      ctx.save(); ctx.translate(w[0] * 24, -32); ctx.rotate(w[1]); ellipse(ctx, 0, 8, 9, 20); paint(ctx, '#8f6a47', INK, 2.6); ctx.restore();
    });
    ellipse(ctx, 0, -32, 26, 31); paint(ctx, C, INK, 3);
    ellipse(ctx, 0, -23, 17, 19); paint(ctx, LT);
    [[-6, -26], [6, -26], [0, -18], [-8, -13], [8, -13]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0.2, Math.PI - 0.2); paint(ctx, null, '#c9a57f', 1.6); });
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * 13, -56); ctx.lineTo(s * 22, -71); ctx.lineTo(s * 25, -52); ctx.closePath(); paint(ctx, C, INK, 2.4); });
    // big round eyes, good in the dark
    [-10, 10].forEach(function (x) {
      circle(ctx, x, -44, 10.5); paint(ctx, '#fff', INK, 2.4);
      circle(ctx, x, -44, 7); paint(ctx, '#ffcf3d');
      circle(ctx, x + 1, -44, 3.8); paint(ctx, '#2e1d14');
      circle(ctx, x - 1.5, -46.5, 1.5); paint(ctx, '#fff');
    });
    ctx.beginPath(); ctx.moveTo(-4, -36); ctx.lineTo(4, -36); ctx.lineTo(0, -28); ctx.closePath(); paint(ctx, '#ffab3d', INK, 2);
    ctx.restore();
  }

  function chameleon(ctx, t, run) {
    var k = run ? Math.sin(t * 9) : 0, C = '#7ed957', DK = '#56b644';
    roundRect(ctx, -60, -5, 124, 8, 4); paint(ctx, '#b7844e', INK, 2.4);
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-24, -22); ctx.quadraticCurveTo(-46, -20, -46, -8); ctx.arc(-38, -8, 8, Math.PI, Math.PI * 2.5); }, 7, C);
    [-14 + k * 3, 16 - k * 3].forEach(function (x) { roundRect(ctx, x - 3.5, -14, 7, 13, 3); paint(ctx, C, INK, 2.2); });
    blob(ctx, [['e', 0, -24, 30, 14], ['e', 30, -30, 16, 12, -0.2]], C);
    ctx.beginPath(); ctx.moveTo(20, -38); ctx.quadraticCurveTo(28, -52, 40, -40); ctx.closePath(); paint(ctx, DK, INK, 2.2);
    [[-16, -29], [-4, -31], [8, -30]].forEach(function (p) { circle(ctx, p[0], p[1], 3.2); paint(ctx, DK); });
    // the cone eye: its pupil looks around on its own
    circle(ctx, 31, -32, 8.5); paint(ctx, C, INK, 2.4);
    var a = t * 2.4;
    circle(ctx, 31 + Math.cos(a) * 3.2, -32 + Math.sin(a) * 3.2, 3.2); paint(ctx, '#2e1d14');
    smile(ctx, 42, -24, 3.4); blush(ctx, 38, -21, 3);
  }

  // Seen from above, flying to the right: four long wings straight out from the chest (two up, two down).
  function dragonfly(ctx, t, run) {
    var f = Math.sin(t * (run ? 42 : 20)), bob = Math.sin(t * 3) * 3, sy = 0.9 + 0.1 * f;
    ctx.save(); ctx.translate(0, -52 + bob);
    [[13, -1, 2], [13, 1, 2], [3, -1, -6], [3, 1, -6]].forEach(function (w) {   // [root x, up -1 / down +1, lean of the tip]
      ctx.save(); ctx.translate(w[0], 0); ctx.scale(1, w[1] * sy);
      var tip = w[2];
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.bezierCurveTo(-9 + tip * 0.3, 18, tip - 9, 44, tip - 3, 52);
      ctx.bezierCurveTo(tip + 3, 57, tip + 10, 50, tip + 7, 36);
      ctx.bezierCurveTo(6 + tip * 0.3, 16, 5, 6, 4, 0);
      ctx.closePath();
      ctx.lineJoin = 'round'; paint(ctx, 'rgba(226,243,255,.85)', INK, 2);
      stroke(ctx, [0, 3, tip - 1, 46], 1.2, 'rgba(90,56,37,.28)');
      ellipse(ctx, tip + 2, 45, 2.2, 3.8); paint(ctx, '#56657f');
      ctx.restore();
    });
    // the long thin tail in segments, the chest, the head with two big eyes made of many little eyes
    tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-58, 0); }, 6.5, '#4fb0ff');
    [-12, -22, -32, -42, -52].forEach(function (x) { stroke(ctx, [x, -3, x, 3], 1.6, '#2b7fcc'); });
    ellipse(ctx, 9, 0, 11, 7.5); paint(ctx, '#4fb0ff', INK, 2.6);
    circle(ctx, 21, 0, 6); paint(ctx, '#4fb0ff', INK, 2.4);
    [-1, 1].forEach(function (s) {
      circle(ctx, 25, s * 5.5, 6.5); paint(ctx, '#7ee0a0', INK, 2.2);
      [[23, -1.5], [26.5, -1.5], [24.5, 1.8], [28, 1]].forEach(function (q) { circle(ctx, q[0], s * 5.5 + q[1] * s, 1); paint(ctx, 'rgba(255,255,255,.85)'); });
      circle(ctx, 27, s * 5.5 - 2.2, 1.6); paint(ctx, '#fff');
    });
    ctx.restore();
  }

  function eagle(ctx, t, run) {
    var f = Math.sin(t * (run ? 12 : 3)), C = '#8a5a32', DK = '#6b4226', HEAD = '#fffaf0';
    ctx.save(); ctx.translate(0, -40 + f * 3);
    bigWing(ctx, 2, -6, -0.1 - f * 0.35, DK);   // the far wing
    // the white tail, spread like a fan
    ctx.beginPath(); ctx.moveTo(-22, -3); ctx.lineTo(-46, -10); ctx.quadraticCurveTo(-54, 0, -46, 9); ctx.lineTo(-22, 5); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, HEAD, INK, 2.6);
    stroke(ctx, [-30, 0, -46, 0], 1.4, 'rgba(90,56,37,.3)');
    // the body, with the yellow feet tucked under it
    [[-2, 13], [6, 13]].forEach(function (q) { ellipse(ctx, q[0], q[1] + 1, 4, 2.6); paint(ctx, '#ffd23d', INK, 1.8); });
    ctx.beginPath(); ctx.moveTo(-24, 2); ctx.bezierCurveTo(-18, -14, 14, -16, 24, -8); ctx.bezierCurveTo(30, 0, 22, 12, 6, 13); ctx.bezierCurveTo(-8, 14, -22, 10, -24, 2); ctx.closePath();
    paint(ctx, C, INK, 3);
    // the white head, a hooked yellow beak and a sharp eye
    circle(ctx, 28, -9, 12.5); paint(ctx, HEAD, INK, 3);
    ctx.beginPath(); ctx.moveTo(38, -13); ctx.quadraticCurveTo(50, -13, 49, -4); ctx.quadraticCurveTo(48, -1, 45, -3); ctx.lineTo(39, -5); ctx.closePath();
    paint(ctx, '#ffd23d', INK, 2.2);
    circle(ctx, 32, -12, 4.2); paint(ctx, '#ffd23d', INK, 1.6); eyeDot(ctx, 32.5, -12, 2.3);
    stroke(ctx, [26, -17, 37, -15.5], 2.4);
    blush(ctx, 35, -5, 2.8);
    bigWing(ctx, -2, -4, -0.3 + f * 0.5, C);   // the near wing
    ctx.restore();
  }

  // (not a rank: the snail picture of かぞえて びゅん, the same as in あたま ぐんぐん)
  function snail(ctx, t, run) {
    var k = run ? Math.sin(t * 7) : 0;
    ctx.save(); ctx.scale(1 + k * 0.05, 1 - k * 0.03);
    [[50, 44, 0], [58, 64, 0.6]].forEach(function (s) {
      var wob = Math.sin(t * 3 + s[2]) * 2;
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s[0], -30); ctx.lineTo(s[1] + wob, -52); }, 4, '#ffe29a');
      circle(ctx, s[1] + wob, -54, 6.5); paint(ctx, '#fff', INK, 2.4);
      circle(ctx, s[1] + wob + 1.5, -54, 3.2); paint(ctx, '#2e1d14');
    });
    blob(ctx, [['e', 6, -8, 52, 9], ['e', 52, -22, 13, 17]], '#ffe29a');
    circle(ctx, -2, -32, 27); paint(ctx, '#ff9fb8', INK, 3);
    ctx.beginPath();
    for (var a = 0; a < Math.PI * 4.3; a += 0.12) {
      var rr = 22 * (1 - a / (Math.PI * 4.8)), px = -2 + Math.cos(a) * rr, py = -32 + Math.sin(a) * rr;
      if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.lineCap = 'round'; paint(ctx, null, '#e0718f', 3.5);
    ellipse(ctx, -14, -46, 7, 4, -0.6); paint(ctx, 'rgba(255,255,255,.7)');
    smile(ctx, 57, -19, 4.5); blush(ctx, 48, -15, 3.8);
    ctx.restore();
  }

  var ANIMAL_FN = { mole: mole, dog: dog, cat: cat, owl: owl, chameleon: chameleon, dragonfly: dragonfly, eagle: eagle, snail: snail };
  // rank 1..7 or an animal id; (x, y) = where the feet touch the ground
  function animal(ctx, which, x, y, s, t, o) {
    o = o || {};
    var id = typeof which === 'number' ? Data.ANIMALS[Math.max(0, Math.min(6, which - 1))].id : which;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    (ANIMAL_FN[id] || mole)(ctx, t || 0, !!o.run);
    ctx.restore();
  }

  // ---------------------------------------------------------------- stamps (はんこ)

  var STAMP = '#e5484d';
  // kind 'kero': ケロちゃん's face; 'hana': はなまる (every 5th stamp)
  function stamp(ctx, x, y, r, kind, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(r / 50, r / 50);
    ctx.globalAlpha = alpha == null ? 0.92 : alpha;
    ctx.strokeStyle = STAMP; ctx.fillStyle = STAMP; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'hana') {
      // petals around a spiral
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) {
        var q = i / 200 * TAU, rr = 40 + Math.abs(Math.sin(q * 3.5)) * 8;
        var px = Math.cos(q) * rr, py = Math.sin(q) * rr;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.beginPath();
      for (var a = 0; a < Math.PI * 5; a += 0.08) {
        var sr = 30 * (1 - a / (Math.PI * 5.6));
        var sx = Math.cos(a) * sr, sy = Math.sin(a) * sr;
        if (a) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
      }
      ctx.lineWidth = 5.5; ctx.stroke();
    } else {
      ctx.lineWidth = 5;
      circle(ctx, 0, 0, 46); ctx.stroke();
      // the frog face, all in stamp red
      ctx.lineWidth = 4.2;
      circle(ctx, -16, -14, 12); ctx.stroke();
      circle(ctx, 16, -14, 12); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 8, 30, 20, 0, Math.PI * 1.08, Math.PI * 1.92, true); ctx.stroke();
      circle(ctx, -16, -13, 4.5); ctx.fill();
      circle(ctx, 16, -13, 4.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, 10); ctx.quadraticCurveTo(0, 19, 10, 10); ctx.lineWidth = 3.6; ctx.stroke();
      ellipse(ctx, -22, 7, 5, 3); ctx.fill();
      ellipse(ctx, 22, 7, 5, 3); ctx.fill();
    }
    // worn ink: a few pale specks
    ctx.globalCompositeOperation = 'destination-out';
    var seed = kind === 'hana' ? 3 : 7;
    for (var k = 0; k < 16; k++) {
      seed = (seed * 16807) % 2147483647;
      var ang = seed % 628 / 100, dist = (seed >> 3) % 44;
      circle(ctx, Math.cos(ang) * dist, Math.sin(ang) * dist, 1.2 + (seed % 3) * 0.6); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- the eye trainings' own pictures

  // Directions: 0 up, 1 right, 2 down, 3 left.
  // With the diagonals too (おに, 8 directions): 0 up, 1 up-right, 2 right, 3 down-right, 4 down, 5 down-left, 6 left, 7 up-left.
  var DIR_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  var DIR8_ANGLE = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return -Math.PI / 2 + k * Math.PI / 4; });
  // The "C" of an eye chart (a ring with a gap), gap towards dir.
  // Black, as on a real eye chart; a light colour (a C that was tapped by mistake) gets the brown outline of the stickers.
  var C_COLOR = '#222222';
  function ringC(ctx, x, y, r, dir, color) { ringAt(ctx, x, y, r, DIR_ANGLE[dir], color); }
  function ringC8(ctx, x, y, r, dir, color) { ringAt(ctx, x, y, r, DIR8_ANGLE[dir], color); }
  function ringAt(ctx, x, y, r, a, color) {
    color = color || C_COLOR;
    var mid = r * 0.8, w = r * 0.42, gap = Math.asin(Math.min(0.9, w * 0.62 / mid));
    ctx.save(); ctx.lineCap = 'butt';
    if (isLight(color)) { ctx.beginPath(); ctx.arc(x, y, mid, a + gap - 0.1, a - gap + 0.1 + TAU); ctx.lineWidth = w + Math.max(3, r * 0.14); ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, mid, a + gap, a - gap + TAU); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
    ctx.restore();
  }
  function isLight(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255 > 0.6;
  }
  // A chunky arrow pointing dir.
  function dirArrow(ctx, x, y, s, dir, color) { arrowAt(ctx, x, y, s, DIR_ANGLE[dir], color); }
  function dirArrow8(ctx, x, y, s, dir, color) { arrowAt(ctx, x, y, s, DIR8_ANGLE[dir], color); }
  function arrowAt(ctx, x, y, s, a, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(17, -2); ctx.lineTo(7, -2); ctx.lineTo(7, 18); ctx.lineTo(-7, 18); ctx.lineTo(-7, -2); ctx.lineTo(-17, -2); ctx.closePath();
    ctx.lineJoin = 'round'; paint(ctx, color || '#ffb347', INK, 3);
    ctx.restore();
  }
  // Marks for ぱっと まる: maru ○ (the one to find), sankaku △, shikaku □, batsu ×, hoshi ☆;
  // and at おに the ones that look like ○: cmaru (a ring with a gap, like a C; 'cmaru3' opens towards DIR8 3) and nijumaru ◎.
  // Every mark has the same colour: with the ○ alone in red it could be found by its colour instead of its shape (2026-09-30).
  var MARKS = ['maru', 'sankaku', 'shikaku', 'batsu', 'hoshi'];
  var MARK_COLOR = '#ff5a7a';
  function mark(ctx, kind, x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var w = r * 0.3;
    ctx.beginPath();
    if (kind === 'maru') circle(ctx, 0, 0, r * 0.74);
    else if (kind.indexOf('cmaru') === 0) { var ca = DIR8_ANGLE[+kind.slice(5) || 0]; ctx.arc(0, 0, r * 0.74, ca + 0.5, ca - 0.5 + TAU); }
    else if (kind === 'nijumaru') { circle(ctx, 0, 0, r * 0.8); ctx.moveTo(r * 0.36, 0); ctx.arc(0, 0, r * 0.36, 0, TAU); }
    else if (kind === 'sankaku') { ctx.moveTo(0, -r * 0.82); ctx.lineTo(r * 0.8, r * 0.62); ctx.lineTo(-r * 0.8, r * 0.62); ctx.closePath(); }
    else if (kind === 'shikaku') roundRect(ctx, -r * 0.66, -r * 0.66, r * 1.32, r * 1.32, r * 0.08);
    else if (kind === 'batsu') { ctx.moveTo(-r * 0.62, -r * 0.62); ctx.lineTo(r * 0.62, r * 0.62); ctx.moveTo(r * 0.62, -r * 0.62); ctx.lineTo(-r * 0.62, r * 0.62); }
    else if (kind === 'hoshi') D.starPath(ctx, r * 0.86, r * 0.4);
    if (kind === 'nijumaru') w *= 0.72;   // (two thinner rings, about as heavy as one ○)
    ctx.lineWidth = w + 4.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = MARK_COLOR; ctx.stroke();
    ctx.restore();
  }
  // A cup upside down (シャッフル); (x, y) = the middle of its rim, lift = how far it is raised.
  // Every cup has the same colour: with different colours the chick could be found by colour, not with the eyes.
  var CUP_COLOR = '#6cc6ff';
  function cup(ctx, x, y, w, h, color, lift) {
    color = color || CUP_COLOR;
    ctx.save(); ctx.translate(x, y - (lift || 0));
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w * 0.36, -h); ctx.quadraticCurveTo(0, -h - w * 0.12, w * 0.36, -h); ctx.lineTo(w / 2, 0); ctx.closePath();
    paint(ctx, color, INK, 3.4);
    roundRect(ctx, -w / 2 - 3, -9, w + 6, 11, 5); paint(ctx, shade(color, 0.85), INK, 3);
    ellipse(ctx, -w * 0.2, -h * 0.62, w * 0.07, h * 0.24, 0.12); paint(ctx, 'rgba(255,255,255,.55)');
    ctx.restore();
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) * 2.2 : v * k))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  // A round button drawn on the play field.
  function disc(ctx, x, y, r, fill, lw) { circle(ctx, x, y, r); paint(ctx, fill || '#fffdf5', INK, lw || 3); }
  // A balloon (the balloon picture of かぞえて びゅん, the same as in あたま ぐんぐん).
  function balloon(ctx, x, y, r, color, t, label, o) {
    o = o || {};
    var sway = o.still ? 0 : Math.sin((t || 0) * 1.4 + x * 0.05) * 3;
    ctx.save(); ctx.translate(x + sway, y);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, r * 1.05); ctx.quadraticCurveTo(-sway + 5, r * 1.8, -sway * 0.6, r * 2.5);
    paint(ctx, null, 'rgba(90,56,37,.45)', 1.8);
    ellipse(ctx, 0, 0, r * 0.88, r); paint(ctx, color, INK, Math.max(2, r * 0.08));
    ctx.beginPath(); ctx.moveTo(-r * 0.14, r + r * 0.16); ctx.lineTo(0, r - r * 0.04); ctx.lineTo(r * 0.14, r + r * 0.16); ctx.closePath();
    paint(ctx, color, INK, Math.max(1.6, r * 0.06));
    ellipse(ctx, -r * 0.36, -r * 0.42, r * 0.2, r * 0.12, -0.7); paint(ctx, 'rgba(255,255,255,.85)');
    if (label != null) text(ctx, String(label), 0, r * 0.04, r * (String(label).length > 1 ? 0.78 : 0.95), '#fff', { lw: r * 0.2 });
    ctx.restore();
  }

  // ---------------------------------------------------------------- a big ○ and × (quiz style)

  function maru(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    circle(ctx, x, y, r); ctx.lineWidth = r * 0.3; ctx.strokeStyle = 'rgba(90,56,37,.35)'; ctx.stroke();
    circle(ctx, x, y, r); ctx.lineWidth = r * 0.22; ctx.strokeStyle = '#ff4f6a'; ctx.stroke();
    ctx.restore();
  }
  function batsu(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.lineWidth = r * 0.36; ctx.strokeStyle = 'rgba(90,56,37,.35)'; ctx.stroke();
    ctx.lineWidth = r * 0.26; ctx.strokeStyle = '#4f8dff'; ctx.stroke();
    ctx.restore();
  }

  return {
    FONT: FONT, MARKS: MARKS, CUP_COLOR: CUP_COLOR, C_COLOR: C_COLOR, DIR_ANGLE: DIR_ANGLE, DIR8_ANGLE: DIR8_ANGLE,
    blob: blob, eyeDot: eyeDot, smile: smile, blush: blush, stroke: stroke, tube: tube, text: text, shade: shade,
    hakase: hakase, hakaseOni: hakaseOni, animal: animal, stamp: stamp, maru: maru, batsu: batsu,
    ringC: ringC, ringC8: ringC8, ringAt: ringAt, dirArrow: dirArrow, dirArrow8: dirArrow8, arrowAt: arrowAt,
    mark: mark, cup: cup, disc: disc, balloon: balloon
  };
}());
