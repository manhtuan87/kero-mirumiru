/* ケロちゃん みるみる — the 27 pictures of かぞえて びゅん (the same pictures as in あたま ぐんぐん).
   Each one is drawn in a 100 x 100 box around (0, 0), then scaled: Pics.draw(ctx, id, x, y, size, t). */
var Pics = (function () {
  'use strict';
  var D = Draw, A = Art, INK = D.INK, TAU = Math.PI * 2;
  var circle = D.circle, ellipse = D.ellipse, paint = D.paint, roundRect = D.roundRect;
  var stroke = A.stroke, tube = A.tube;

  function shine(ctx, x, y, rx, ry, rot) { ellipse(ctx, x, y, rx, ry, rot || -0.6); paint(ctx, 'rgba(255,255,255,.8)'); }

  // The characters of the series, without their seats.
  function critter(ctx, kind, t, k, dy) {
    ctx.save(); ctx.translate(0, dy); ctx.scale(k, k);
    D.critter(ctx, { x: 0, y: 0, t: t || 0, kind: kind, noSeat: true, look: null, mode: 'idle' });
    ctx.restore();
  }

  function eggPath(ctx, r) {
    var w = r * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(w * 0.62, -r, w, -r * 0.3, w, r * 0.2);
    ctx.bezierCurveTo(w, r * 0.7, w * 0.56, r, 0, r);
    ctx.bezierCurveTo(-w * 0.56, r, -w, r * 0.7, -w, r * 0.2);
    ctx.bezierCurveTo(-w, -r * 0.3, -w * 0.62, -r, 0, -r);
    ctx.closePath();
  }

  var P = {
    dog: function (ctx, t) { critter(ctx, 'dog', t, 0.8, 0); },
    cat: function (ctx, t) { critter(ctx, 'cat', t, 0.78, 6); },
    rabbit: function (ctx, t) { critter(ctx, 'rabbit', t, 0.6, 14); },
    frog: function (ctx, t) { critter(ctx, 'frog', t, 0.86, -4); },
    chick: function (ctx, t) { D.chick(ctx, 0, 10, 2.5, t || 0, {}); },
    star: function (ctx) { D.star(ctx, 0, 3, 0, 0, 2.45); },
    snail: function (ctx, t) { A.animal(ctx, 'snail', -6, 24, 0.72, t || 0); },
    balloon: function (ctx, t) { A.balloon(ctx, 0, -18, 27, '#ff94c2', t || 0, null, { still: true }); },

    umbrella: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(2, -30); ctx.lineTo(2, 32); ctx.arc(-7, 32, 9, 0, Math.PI, false); }, 5, '#a8733f');
      ctx.beginPath();
      ctx.moveTo(-46, 0); ctx.quadraticCurveTo(-44, -44, 2, -44); ctx.quadraticCurveTo(48, -44, 50, 0);
      for (var i = 0; i < 4; i++) { var x0 = 50 - i * 24; ctx.quadraticCurveTo(x0 - 12, -12, x0 - 24, 0); }
      ctx.closePath(); ctx.lineJoin = 'round';
      paint(ctx, '#ff6f9f', INK, 3.2);
      ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(2, -44); ctx.lineTo(-10, 0); ctx.lineTo(-34, 0); ctx.closePath(); paint(ctx, '#ffc2da');
      ctx.beginPath(); ctx.moveTo(2, -44); ctx.lineTo(38, 0); ctx.lineTo(14, 0); ctx.closePath(); paint(ctx, '#ffc2da');
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-46, 0); ctx.quadraticCurveTo(-44, -44, 2, -44); ctx.quadraticCurveTo(48, -44, 50, 0);
      for (i = 0; i < 4; i++) { x0 = 50 - i * 24; ctx.quadraticCurveTo(x0 - 12, -12, x0 - 24, 0); }
      ctx.closePath(); paint(ctx, null, INK, 3.2);
      circle(ctx, 2, -47, 4); paint(ctx, '#ffd23d', INK, 2);
    },
    shoe: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-42, 14); ctx.lineTo(-40, -22); ctx.quadraticCurveTo(-37, -31, -24, -29); ctx.lineTo(-10, -26);
      ctx.quadraticCurveTo(-2, -8, 18, -6); ctx.quadraticCurveTo(44, -3, 46, 14); ctx.closePath();
      paint(ctx, '#6cc6ff', INK, 3.2);
      ellipse(ctx, 30, 6, 14, 9); paint(ctx, '#e8f7ff', INK, 2.4);
      [[-18, -20, -4, -18], [-14, -13, 0, -11], [-10, -6, 4, -5]].forEach(function (l) { stroke(ctx, l, 3, '#fff'); });
      roundRect(ctx, -46, 12, 94, 14, 7); paint(ctx, '#fff', INK, 3);
      stroke(ctx, [-36, 19, 38, 19], 2, 'rgba(90,56,37,.3)');
      shine(ctx, -30, -12, 4, 8, 0.1);
    },
    flower: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(-4, 30, 0, 48); }, 5, '#6cc157');
      ellipse(ctx, -13, 32, 13, 6, -0.5); paint(ctx, '#86d65c', INK, 2.4);
      ellipse(ctx, 13, 38, 13, 6, 0.5); paint(ctx, '#86d65c', INK, 2.4);
      for (var i = 0; i < 5; i++) {
        var q = -Math.PI / 2 + i * TAU / 5;
        circle(ctx, Math.cos(q) * 19, -12 + Math.sin(q) * 19, 14); paint(ctx, '#ff94c2', INK, 2.8);
      }
      circle(ctx, 0, -12, 12); paint(ctx, '#ffd23d', INK, 2.8);
      A.eyeDot(ctx, -4, -14, 2); A.eyeDot(ctx, 4, -14, 2); A.smile(ctx, 0, -8, 3);
    },
    crab: function (ctx, t) {
      var c = '#ff6b5a';
      for (var s = -1; s <= 1; s += 2) {
        for (var k = 0; k < 3; k++) stroke(ctx, [s * 24, 10 + k * 7, s * 42, 16 + k * 9, s * 46, 26 + k * 8], 4, INK);
        for (k = 0; k < 3; k++) stroke(ctx, [s * 24, 10 + k * 7, s * 42, 16 + k * 9, s * 46, 26 + k * 8], 2, c);
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s * 22, -2); ctx.lineTo(s * 36, -16); }, 5, c);
        ctx.save(); ctx.translate(s * 38, -24); ctx.scale(s, 1);
        ctx.beginPath(); ctx.arc(0, 0, 12, 0.5, TAU - 0.3); ctx.lineTo(2, -2); ctx.closePath();
        ctx.lineJoin = 'round'; paint(ctx, c, INK, 2.6);
        ctx.restore();
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s * 9, -8); ctx.lineTo(s * 11, -24); }, 3, c);
        circle(ctx, s * 11, -27, 6); paint(ctx, '#fff', INK, 2.2);
        circle(ctx, s * 11, -26, 3); paint(ctx, '#2e1d14');
      }
      ellipse(ctx, 0, 8, 32, 21); paint(ctx, c, INK, 3.2);
      A.smile(ctx, 0, 10, 6); A.blush(ctx, -17, 8, 4); A.blush(ctx, 17, 8, 4);
      shine(ctx, -14, -2, 6, 3.5);
    },
    peach: function (ctx) {
      ellipse(ctx, -10, -34, 13, 6, -0.5); paint(ctx, '#86d65c', INK, 2.4);
      ellipse(ctx, 10, -37, 13, 6, 0.5); paint(ctx, '#86d65c', INK, 2.4);
      ctx.beginPath(); ctx.moveTo(0, -30);
      ctx.bezierCurveTo(24, -36, 40, -12, 36, 10); ctx.bezierCurveTo(32, 34, 12, 40, 0, 40);
      ctx.bezierCurveTo(-12, 40, -32, 34, -36, 10); ctx.bezierCurveTo(-40, -12, -24, -36, 0, -30); ctx.closePath();
      ctx.lineJoin = 'round'; paint(ctx, '#ffb0bf', INK, 3.2);
      ctx.save(); ctx.clip(); ellipse(ctx, 14, 14, 24, 26); paint(ctx, 'rgba(255,120,150,.35)'); ctx.restore();
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(-12, -10, -10, 16, -2, 36); ctx.lineCap = 'round'; paint(ctx, null, 'rgba(90,56,37,.5)', 2.4);
      shine(ctx, -20, -12, 6, 4);
    },
    apple: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(4, -40); }, 3, '#8a5a33');
      ellipse(ctx, 16, -34, 12, 6, -0.4); paint(ctx, '#86d65c', INK, 2.4);
      A.blob(ctx, [['c', -13, 4, 29], ['c', 13, 4, 29], ['e', 0, 20, 24, 20]], '#ff5a5a');
      ctx.beginPath(); ctx.moveTo(-8, -22); ctx.quadraticCurveTo(0, -18, 8, -22); paint(ctx, null, 'rgba(90,56,37,.4)', 2.4);
      shine(ctx, -20, -6, 7, 4.5);
    },
    strawberry: function (ctx) {
      ctx.beginPath(); ctx.moveTo(0, 42);
      ctx.bezierCurveTo(-30, 30, -42, -4, -30, -20); ctx.quadraticCurveTo(0, -32, 30, -20); ctx.bezierCurveTo(42, -4, 30, 30, 0, 42);
      ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, '#ff5a6e', INK, 3.2);
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4 - (r > 1 ? r - 1 : 0); c++) {
          var n = 4 - (r > 1 ? r - 1 : 0), x = (c - (n - 1) / 2) * 15, y = -10 + r * 12;
          ellipse(ctx, x, y, 2, 3); paint(ctx, '#ffe066');
        }
      }
      for (var i = 0; i < 5; i++) {
        var q = Math.PI + i * Math.PI / 4;
        ellipse(ctx, Math.cos(q) * 13, -24 + Math.sin(q) * 5, 10, 4.5, q); paint(ctx, '#6cc157', INK, 2.2);
      }
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(2, -38); }, 3, '#6cc157');
      shine(ctx, -18, -8, 5, 3.5);
    },
    egg: function (ctx) {
      ctx.save(); ctx.translate(0, 4);
      eggPath(ctx, 42); ctx.lineJoin = 'round'; paint(ctx, '#fffaf0', INK, 3.2);
      ctx.save(); eggPath(ctx, 42); ctx.clip(); ellipse(ctx, 14, 22, 30, 26); paint(ctx, 'rgba(240,215,170,.35)'); ctx.restore();
      shine(ctx, -14, -18, 7, 11, 0.4);
      ctx.restore();
    },
    watermelon: function (ctx) {
      ctx.save(); ctx.translate(0, -14);
      ctx.beginPath(); ctx.moveTo(-48, 0); ctx.arc(0, 0, 48, Math.PI, 0, true); ctx.closePath(); paint(ctx, '#5fb453', INK, 3.2);
      ctx.beginPath(); ctx.moveTo(-42, 0); ctx.arc(0, 0, 42, Math.PI, 0, true); ctx.closePath(); paint(ctx, '#effbe0');
      ctx.beginPath(); ctx.moveTo(-37, 0); ctx.arc(0, 0, 37, Math.PI, 0, true); ctx.closePath(); paint(ctx, '#ff5a6e');
      stroke(ctx, [-48, 0, 48, 0], 3.2);
      [[-20, 10], [0, 14], [20, 10], [-10, 24], [10, 24], [0, 32]].forEach(function (p) { ellipse(ctx, p[0], p[1], 2.4, 4); paint(ctx, '#3a2618'); });
      ctx.restore();
    },
    grapes: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(2, -36, 6, -42); }, 3, '#8a5a33');
      ellipse(ctx, 18, -36, 13, 7, -0.3); paint(ctx, '#86d65c', INK, 2.4);
      [[4, -16], [3, 0], [2, 16], [1, 32]].forEach(function (row, ri) {
        for (var i = 0; i < row[0]; i++) {
          var x = (i - (row[0] - 1) / 2) * 19, y = row[1] - 2;
          circle(ctx, x, y, 10.5); paint(ctx, '#a26bdb', INK, 2.4);
          circle(ctx, x - 3.5, y - 3.5, 2.6); paint(ctx, 'rgba(255,255,255,.7)');
        }
      });
    },
    mandarin: function (ctx) {
      circle(ctx, 0, 6, 38); paint(ctx, '#ffa13d', INK, 3.2);
      [[-16, -6], [10, -14], [20, 10], [-6, 20], [-22, 18], [8, 30]].forEach(function (p) { circle(ctx, p[0], p[1], 1.6); paint(ctx, 'rgba(255,230,190,.8)'); });
      ellipse(ctx, 0, -31, 7, 3.5); paint(ctx, '#6cc157', INK, 2);
      ellipse(ctx, 12, -36, 11, 5, -0.5); paint(ctx, '#86d65c', INK, 2.2);
      shine(ctx, -18, -10, 7, 4.5);
    },
    fish: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-50, -18); ctx.lineTo(-46, 0); ctx.lineTo(-50, 18); ctx.closePath(); paint(ctx, '#4fb0f0', INK, 3);
      ctx.beginPath(); ctx.moveTo(-6, -18); ctx.quadraticCurveTo(4, -34, 18, -20); ctx.closePath(); paint(ctx, '#4fb0f0', INK, 2.6);
      ellipse(ctx, 6, 0, 36, 22); paint(ctx, '#6cc6ff', INK, 3.2);
      ctx.save(); ellipse(ctx, 6, 0, 35, 21); ctx.clip(); ellipse(ctx, 6, 16, 30, 12); paint(ctx, '#d8f1ff'); ctx.restore();
      [[-12, -2], [-2, -8], [-2, 6]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 6, -1.2, 1.2); paint(ctx, null, 'rgba(255,255,255,.7)', 2); });
      circle(ctx, 26, -6, 6); paint(ctx, '#fff', INK, 2.2); A.eyeDot(ctx, 27, -6, 3);
      A.smile(ctx, 36, 6, 3.5); A.blush(ctx, 22, 6, 3.6);
    },
    hat: function (ctx) {
      ellipse(ctx, 0, 16, 48, 14); paint(ctx, '#f5d27a', INK, 3);
      ctx.beginPath(); ctx.moveTo(-27, 14); ctx.quadraticCurveTo(-28, -32, 0, -32); ctx.quadraticCurveTo(28, -32, 27, 14); ctx.closePath();
      ctx.lineJoin = 'round'; paint(ctx, '#f5d27a', INK, 3);
      ctx.save(); ctx.clip(); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(-30, -4, 60, 12); ctx.restore();
      stroke(ctx, [-27, -4, 27, -4], 2.2); stroke(ctx, [-27, 8, 27, 8], 2.2);
      ctx.strokeStyle = 'rgba(160,110,40,.35)'; ctx.lineWidth = 1.6;
      [-14, 0, 14].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x * 1.3, -6); ctx.stroke(); });
      ellipse(ctx, 14, 2, 7, 5); paint(ctx, '#ff6b6b', INK, 2);
      shine(ctx, -12, -20, 5, 3);
    },
    car: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-16, -34); ctx.lineTo(18, -34); ctx.lineTo(32, -8); ctx.closePath(); paint(ctx, '#ff6b6b', INK, 3.2);
      ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(-12, -28); ctx.lineTo(-1, -28); ctx.lineTo(-1, -10); ctx.closePath(); paint(ctx, '#c9ecff', INK, 2.2);
      ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(4, -28); ctx.lineTo(15, -28); ctx.lineTo(24, -10); ctx.closePath(); paint(ctx, '#c9ecff', INK, 2.2);
      roundRect(ctx, -48, -12, 96, 30, 11); paint(ctx, '#ff6b6b', INK, 3.2);
      circle(ctx, 42, -2, 4); paint(ctx, '#ffe066', INK, 1.8);
      [-26, 26].forEach(function (x) { circle(ctx, x, 18, 12); paint(ctx, '#4a4a58', INK, 3); circle(ctx, x, 18, 5); paint(ctx, '#d8d8e0'); });
      shine(ctx, -30, -4, 8, 3, 0);
    },
    riceball: function (ctx) {
      function tri() {
        ctx.beginPath(); ctx.moveTo(0, 34);
        ctx.arcTo(-44, 34, 0, -40, 14); ctx.arcTo(0, -40, 44, 34, 14); ctx.arcTo(44, 34, -44, 34, 14); ctx.closePath();
      }
      tri(); ctx.lineJoin = 'round'; paint(ctx, '#fff', INK, 3.2);
      ctx.save(); tri(); ctx.clip();
      roundRect(ctx, -18, 6, 36, 34, 3); paint(ctx, '#2f4f3a');
      ctx.restore();
      tri(); paint(ctx, null, INK, 3.2);
      stroke(ctx, [-18, 6, -18, 32], 2.2); stroke(ctx, [18, 6, 18, 32], 2.2); stroke(ctx, [-18, 6, 18, 6], 2.2);
      shine(ctx, -10, -14, 5, 3);
    },
    sunflower: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, 50); }, 5, '#6cc157');
      ellipse(ctx, 12, 38, 12, 6, 0.4); paint(ctx, '#86d65c', INK, 2.2);
      for (var i = 0; i < 12; i++) {
        var q = i * TAU / 12;
        ellipse(ctx, Math.cos(q) * 24, -8 + Math.sin(q) * 24, 12, 6, q); paint(ctx, '#ffd23d', INK, 2.4);
      }
      circle(ctx, 0, -8, 18); paint(ctx, '#8a5a33', INK, 2.8);
      [[-6, -14], [6, -14], [0, -6], [-8, -2], [8, -2], [0, -18]].forEach(function (p) { circle(ctx, p[0], p[1], 1.8); paint(ctx, '#5a3825'); });
    },
    mitten: function (ctx) {
      A.blob(ctx, [['r', 4, -8, 50, 66, 24], ['e', -22, 0, 10, 17, -0.5]], '#ff6b6b');
      roundRect(ctx, -24, 22, 56, 18, 7); paint(ctx, '#fff', INK, 3);
      [[-4, -20], [14, -24], [6, -4]].forEach(function (p) { D.heart(ctx, p[0], p[1], 7, '#fff'); });
      stroke(ctx, [-14, 31, 24, 31], 2, 'rgba(90,56,37,.25)');
    },
    pencil: function (ctx) {
      ctx.save(); ctx.rotate(-0.72);
      roundRect(ctx, -42, -10, 64, 20, 3); paint(ctx, '#ffd23d', INK, 3);
      stroke(ctx, [-40, -3, 20, -3], 1.6, 'rgba(90,56,37,.3)'); stroke(ctx, [-40, 4, 20, 4], 1.6, 'rgba(90,56,37,.3)');
      ctx.beginPath(); ctx.moveTo(22, -10); ctx.lineTo(46, 0); ctx.lineTo(22, 10); ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, '#f3c89a', INK, 3);
      ctx.beginPath(); ctx.moveTo(38, -3.4); ctx.lineTo(46, 0); ctx.lineTo(38, 3.4); ctx.closePath(); paint(ctx, '#4a4a58');
      roundRect(ctx, -50, -10, 10, 20, 2); paint(ctx, '#c8c8d0', INK, 2.6);
      roundRect(ctx, -60, -10, 12, 20, 6); paint(ctx, '#ff9fb8', INK, 2.6);
      ctx.restore();
    },
    cherry: function (ctx) {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-16, 10); ctx.quadraticCurveTo(-8, -20, 4, -36); ctx.moveTo(16, 14); ctx.quadraticCurveTo(12, -16, 4, -36);
      paint(ctx, null, INK, 6); paint(ctx, null, '#6cc157', 3);
      ellipse(ctx, 18, -34, 13, 6, -0.3); paint(ctx, '#86d65c', INK, 2.4);
      circle(ctx, -16, 22, 16); paint(ctx, '#ff4f6a', INK, 3);
      circle(ctx, 17, 26, 16); paint(ctx, '#ff4f6a', INK, 3);
      shine(ctx, -21, 16, 4.5, 3); shine(ctx, 12, 20, 4.5, 3);
    }
  };

  var NAMES = {};
  Data.PICS.forEach(function (p) { NAMES[p.id] = p.name; });

  function draw(ctx, id, x, y, size, t) {
    var f = P[id];
    if (!f) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, size / 100);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    f(ctx, t || 0);
    ctx.restore();
  }

  return { draw: draw, ids: Data.PICS.map(function (p) { return p.id; }), name: function (id) { return NAMES[id] || ''; } };
}());
