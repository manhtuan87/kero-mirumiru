/* ケロちゃん みるみる — the pictures of かぞえて びゅん (the same pictures as in あたま ぐんぐん).
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
    },
    // ---- added 2026-09-29: more pictures, so the questions repeat less
    bear: function (ctx) {
      [-1, 1].forEach(function (s) { circle(ctx, s * 29, -28, 13); paint(ctx, '#b07845', INK, 3); circle(ctx, s * 29, -28, 6.5); paint(ctx, '#e9b98a'); });
      circle(ctx, 0, 4, 39); paint(ctx, '#b07845', INK, 3.2);
      ellipse(ctx, 0, 18, 18, 13); paint(ctx, '#f1d2ae', INK, 2.4);
      ellipse(ctx, 0, 11, 6, 4.5); paint(ctx, '#3a2618');
      stroke(ctx, [0, 15, 0, 20], 2.2); A.smile(ctx, -4, 20, 4); A.smile(ctx, 4, 20, 4);
      A.eyeDot(ctx, -15, -4, 4); A.eyeDot(ctx, 15, -4, 4);
      A.blush(ctx, -26, 10, 5); A.blush(ctx, 26, 10, 5);
      shine(ctx, -22, -18, 7, 4);
    },
    cow: function (ctx) {
      [-1, 1].forEach(function (s) {
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s * 16, -26); ctx.quadraticCurveTo(s * 24, -42, s * 14, -47); }, 5, '#fff3c4');
        ellipse(ctx, s * 37, -14, 13, 7, s * 0.45); paint(ctx, '#fff', INK, 2.8);
        ellipse(ctx, s * 37, -14, 7, 3.5, s * 0.45); paint(ctx, '#ffb3c6');
      });
      ellipse(ctx, 0, 2, 30, 36); paint(ctx, '#fff', INK, 3.2);
      ctx.save(); ellipse(ctx, 0, 2, 29, 35); ctx.clip();
      ellipse(ctx, 20, -24, 15, 12, 0.4); paint(ctx, '#4a4a58');
      ellipse(ctx, -25, 6, 9, 13, -0.2); paint(ctx, '#4a4a58');
      ctx.restore();
      ellipse(ctx, 0, 24, 24, 15); paint(ctx, '#ffb3c6', INK, 2.6);
      ellipse(ctx, -8, 24, 3, 4); paint(ctx, '#c05a78'); ellipse(ctx, 8, 24, 3, 4); paint(ctx, '#c05a78');
      A.eyeDot(ctx, -12, -2, 4); A.eyeDot(ctx, 12, -2, 4);
      shine(ctx, -16, -18, 5, 3);
    },
    turtle: function (ctx) {
      ctx.lineJoin = 'round';
      [[-30, 24], [18, 24]].forEach(function (p) { ellipse(ctx, p[0], p[1], 9, 11); paint(ctx, '#9ee07a', INK, 2.6); });
      ctx.beginPath(); ctx.moveTo(-42, 10); ctx.lineTo(-54, 16); ctx.lineTo(-42, 19); ctx.closePath(); paint(ctx, '#9ee07a', INK, 2.4);
      ellipse(ctx, 37, 0, 15, 13); paint(ctx, '#9ee07a', INK, 2.8);
      A.eyeDot(ctx, 41, -4, 3.2); A.smile(ctx, 43, 5, 3.5); A.blush(ctx, 34, 6, 3);
      ctx.beginPath(); ctx.moveTo(-44, 16); ctx.bezierCurveTo(-44, -36, 30, -36, 30, 16); ctx.closePath();
      paint(ctx, '#5fb453', INK, 3.2);
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(40,90,40,.55)'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-17, -10); ctx.lineTo(3, -10); ctx.lineTo(11, 3); ctx.lineTo(3, 16); ctx.lineTo(-17, 16); ctx.lineTo(-25, 3); ctx.closePath(); ctx.stroke();
      [[-17, -10, -26, -30], [3, -10, 10, -30], [11, 3, 34, 0], [-25, 3, -46, 0]].forEach(function (l) { ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.stroke(); });
      ctx.restore();
      roundRect(ctx, -48, 12, 82, 9, 4.5); paint(ctx, '#e8c887', INK, 2.6);
      shine(ctx, -24, -14, 7, 3.5);
    },
    monkey: function (ctx) {
      [-1, 1].forEach(function (s) { circle(ctx, s * 37, 2, 12); paint(ctx, '#a0663a', INK, 3); circle(ctx, s * 37, 2, 6.5); paint(ctx, '#f3c79a'); });
      circle(ctx, 0, 0, 35); paint(ctx, '#a0663a', INK, 3.2);
      A.blob(ctx, [['e', -11, -3, 13, 15], ['e', 11, -3, 13, 15], ['e', 0, 15, 22, 15]], '#f3c79a', 4.8);
      A.eyeDot(ctx, -10, -4, 4); A.eyeDot(ctx, 10, -4, 4);
      ellipse(ctx, -3, 10, 1.6, 2); paint(ctx, '#7a4a2a'); ellipse(ctx, 3, 10, 1.6, 2); paint(ctx, '#7a4a2a');
      A.smile(ctx, 0, 17, 8);
      A.blush(ctx, -20, 10, 4); A.blush(ctx, 20, 10, 4);
      stroke(ctx, [-5, -33, 0, -42, 5, -33], 2.8, INK);
      shine(ctx, -20, -20, 6, 3.5);
    },
    elephant: function (ctx) {
      [-1, 1].forEach(function (s) { ellipse(ctx, s * 29, -4, 20, 26, s * 0.25); paint(ctx, '#aab4c8', INK, 3); ellipse(ctx, s * 30, -3, 11, 16, s * 0.25); paint(ctx, '#ffc2da'); });
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-2, 34, 14, 40); ctx.quadraticCurveTo(24, 42, 22, 32); }, 11, '#aab4c8');
      ellipse(ctx, 0, -6, 25, 26); paint(ctx, '#aab4c8', INK, 3.2);
      A.eyeDot(ctx, -10, -8, 4); A.eyeDot(ctx, 10, -8, 4);
      A.blush(ctx, -16, 4, 4.5); A.blush(ctx, 16, 4, 4.5);
      shine(ctx, -12, -22, 6, 3.5);
    },
    moon: function (ctx) {
      // a crescent: the big circle less a circle taken out on its upper right
      ctx.save(); ctx.translate(-4, 4);
      ctx.beginPath(); ctx.arc(0, 0, 40, -1.361, 0.644, true); ctx.arc(16, -6, 34, 1.080, -1.798, false); ctx.closePath();
      ctx.lineJoin = 'round'; paint(ctx, '#ffe066', INK, 3.2);
      ctx.beginPath(); ctx.arc(-22, -6, 4.5, 0.2, Math.PI - 0.2); ctx.lineCap = 'round'; paint(ctx, null, INK, 2.4);
      A.smile(ctx, -20, 10, 4.5); A.blush(ctx, -29, 4, 4);
      shine(ctx, -24, -22, 4, 7, 0.5);
      ctx.restore();
      D.star(ctx, 22, -18, 0, 0, 0.8); D.star(ctx, 30, 12, 0, 0, 0.55);
    },
    cloud: function (ctx) {
      A.blob(ctx, [['c', -24, 8, 20], ['c', 0, -8, 27], ['c', 26, 6, 20], ['r', 0, 18, 86, 28, 14]], '#eef8ff');
      A.eyeDot(ctx, -9, 6, 3.6); A.eyeDot(ctx, 9, 6, 3.6); A.smile(ctx, 0, 14, 5);
      A.blush(ctx, -18, 14, 4); A.blush(ctx, 18, 14, 4);
      shine(ctx, -8, -22, 7, 3.5);
    },
    house: function (ctx) {
      ctx.lineJoin = 'round';
      roundRect(ctx, 18, -40, 11, 22, 2); paint(ctx, '#b07845', INK, 2.6);
      roundRect(ctx, -32, -10, 64, 52, 4); paint(ctx, '#fff1d6', INK, 3);
      ctx.beginPath(); ctx.moveTo(-46, -6); ctx.lineTo(0, -46); ctx.lineTo(46, -6); ctx.closePath(); paint(ctx, '#ff6b6b', INK, 3.2);
      roundRect(ctx, -9, 14, 18, 28, 3); paint(ctx, '#b07845', INK, 2.6); circle(ctx, 5, 29, 2); paint(ctx, '#ffd23d');
      [-21, 21].forEach(function (x) { roundRect(ctx, x - 7, 2, 14, 14, 2); paint(ctx, '#c9ecff', INK, 2.4); stroke(ctx, [x, 2, x, 16], 1.6); stroke(ctx, [x - 7, 9, x + 7, 9], 1.6); });
      shine(ctx, -20, -18, 6, 3);
    },
    boat: function (ctx) {
      ctx.lineJoin = 'round';
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -44); }, 3, '#a8733f');
      ctx.beginPath(); ctx.moveTo(4, -40); ctx.lineTo(38, 10); ctx.lineTo(4, 10); ctx.closePath(); paint(ctx, '#fff', INK, 3);
      ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(-4, 10); ctx.lineTo(-30, 10); ctx.closePath(); paint(ctx, '#c9ecff', INK, 3);
      ctx.beginPath(); ctx.moveTo(1, -46); ctx.lineTo(17, -41); ctx.lineTo(1, -36); ctx.closePath(); paint(ctx, '#ff6b6b', INK, 2.2);
      ctx.beginPath(); ctx.moveTo(-46, 14); ctx.lineTo(46, 14); ctx.lineTo(34, 36); ctx.lineTo(-34, 36); ctx.closePath(); paint(ctx, '#ff6b6b', INK, 3.2);
      stroke(ctx, [-40, 21, 40, 21], 2.4, '#fff');
      [-20, 0, 20].forEach(function (x) { circle(ctx, x, 28, 3.2); paint(ctx, '#fff', INK, 1.8); });
      ctx.beginPath(); ctx.moveTo(-48, 44);
      for (var i = 0; i < 4; i++) ctx.quadraticCurveTo(-36 + i * 24, 38, -24 + i * 24, 44);
      ctx.lineCap = 'round'; paint(ctx, null, '#4fb0f0', 3.4);
    },
    octopus: function (ctx) {
      var c = '#ff7b6b';
      [[-28, -44, 30], [-14, -22, 42], [0, 6, 44], [14, 28, 40], [28, 46, 26]].forEach(function (l) {
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(l[0], 4); ctx.quadraticCurveTo(l[0], l[2] - 4, l[1], l[2]); }, 9, c);
      });
      ellipse(ctx, 0, -12, 33, 31); paint(ctx, c, INK, 3.2);
      A.eyeDot(ctx, -12, -8, 4); A.eyeDot(ctx, 12, -8, 4);
      ellipse(ctx, 0, 6, 5, 4.5); paint(ctx, '#e8483c', INK, 2);
      A.blush(ctx, -22, 2, 4.5); A.blush(ctx, 22, 2, 4.5);
      shine(ctx, -14, -30, 8, 4.5);
    },
    bread: function (ctx) {
      function shape() {
        ctx.beginPath(); ctx.moveTo(-32, 38); ctx.lineTo(-32, -6);
        ctx.bezierCurveTo(-48, -12, -44, -44, -16, -40); ctx.bezierCurveTo(-6, -48, 6, -48, 16, -40);
        ctx.bezierCurveTo(44, -44, 48, -12, 32, -6); ctx.lineTo(32, 38); ctx.closePath();
      }
      shape(); ctx.lineJoin = 'round'; paint(ctx, '#d99a4e', INK, 3.2);
      ctx.save(); ctx.translate(0, 4); ctx.scale(0.8, 0.8); shape(); paint(ctx, '#fff6dd'); ctx.restore();
      A.eyeDot(ctx, -10, 6, 3.6); A.eyeDot(ctx, 10, 6, 3.6); A.smile(ctx, 0, 14, 5);
      A.blush(ctx, -18, 14, 4); A.blush(ctx, 18, 14, 4);
    },
    top: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-3, 32); ctx.lineTo(0, 46); ctx.lineTo(3, 32); ctx.closePath(); paint(ctx, '#8a5a33', INK, 2);
      function body() { ctx.beginPath(); ctx.moveTo(-44, -10); ctx.bezierCurveTo(-40, 18, -12, 30, 0, 36); ctx.bezierCurveTo(12, 30, 40, 18, 44, -10); ctx.closePath(); }
      body(); paint(ctx, '#ff6b6b');
      ctx.save(); body(); ctx.clip();
      ctx.fillStyle = '#ffd23d'; ctx.fillRect(-50, 4, 100, 8);
      ctx.fillStyle = '#4fb0f0'; ctx.fillRect(-50, 18, 100, 7);
      ctx.restore();
      body(); paint(ctx, null, INK, 3.2);
      ellipse(ctx, 0, -10, 44, 11); paint(ctx, '#ffe0e0', INK, 3);
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -44); }, 6, '#c8843c');
      shine(ctx, -28, 4, 6, 3);
    },
    rainbow: function (ctx) {
      var cols = ['#ff5a5a', '#ffa13d', '#ffe066', '#6cc157', '#4fb0f0', '#a26bdb'];
      ctx.save(); ctx.translate(0, 20);
      function band() { ctx.beginPath(); ctx.arc(0, 0, 46, Math.PI, 0); ctx.arc(0, 0, 10, 0, Math.PI, true); ctx.closePath(); }
      band(); paint(ctx, '#fff');
      cols.forEach(function (c, i) { ctx.beginPath(); ctx.arc(0, 0, 43 - i * 6, Math.PI, 0); ctx.lineWidth = 6.3; ctx.strokeStyle = c; ctx.stroke(); });
      band(); ctx.lineJoin = 'round'; paint(ctx, null, INK, 3.2);
      ctx.restore();
      [-32, 32].forEach(function (x) { A.blob(ctx, [['c', x - 10, 26, 10], ['c', x + 2, 20, 12], ['c', x + 12, 27, 9], ['r', x + 1, 32, 38, 12, 6]], '#eef8ff'); });
    },
    mushroom: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-16, 6); ctx.quadraticCurveTo(-20, 40, -2, 40); ctx.lineTo(4, 40); ctx.quadraticCurveTo(22, 40, 16, 6); ctx.closePath();
      paint(ctx, '#fff3dd', INK, 3);
      A.eyeDot(ctx, -6, 20, 3); A.eyeDot(ctx, 8, 20, 3); A.smile(ctx, 1, 27, 3.5);
      ctx.beginPath(); ctx.moveTo(-46, 8); ctx.bezierCurveTo(-48, -44, 48, -44, 46, 8); ctx.quadraticCurveTo(0, 17, -46, 8); ctx.closePath();
      paint(ctx, '#ff5a5a', INK, 3.2);
      [[-24, -10, 7], [2, -22, 8], [26, -8, 6], [-8, 3, 4.5], [16, 4, 4]].forEach(function (d) { circle(ctx, d[0], d[1], d[2]); paint(ctx, '#fff'); });
    },
    glasses: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-43, -2); ctx.lineTo(-49, -14); ctx.moveTo(43, -2); ctx.lineTo(49, -14); }, 4, '#ff6b6b');
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(0, -11, 8, -2); }, 4, '#ff6b6b');
      [-1, 1].forEach(function (s) {
        circle(ctx, s * 25, 4, 18); paint(ctx, '#e3f4ff');
        ctx.save(); circle(ctx, s * 25, 4, 18); ctx.clip(); ellipse(ctx, s * 25 - 7, -4, 5, 9, -0.6); paint(ctx, 'rgba(255,255,255,.95)'); ctx.restore();
        circle(ctx, s * 25, 4, 18); paint(ctx, null, INK, 8.5); circle(ctx, s * 25, 4, 18); paint(ctx, null, '#ff6b6b', 4);
      });
    },
    banana: function (ctx) {
      [-0.5, -0.12, 0.26].forEach(function (rot) {
        ctx.save(); ctx.translate(0, -38); ctx.rotate(rot); ctx.translate(0, 38);
        ctx.beginPath(); ctx.moveTo(-2, -38); ctx.bezierCurveTo(32, -28, 42, 12, 22, 38); ctx.lineTo(13, 40);
        ctx.bezierCurveTo(16, 10, 6, -22, -10, -32); ctx.closePath();
        ctx.lineJoin = 'round'; paint(ctx, '#ffe066', INK, 3);
        ctx.beginPath(); ctx.moveTo(4, -30); ctx.bezierCurveTo(24, -16, 28, 10, 20, 32); paint(ctx, null, 'rgba(200,150,40,.45)', 2);
        circle(ctx, 18, 38, 2.8); paint(ctx, '#6a4a2a');
        ctx.restore();
      });
      roundRect(ctx, -7, -48, 12, 12, 3); paint(ctx, '#8a6a3a', INK, 2.4);
    },
    lemon: function (ctx) {
      ellipse(ctx, 14, -30, 13, 6, -0.5); paint(ctx, '#86d65c', INK, 2.4);
      A.blob(ctx, [['e', 0, 4, 36, 28], ['e', -37, 5, 9, 6], ['e', 37, 3, 9, 6]], '#ffe14d');
      [[-18, -6], [4, -12], [20, 8], [-8, 16], [-24, 12], [12, 20]].forEach(function (p) { circle(ctx, p[0], p[1], 1.4); paint(ctx, 'rgba(230,180,20,.55)'); });
      shine(ctx, -16, -8, 8, 4.5);
    },
    tomato: function (ctx) {
      A.blob(ctx, [['e', -12, 8, 26, 30], ['e', 12, 8, 26, 30], ['e', 0, 12, 34, 30]], '#ff4f4f');
      ctx.beginPath();
      for (var i = 0; i < 10; i++) { var q = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 7 : 21; ctx.lineTo(Math.cos(q) * rr, -21 + Math.sin(q) * rr * 0.6); }
      ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, '#5fb453', INK, 2.4);
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(2, -34); }, 3, '#5fb453');
      shine(ctx, -20, -2, 7, 4.5);
    },
    mouse: function (ctx) {
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(26, 26); ctx.quadraticCurveTo(46, 32, 44, 14); ctx.quadraticCurveTo(42, 2, 48, -4); }, 3, '#ffb3c6');
      [-1, 1].forEach(function (s) { circle(ctx, s * 24, -24, 17); paint(ctx, '#b8bcc8', INK, 3); circle(ctx, s * 24, -24, 10); paint(ctx, '#ffc2da'); });
      ellipse(ctx, 0, 8, 34, 30); paint(ctx, '#b8bcc8', INK, 3.2);
      A.eyeDot(ctx, -12, 2, 4); A.eyeDot(ctx, 12, 2, 4);
      circle(ctx, 0, 14, 4.5); paint(ctx, '#ff7ea0', INK, 2);
      [-1, 1].forEach(function (s) { stroke(ctx, [s * 9, 17, s * 27, 13], 1.6); stroke(ctx, [s * 9, 20, s * 27, 23], 1.6); });
      A.smile(ctx, 0, 21, 4);
      A.blush(ctx, -21, 14, 4); A.blush(ctx, 21, 14, 4);
      shine(ctx, -16, -8, 6, 3.5);
    },
    panda: function (ctx) {
      [-1, 1].forEach(function (s) { circle(ctx, s * 28, -26, 13); paint(ctx, '#3a3a44', INK, 3); });
      circle(ctx, 0, 4, 38); paint(ctx, '#fff', INK, 3.2);
      [-1, 1].forEach(function (s) {
        ellipse(ctx, s * 14, -2, 10, 12, s * -0.5); paint(ctx, '#3a3a44');
        circle(ctx, s * 13, -2, 4.5); paint(ctx, '#fff'); circle(ctx, s * 13, -1.5, 2.6); paint(ctx, '#2e1d14');
      });
      ellipse(ctx, 0, 12, 6, 4); paint(ctx, '#3a3a44');
      A.smile(ctx, 0, 18, 5);
      A.blush(ctx, -25, 14, 5); A.blush(ctx, 25, 14, 5);
      shine(ctx, -22, -16, 6, 3.5);
    },
    giraffe: function (ctx) {
      var c = '#ffd46b', spot = '#d98d3a';
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-15, 50); ctx.lineTo(-10, -8); ctx.lineTo(12, -8); ctx.lineTo(17, 50); ctx.closePath(); paint(ctx, c, INK, 3);
      ctx.save(); ctx.beginPath(); ctx.moveTo(-15, 50); ctx.lineTo(-10, -8); ctx.lineTo(12, -8); ctx.lineTo(17, 50); ctx.closePath(); ctx.clip();
      [[-8, 8, 6, 5], [8, 18, 7, 5], [-6, 30, 7, 6], [10, 40, 6, 5], [2, 2, 4, 3]].forEach(function (p) { ellipse(ctx, p[0], p[1], p[2], p[3], 0.3); paint(ctx, spot); });
      ctx.restore();
      [-1, 1].forEach(function (s) {
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(s * 7 + 2, -34); ctx.lineTo(s * 9 + 2, -45); }, 4, c);
        circle(ctx, s * 9 + 2, -47, 4.5); paint(ctx, spot, INK, 2);
        ellipse(ctx, s * 22 + 2, -30, 10, 5, s * -0.4); paint(ctx, c, INK, 2.4);
      });
      ellipse(ctx, 2, -24, 19, 16); paint(ctx, c, INK, 3.2);
      ellipse(ctx, 2, -14, 15, 9); paint(ctx, '#ffe9b0', INK, 2.4);
      ellipse(ctx, -3, -14, 1.8, 2.2); paint(ctx, '#7a4a2a'); ellipse(ctx, 7, -14, 1.8, 2.2); paint(ctx, '#7a4a2a');
      A.eyeDot(ctx, -6, -27, 3.2); A.eyeDot(ctx, 10, -27, 3.2);
      A.blush(ctx, -12, -18, 3.2); A.blush(ctx, 16, -18, 3.2);
    },
    drum: function (ctx) {
      ctx.lineJoin = 'round';
      function side() { ctx.beginPath(); ctx.moveTo(-36, -16); ctx.bezierCurveTo(-46, 0, -46, 14, -36, 30); ctx.lineTo(36, 30); ctx.bezierCurveTo(46, 14, 46, 0, 36, -16); ctx.closePath(); }
      ellipse(ctx, 0, 30, 36, 10); paint(ctx, '#c0473f', INK, 3);
      side(); paint(ctx, '#ff6b6b', INK, 3.2);
      [-7, 23].forEach(function (y) { for (var i = 0; i < 5; i++) { circle(ctx, -28 + i * 14, y, 2.4); paint(ctx, '#ffd23d', INK, 1.4); } });
      ellipse(ctx, 0, -16, 36, 10); paint(ctx, '#fff1d6', INK, 3);
      circle(ctx, 0, -16, 4); paint(ctx, '#ff6b6b');
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-40, -42); ctx.lineTo(4, -18); ctx.moveTo(40, -42); ctx.lineTo(-4, -18); }, 5, '#d9a066');
      circle(ctx, -40, -42, 5); paint(ctx, '#ff6b6b', INK, 2.2); circle(ctx, 40, -42, 5); paint(ctx, '#4fb0f0', INK, 2.2);
    },
    book: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-48, -26); ctx.lineTo(0, -20); ctx.lineTo(48, -26); ctx.lineTo(48, 32); ctx.lineTo(0, 38); ctx.lineTo(-48, 32); ctx.closePath();
      paint(ctx, '#4fb0f0', INK, 3);
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(s * 20, -30, s * 44, -24); ctx.lineTo(s * 44, 28); ctx.quadraticCurveTo(s * 20, 22, 0, 34); ctx.closePath();
        paint(ctx, '#fffdf5', INK, 2.6);
      });
      circle(ctx, -24, -4, 9); paint(ctx, '#ffb347', INK, 2);
      ctx.beginPath(); ctx.moveTo(-40, 20); ctx.lineTo(-30, 8); ctx.lineTo(-22, 16); ctx.lineTo(-14, 6); ctx.lineTo(-6, 20); paint(ctx, null, '#6cc157', 2.6);
      [[-12], [-4], [4], [12]].forEach(function (r) { stroke(ctx, [10, r[0], 36, r[0] - 2], 2.4, 'rgba(90,56,37,.35)'); });
    },
    scissors: function (ctx) {
      ctx.lineJoin = 'round';
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s * -6, 8); ctx.lineTo(s * 22, -46); ctx.lineTo(s * 9, 0); ctx.closePath(); paint(ctx, '#e6ebf2', INK, 2.8);
      });
      [-1, 1].forEach(function (s) {
        tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(s * 12, 18); }, 7, s < 0 ? '#ff6b6b' : '#4fb0f0');
        circle(ctx, s * 18, 30, 12); paint(ctx, null, INK, 10); circle(ctx, s * 18, 30, 12); paint(ctx, null, s < 0 ? '#ff6b6b' : '#4fb0f0', 5);
      });
      circle(ctx, 0, 2, 4.5); paint(ctx, '#ffd23d', INK, 2);
    },
    ghost: function (ctx) {
      ctx.lineJoin = 'round';
      ellipse(ctx, -36, 8, 9, 6, -0.5); paint(ctx, '#f7f4ff', INK, 2.6);
      ellipse(ctx, 36, 2, 9, 6, 0.5); paint(ctx, '#f7f4ff', INK, 2.6);
      ctx.beginPath(); ctx.moveTo(-32, 34); ctx.lineTo(-32, -8); ctx.bezierCurveTo(-32, -48, 32, -48, 32, -8); ctx.lineTo(32, 34);
      for (var i = 0; i < 4; i++) { var x0 = 32 - i * 16; ctx.quadraticCurveTo(x0 - 8, 46, x0 - 16, 34); }
      ctx.closePath(); paint(ctx, '#f7f4ff', INK, 3.2);
      ellipse(ctx, -10, -10, 4.5, 6); paint(ctx, '#2e1d14'); ellipse(ctx, 10, -10, 4.5, 6); paint(ctx, '#2e1d14');
      circle(ctx, -11.5, -12, 1.6); paint(ctx, '#fff'); circle(ctx, 8.5, -12, 1.6); paint(ctx, '#fff');
      ellipse(ctx, 0, 6, 5, 6); paint(ctx, '#8a5aa8', INK, 2);
      A.blush(ctx, -18, 0, 4); A.blush(ctx, 18, 0, 4);
      shine(ctx, -18, -26, 6, 3.5);
    },
    plane: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-30, -2); ctx.lineTo(-44, -30); ctx.lineTo(-34, -30); ctx.lineTo(-16, -4); ctx.closePath(); paint(ctx, '#4fb0f0', INK, 2.6);
      ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-16, -36); ctx.lineTo(-4, -36); ctx.lineTo(18, -6); ctx.closePath(); paint(ctx, '#4fb0f0', INK, 2.8);
      ellipse(ctx, 0, 4, 46, 15); paint(ctx, '#fff', INK, 3.2);
      ctx.save(); ellipse(ctx, 0, 4, 45, 14); ctx.clip(); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(30, -12, 20, 32); ctx.fillRect(-50, 8, 100, 5); ctx.restore();
      ellipse(ctx, 0, 4, 46, 15); paint(ctx, null, INK, 3.2);
      [-20, -8, 4, 16].forEach(function (x) { circle(ctx, x, 0, 3.4); paint(ctx, '#c9ecff', INK, 1.8); });
      ctx.beginPath(); ctx.moveTo(-2, 12); ctx.lineTo(-18, 40); ctx.lineTo(-6, 40); ctx.lineTo(18, 14); ctx.closePath(); paint(ctx, '#6cc6ff', INK, 2.8);
      shine(ctx, -24, -2, 7, 2.5, 0);
    },
    lion: function (ctx) {
      for (var i = 0; i < 12; i++) { var q = i * TAU / 12; circle(ctx, Math.cos(q) * 30, 2 + Math.sin(q) * 30, 15); paint(ctx, '#e8892c', INK, 3); }
      circle(ctx, 0, 2, 33); paint(ctx, '#e8892c');
      [-1, 1].forEach(function (s) { circle(ctx, s * 18, -20, 8); paint(ctx, '#ffd46b', INK, 2.6); circle(ctx, s * 18, -20, 4); paint(ctx, '#f2a35a'); });
      circle(ctx, 0, 4, 25); paint(ctx, '#ffd46b', INK, 3);
      ellipse(ctx, 0, 14, 12, 8); paint(ctx, '#fff1d6', INK, 2);
      ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(5, 9); ctx.lineTo(0, 14); ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, '#7a4a2a', INK, 1.4);
      A.smile(ctx, -3, 17, 3); A.smile(ctx, 3, 17, 3);
      A.eyeDot(ctx, -9, -2, 3.6); A.eyeDot(ctx, 9, -2, 3.6);
      A.blush(ctx, -16, 10, 4); A.blush(ctx, 16, 10, 4);
    },
    penguin: function (ctx) {
      [-12, 12].forEach(function (x) { ellipse(ctx, x, 42, 10, 5); paint(ctx, '#ffa13d', INK, 2.4); });
      ellipse(ctx, -30, 8, 8, 20, 0.35); paint(ctx, '#3a4a66', INK, 2.8);
      ellipse(ctx, 30, 8, 8, 20, -0.35); paint(ctx, '#3a4a66', INK, 2.8);
      ellipse(ctx, 0, 4, 30, 40); paint(ctx, '#3a4a66', INK, 3.2);
      A.blob(ctx, [['e', 0, 14, 21, 28], ['e', -9, -12, 11, 12], ['e', 9, -12, 11, 12]], '#fff', 0.01);
      A.eyeDot(ctx, -9, -13, 3.6); A.eyeDot(ctx, 9, -13, 3.6);
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); ctx.lineTo(0, 4); ctx.closePath(); ctx.lineJoin = 'round'; paint(ctx, '#ffa13d', INK, 2);
      A.blush(ctx, -16, -2, 4); A.blush(ctx, 16, -2, 4);
      shine(ctx, -18, -24, 5, 3);
    },
    owl: function (ctx) {
      ctx.lineJoin = 'round';
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * 14, -30); ctx.lineTo(s * 30, -46); ctx.lineTo(s * 30, -22); ctx.closePath(); paint(ctx, '#9a6436', INK, 2.6); });
      ellipse(ctx, 0, 6, 33, 41); paint(ctx, '#b07845', INK, 3.2);
      ellipse(ctx, 0, 20, 21, 24); paint(ctx, '#f1d2ae', INK, 2.2);
      [[-8, 12], [8, 12], [0, 22], [-10, 30], [10, 30]].forEach(function (p) { stroke(ctx, [p[0] - 4, p[1], p[0], p[1] + 4, p[0] + 4, p[1]], 1.8, 'rgba(120,80,40,.6)'); });
      [-1, 1].forEach(function (s) {
        circle(ctx, s * 13, -12, 12); paint(ctx, '#fff', INK, 2.6);
        circle(ctx, s * 13, -11, 6.5); paint(ctx, '#2e1d14'); circle(ctx, s * 13 - 2, -13.5, 2.2); paint(ctx, '#fff');
        ellipse(ctx, s * 30, 12, 7, 18, s * -0.25); paint(ctx, '#9a6436', INK, 2.4);
      });
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-5, 1); ctx.lineTo(0, 8); ctx.lineTo(5, 1); ctx.closePath(); paint(ctx, '#ffa13d', INK, 1.8);
      [-10, 10].forEach(function (x) { stroke(ctx, [x - 4, 46, x, 42, x + 4, 46], 3, '#ffa13d'); });
    },
    acorn: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-26, -8); ctx.bezierCurveTo(-28, 28, -4, 42, 0, 46); ctx.bezierCurveTo(4, 42, 28, 28, 26, -8); ctx.closePath();
      paint(ctx, '#c8843c', INK, 3.2);
      A.eyeDot(ctx, -9, 12, 3.4); A.eyeDot(ctx, 9, 12, 3.4); A.smile(ctx, 0, 20, 4);
      A.blush(ctx, -15, 20, 3.5); A.blush(ctx, 15, 20, 3.5);
      shine(ctx, -16, 2, 4, 7, 0.2);
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(3, -42); }, 4, '#8a5a33');
      ctx.beginPath(); ctx.moveTo(-32, -4); ctx.bezierCurveTo(-32, -36, 32, -36, 32, -4); ctx.quadraticCurveTo(0, 5, -32, -4); ctx.closePath();
      paint(ctx, '#8a5a33', INK, 3);
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,230,190,.35)'; ctx.lineWidth = 1.6;
      for (var i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 12, -30); ctx.lineTo(i * 8 + 12, 2); ctx.moveTo(i * 8 + 12, -30); ctx.lineTo(i * 8 - 12, 2); ctx.stroke(); }
      ctx.restore();
    },
    carrot: function (ctx) {
      ctx.save(); ctx.rotate(-0.45);
      [[-9, -36, -0.5], [0, -42, 0], [9, -36, 0.5]].forEach(function (l) { ellipse(ctx, l[0], l[1], 6, 13, l[2]); paint(ctx, '#6cc157', INK, 2.4); });
      ctx.beginPath(); ctx.moveTo(-18, -24); ctx.quadraticCurveTo(-18, 4, -2, 46); ctx.lineTo(2, 46); ctx.quadraticCurveTo(18, 4, 18, -24); ctx.quadraticCurveTo(0, -31, -18, -24); ctx.closePath();
      ctx.lineJoin = 'round'; paint(ctx, '#ff8a2a', INK, 3.2);
      [[-12, -6, -4, -5], [4, 8, 12, 7], [-8, 20, -2, 21], [2, 32, 6, 31]].forEach(function (l) { stroke(ctx, l, 2, 'rgba(180,80,20,.55)'); });
      shine(ctx, -8, -12, 3.5, 7, 0.05);
      ctx.restore();
    },
    crown: function (ctx) {
      ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-40, 30); ctx.lineTo(-44, -22); ctx.lineTo(-20, 0); ctx.lineTo(0, -32); ctx.lineTo(20, 0); ctx.lineTo(44, -22); ctx.lineTo(40, 30); ctx.closePath();
      paint(ctx, '#ffd23d', INK, 3.2);
      roundRect(ctx, -42, 14, 84, 17, 6); paint(ctx, '#ffb12e', INK, 2.6);
      [[-24, '#ff6b6b'], [0, '#4fb0f0'], [24, '#6cc157']].forEach(function (j) { circle(ctx, j[0], 22.5, 5); paint(ctx, j[1], INK, 2); });
      [[-44, -24], [0, -35], [44, -24]].forEach(function (p) { circle(ctx, p[0], p[1], 5.5); paint(ctx, '#ff6b6b', INK, 2.2); });
      shine(ctx, -26, -2, 3.5, 7, 0.4);
    },
    snowman: function (ctx) {
      ctx.lineJoin = 'round';
      stroke(ctx, [-22, 12, -44, -2], 5, INK); stroke(ctx, [-22, 12, -44, -2], 2.4, '#8a5a33');
      stroke(ctx, [22, 12, 44, -2], 5, INK); stroke(ctx, [22, 12, 44, -2], 2.4, '#8a5a33');
      circle(ctx, 0, 24, 25); paint(ctx, '#fff', INK, 3.2);
      circle(ctx, 0, -14, 19); paint(ctx, '#fff', INK, 3.2);
      ctx.beginPath(); ctx.moveTo(-15, -30); ctx.lineTo(-11, -48); ctx.lineTo(11, -48); ctx.lineTo(15, -30); ctx.closePath(); paint(ctx, '#ff6b6b', INK, 2.8);
      A.eyeDot(ctx, -7, -17, 3); A.eyeDot(ctx, 7, -17, 3);
      ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(14, -9); ctx.lineTo(-1, -7); ctx.closePath(); paint(ctx, '#ff8a2a', INK, 1.8);
      A.blush(ctx, -12, -8, 3.5); A.blush(ctx, 12, -8, 3.5);
      roundRect(ctx, -19, 0, 38, 8, 4); paint(ctx, '#4fb0f0', INK, 2.4);
      roundRect(ctx, 6, 4, 8, 16, 3); paint(ctx, '#4fb0f0', INK, 2.2);
      [16, 30].forEach(function (y) { circle(ctx, 0, y, 2.8); paint(ctx, '#3a3a44'); });
    },
    beetle: function (ctx) {
      [-1, 1].forEach(function (s) { [[4, 18], [16, 24], [30, 20]].forEach(function (l) { stroke(ctx, [s * 18, l[0], s * 36, l[1], s * 42, l[1] + 8], 3.6, INK); }); });
      ellipse(ctx, 0, 16, 26, 30); paint(ctx, '#8a4a22', INK, 3.2);
      stroke(ctx, [0, -10, 0, 44], 2.2, INK);
      ellipse(ctx, -12, 8, 5, 10, 0.2); paint(ctx, 'rgba(255,255,255,.45)'); ellipse(ctx, 12, 8, 3, 6, -0.2); paint(ctx, 'rgba(255,255,255,.3)');
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(-2, -36, 4, -46); ctx.moveTo(1, -36); ctx.lineTo(10, -40); }, 4, '#5a3825');
      ellipse(ctx, 0, -16, 15, 10); paint(ctx, '#5a3825', INK, 3);
      circle(ctx, -9, -18, 2.6); paint(ctx, '#fff'); circle(ctx, 9, -18, 2.6); paint(ctx, '#fff');
    },
    corn: function (ctx) {
      ctx.save(); ctx.rotate(-0.35);
      ctx.lineJoin = 'round';
      ellipse(ctx, 0, -4, 18, 40); paint(ctx, '#ffd84d', INK, 3);
      ctx.save(); ellipse(ctx, 0, -4, 17, 39); ctx.clip();
      for (var r = -42; r < 40; r += 8) for (var c = -16; c <= 16; c += 8) { roundRect(ctx, c - 3.4 + ((r / 8) % 2 ? 4 : 0), r, 7, 6.5, 3); paint(ctx, '#ffe985', 'rgba(210,160,30,.6)', 1); }
      ctx.restore();
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(s * 4, 46); ctx.quadraticCurveTo(s * 30, 30, s * 22, -8); ctx.quadraticCurveTo(s * 14, 18, s * 2, 30); ctx.closePath();
        paint(ctx, s < 0 ? '#6cc157' : '#86d65c', INK, 2.6);
      });
      ctx.restore();
    },
    ladybug: function (ctx) {
      [-1, 1].forEach(function (s) { [0, 14, 28].forEach(function (y) { stroke(ctx, [s * 24, y, s * 42, y + 6], 3.6, INK); }); });
      tube(ctx, function () { ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-14, -46); ctx.moveTo(6, -34); ctx.lineTo(14, -46); }, 2, INK);
      circle(ctx, -14, -46, 3.4); paint(ctx, '#3a3a44'); circle(ctx, 14, -46, 3.4); paint(ctx, '#3a3a44');
      circle(ctx, 0, -26, 14); paint(ctx, '#3a3a44', INK, 3);
      circle(ctx, -5, -28, 3.2); paint(ctx, '#fff'); circle(ctx, 5, -28, 3.2); paint(ctx, '#fff');
      circle(ctx, -5, -27.5, 1.6); paint(ctx, '#2e1d14'); circle(ctx, 5, -27.5, 1.6); paint(ctx, '#2e1d14');
      circle(ctx, 0, 10, 33); paint(ctx, '#ff4f4f', INK, 3.2);
      stroke(ctx, [0, -22, 0, 42], 2.6, INK);
      [[-15, -4, 7], [15, -4, 7], [-19, 20, 6], [19, 20, 6], [-8, 32, 4.5], [8, 32, 4.5]].forEach(function (d) { circle(ctx, d[0], d[1], d[2]); paint(ctx, '#3a3a44'); });
      shine(ctx, -18, -10, 6, 3.5);
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
