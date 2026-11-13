// ============================================================================
// High-DPI Procedural Cartoon Q-Style Illustration & Sprite Atlas Baker
// Thick Warm-Plum Outlines (#1E132A) + Cel Gradients + Specular Highlights
// ============================================================================

const INK = '#1E132A';
const SPRITES = {
  heroes: {},
  enemies: {},
  bosses: {},
  props: {},
  projectiles: {},
  glows: {},
  icons: {},
  iconUrls: {},
  groundTile: null
};

function makeCanvas(w, h, scale = 2) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.logicalW = w;
  c.logicalH = h;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { c, ctx };
}

function makeWhiteFlash(sourceCanvas) {
  const c = document.createElement('canvas');
  c.width = sourceCanvas.width;
  c.height = sourceCanvas.height;
  c.logicalW = sourceCanvas.logicalW;
  c.logicalH = sourceCanvas.logicalH;
  const ctx = c.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillStroke(ctx, fill, lineWidth = 3.4, stroke = INK) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawCartoonEye(ctx, x, y, r = 3.6, angry = false, sleepy = false) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.88, r, 0, 0, TAU);
  ctx.fill();

  // Catchlights
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x - r * 0.26, y - r * 0.3, r * 0.36, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.25, y + r * 0.28, r * 0.16, 0, TAU);
  ctx.fill();

  if (sleepy) {
    // Dark circles under eye + half lid
    ctx.strokeStyle = '#6D4C94';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.5, r * 0.95, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#F7E7DA';
    ctx.beginPath();
    ctx.arc(x, y - r * 0.2, r * 0.95, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.15);
    ctx.lineTo(x + r, y - r * 0.15);
    ctx.stroke();
  } else if (angry) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - r * 1.05);
    ctx.lineTo(x + r * 1.0, y - r * 0.45);
    ctx.stroke();
  }
}

function drawBlush(ctx, lx, rx, y, rxSize = 4.2, rySize = 2.3, color = 'rgba(255,105,145,0.58)') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(lx, y, rxSize, rySize, 0, 0, TAU);
  ctx.ellipse(rx, y, rxSize, rySize, 0, 0, TAU);
  ctx.fill();
}

function drawAhoge(ctx, x, y, sway = 0, color = '#FFD84D') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-6, -13, 8, -21, 13, -11);
  ctx.bezierCurveTo(9, -8, 3, -9, 2, 0);
  ctx.closePath();
  fillStroke(ctx, color, 2.8);
  ctx.restore();
}

// ============================================================================
// 1. Pre-Bake Soft Radial Additive Glow Sprites
// ============================================================================
function bakeGlows() {
  const palette = {
    gold: ['rgba(255,230,95,0.95)', 'rgba(255,160,30,0.38)', 'rgba(255,120,0,0)'],
    cyan: ['rgba(130,255,255,0.95)', 'rgba(40,195,255,0.38)', 'rgba(0,130,255,0)'],
    magenta: ['rgba(255,120,235,0.95)', 'rgba(195,55,255,0.38)', 'rgba(120,0,255,0)'],
    lime: ['rgba(190,255,95,0.92)', 'rgba(95,225,50,0.34)', 'rgba(40,180,0,0)'],
    crimson: ['rgba(255,95,115,0.95)', 'rgba(255,35,75,0.38)', 'rgba(180,0,40,0)'],
    warm: ['rgba(255,220,145,0.82)', 'rgba(255,150,65,0.28)', 'rgba(255,110,30,0)'],
    white: ['rgba(255,255,255,0.95)', 'rgba(210,235,255,0.35)', 'rgba(255,255,255,0)']
  };

  for (const [key, stops] of Object.entries(palette)) {
    const { c, ctx } = makeCanvas(96, 96, 1);
    const g = ctx.createRadialGradient(48, 48, 2, 48, 48, 46);
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.42, stops[1]);
    g.addColorStop(1, stops[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 96);
    SPRITES.glows[key] = c;
  }
}

// ============================================================================
// 2. Seamless Hand-Painted Twilight Courtyard & Enchanted Meadow Ground Tile
// ============================================================================
function bakeGroundTile() {
  const S = 512;
  const { c, ctx } = makeCanvas(S, S, 1);

  // Rich twilight teal-indigo meadow base so warm/neon VFX pop with award-winning contrast
  const baseGrad = ctx.createLinearGradient(0, 0, S, S);
  baseGrad.addColorStop(0, '#243547');
  baseGrad.addColorStop(0.5, '#203040');
  baseGrad.addColorStop(1, '#243547');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, S, S);

  // Helper to draw seamlessly wrapped elements across 3x3 offsets
  const drawWrapped = (fn) => {
    for (let ox = -S; ox <= S; ox += S) {
      for (let oy = -S; oy <= S; oy += S) {
        ctx.save();
        ctx.translate(ox, oy);
        fn();
        ctx.restore();
      }
    }
  };

  // Soft mossy patches
  const mossSpots = [
    [90, 110, 88, 62, '#294050'],
    [340, 80, 95, 70, '#1D2B3B'],
    [230, 270, 115, 82, '#2A4252'],
    [430, 390, 96, 68, '#1C2938'],
    [110, 410, 84, 58, '#283F4F']
  ];
  drawWrapped(() => {
    for (const [x, y, rx, ry, col] of mossSpots) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.3, 0, TAU);
      ctx.fill();
    }
  });

  // Cute hand-drawn cobblestone clusters
  const stones = [
    [140, 160, 36, 24, 0.1], [178, 172, 26, 19, -0.2], [152, 192, 28, 18, 0.25],
    [390, 220, 38, 25, -0.1], [426, 236, 27, 20, 0.2],
    [70, 330, 34, 22, 0.15], [104, 342, 24, 17, -0.25],
    [295, 455, 40, 26, 0.05], [334, 466, 26, 18, -0.18]
  ];
  drawWrapped(() => {
    for (const [x, y, w, h, rot] of stones) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      roundRectPath(ctx, -w / 2, -h / 2, w, h, 9);
      fillStroke(ctx, '#314659', 2.2, '#182430');
      // Stone highlight
      ctx.fillStyle = 'rgba(180,220,255,0.10)';
      ctx.beginPath();
      ctx.ellipse(-w * 0.12, -h * 0.18, w * 0.28, h * 0.18, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  });

  // Subtle cartoon grass tufts & tiny starflowers
  const tufts = [
    [52, 64], [210, 52], [462, 128], [312, 184], [84, 245],
    [248, 335], [448, 315], [186, 442], [486, 474], [368, 95],
    [130, 88], [398, 368], [28, 460], [276, 232]
  ];
  drawWrapped(() => {
    for (let i = 0; i < tufts.length; i++) {
      const [x, y] = tufts[i];
      ctx.strokeStyle = i % 2 === 0 ? '#3B616E' : '#345563';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 6, y - 9, x - 9, y - 12);
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x, y - 11, x + 1, y - 15);
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 6, y - 9, x + 9, y - 11);
      ctx.stroke();

      if (i % 4 === 0) {
        ctx.fillStyle = i % 8 === 0 ? '#FFD86B' : '#7CE8FF';
        ctx.beginPath();
        ctx.arc(x + 9, y - 12, 2.5, 0, TAU);
        ctx.fill();
      }
    }
  });

  SPRITES.groundTile = c;
}

// ============================================================================
// 3. Bake 4 Playable Chibi Heroes (2 Walk Frames + Portrait)
// ============================================================================
function bakeHeroFrame(heroId, frame) {
  const { c, ctx } = makeCanvas(84, 88, 2);
  const cx = 42;
  const cy = 48;
  const step = frame === 0 ? -1 : 1;
  const bob = frame === 0 ? -1.5 : 1.5;

  ctx.save();
  ctx.translate(cx, cy + bob);

  if (heroId === 'knight') {
    // Flowing red hero cape
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.quadraticCurveTo(-26, 14 + step * 3, -20, 26);
    ctx.lineTo(16, 24);
    ctx.quadraticCurveTo(22, 10 - step * 2, 12, -4);
    ctx.closePath();
    fillStroke(ctx, '#FF4757', 3.4);

    // Stubby armored boots
    ctx.beginPath();
    ctx.ellipse(-8, 25 + step * 3, 6, 5, 0, 0, TAU);
    fillStroke(ctx, '#6E7F99', 3.2);
    ctx.beginPath();
    ctx.ellipse(8, 25 - step * 3, 6, 5, 0, 0, TAU);
    fillStroke(ctx, '#6E7F99', 3.2);

    // Chubby silver armor torso
    roundRectPath(ctx, -14, 2, 28, 22, 10);
    const bodyG = ctx.createLinearGradient(0, 2, 0, 24);
    bodyG.addColorStop(0, '#DCE7F5');
    bodyG.addColorStop(1, '#8FA2BF');
    fillStroke(ctx, bodyG, 3.4);

    // Gold belt buckle
    roundRectPath(ctx, -5, 13, 10, 6, 2);
    fillStroke(ctx, '#FFD84D', 2.4);

    // Big Q-head inside oversized tin-pot helmet
    ctx.beginPath();
    ctx.ellipse(0, -11, 20, 18, 0, 0, TAU);
    const helmG = ctx.createLinearGradient(-12, -29, 12, 7);
    helmG.addColorStop(0, '#EEF5FC');
    helmG.addColorStop(0.55, '#B2C4DE');
    helmG.addColorStop(1, '#7D90AD');
    fillStroke(ctx, helmG, 3.6);

    // Face opening
    roundRectPath(ctx, -14, -17, 28, 16, 8);
    fillStroke(ctx, '#FFE6D1', 3.0);

    drawBlush(ctx, -9.5, 9.5, -6.5);
    drawCartoonEye(ctx, -6.5, -10, 3.5);
    drawCartoonEye(ctx, 6.5, -10, 3.5);

    // Determined tiny mouth
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -5.5, 3, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Visor brow rim + Rivets
    roundRectPath(ctx, -17, -23, 34, 7, 3.5);
    fillStroke(ctx, '#D4E2F4', 3.0);

    // Bouncy Golden Ahoge sticking out of top!
    drawAhoge(ctx, 0, -28, step * 0.16, '#FFD84D');

    // Held Mini Salted Fish Sword on side
    ctx.save();
    ctx.translate(18, 8 + step * 2);
    ctx.rotate(-0.45 + step * 0.12);
    ctx.beginPath();
    ctx.ellipse(10, 0, 13, 5.5, 0, 0, TAU);
    fillStroke(ctx, '#7BE3F5', 3.0);
    // Fish tail
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(28, -6);
    ctx.lineTo(27, 0);
    ctx.lineTo(28, 6);
    ctx.closePath();
    fillStroke(ctx, '#FFD84D', 2.6);
    // Deadpan fish X eye
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -2); ctx.lineTo(7, 1);
    ctx.moveTo(7, -2); ctx.lineTo(4, 1);
    ctx.stroke();
    ctx.restore();

  } else if (heroId === 'witch') {
    // Starry purple cloak
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-19, 25);
    ctx.quadraticCurveTo(0, 30, 19, 25);
    ctx.lineTo(10, 0);
    ctx.closePath();
    const robeG = ctx.createLinearGradient(0, 0, 0, 28);
    robeG.addColorStop(0, '#8E54E9');
    robeG.addColorStop(1, '#4B278C');
    fillStroke(ctx, robeG, 3.4);

    // Little boots
    ctx.beginPath();
    ctx.ellipse(-7, 26 + step * 2.5, 5, 4, 0, 0, TAU);
    ctx.ellipse(7, 26 - step * 2.5, 5, 4, 0, 0, TAU);
    fillStroke(ctx, '#2F1B54', 3.0);

    // Cat tail peeking out
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-13, 19);
    ctx.quadraticCurveTo(-26, 14 + step * 4, -23, 4);
    ctx.stroke();
    ctx.strokeStyle = '#4B366B';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Cute Chibi Cat-Witch Head
    ctx.beginPath();
    ctx.ellipse(0, -9, 17, 15, 0, 0, TAU);
    fillStroke(ctx, '#FFF0E3', 3.4);

    // Side hair locks
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.quadraticCurveTo(-20, 0, -13, 5);
    ctx.lineTo(-10, -4);
    ctx.closePath();
    fillStroke(ctx, '#3D2A5E', 2.8);
    ctx.beginPath();
    ctx.moveTo(16, -12);
    ctx.quadraticCurveTo(20, 0, 13, 5);
    ctx.lineTo(10, -4);
    ctx.closePath();
    fillStroke(ctx, '#3D2A5E', 2.8);

    // Sleepy caffeinated dark-circle eyes!
    drawBlush(ctx, -9.5, 9.5, -5, 4, 2, 'rgba(255,130,180,0.48)');
    drawCartoonEye(ctx, -6.5, -9, 3.8, false, true);
    drawCartoonEye(ctx, 6.5, -9, 3.8, false, true);

    // Cat ':3' mouth
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-2.2, -3.8, 2.2, 0.1, Math.PI - 0.1);
    ctx.arc(2.2, -3.8, 2.2, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Oversized Witch Hat with Cat Ears & Star Buckle
    ctx.beginPath();
    ctx.ellipse(0, -19, 26, 7.5, -0.05, 0, TAU);
    fillStroke(ctx, '#6E38D6', 3.4);

    ctx.beginPath();
    ctx.moveTo(-15, -20);
    ctx.quadraticCurveTo(-4, -44, 15 + step * 2, -38);
    ctx.quadraticCurveTo(10, -27, 15, -20);
    ctx.closePath();
    fillStroke(ctx, '#7E47E8', 3.4);

    // Hat ribbon + gold star
    ctx.strokeStyle = '#FFD84D';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-13, -21);
    ctx.quadraticCurveTo(0, -18, 13, -21);
    ctx.stroke();
    drawAhoge(ctx, 13 + step * 2, -37, 0.4, '#63F5FF');

    // Floating Iced Americano Cup!
    ctx.save();
    ctx.translate(21, 5 - step * 2);
    roundRectPath(ctx, -6, -7, 12, 15, 2.5);
    fillStroke(ctx, '#6E3F24', 2.8);
    ctx.fillStyle = '#FFEAD2';
    ctx.fillRect(-4.5, -5.5, 9, 4);
    // Green straw
    ctx.strokeStyle = '#2EE6A6';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(1, -7);
    ctx.lineTo(4, -14);
    ctx.stroke();
    ctx.restore();

  } else if (heroId === 'goose') {
    // Orange webbed feet
    ctx.beginPath();
    ctx.ellipse(-8, 26 + step * 3.5, 7, 4.2, -0.15, 0, TAU);
    fillStroke(ctx, '#FF8C1A', 3.0);
    ctx.beginPath();
    ctx.ellipse(8, 26 - step * 3.5, 7, 4.2, 0.15, 0, TAU);
    fillStroke(ctx, '#FF8C1A', 3.0);

    // Plump white goose body
    ctx.beginPath();
    ctx.ellipse(0, 12, 17, 15, 0, 0, TAU);
    const gBody = ctx.createLinearGradient(0, -3, 0, 27);
    gBody.addColorStop(0, '#FFFFFF');
    gBody.addColorStop(1, '#DCE6F2');
    fillStroke(ctx, gBody, 3.5);

    // Red Chef Neckerchief
    ctx.beginPath();
    ctx.moveTo(-13, 2);
    ctx.quadraticCurveTo(0, 10, 13, 2);
    ctx.lineTo(5, 13);
    ctx.lineTo(0, 9);
    ctx.lineTo(-5, 13);
    ctx.closePath();
    fillStroke(ctx, '#FF3B4E', 2.8);

    // Flapping muscular wing + Iron Wok
    ctx.beginPath();
    ctx.ellipse(-16, 10 - step * 2, 6, 10, 0.35, 0, TAU);
    fillStroke(ctx, '#FFFFFF', 3.2);

    ctx.save();
    ctx.translate(19, 9 + step * 2);
    ctx.beginPath();
    ctx.arc(4, 0, 10, 0, TAU);
    fillStroke(ctx, '#3A3F4D', 3.2);
    ctx.beginPath();
    ctx.arc(4, 0, 6.5, 0, TAU);
    ctx.fillStyle = '#535B6E';
    ctx.fill();
    ctx.restore();

    // Goose Neck & Head
    roundRectPath(ctx, -12, -21, 24, 26, 12);
    fillStroke(ctx, '#FFFFFF', 3.5);

    // Angry Chaotic Goose Eyes!
    drawCartoonEye(ctx, -6, -11, 3.4, true, false);
    drawCartoonEye(ctx, 6, -11, 3.4, true, false);

    // Bright Orange Duck/Goose Bill
    ctx.beginPath();
    ctx.ellipse(0, -4.5, 9.5, 4.8, 0, 0, TAU);
    fillStroke(ctx, '#FF9F1C', 3.0);

    // Tall Puffy Chef Toque Hat + Feather Ahoge
    roundRectPath(ctx, -11, -28, 22, 8, 3);
    fillStroke(ctx, '#F2F6FA', 3.0);
    ctx.beginPath();
    ctx.arc(-7, -31, 7, 0, TAU);
    ctx.arc(0, -34, 8, 0, TAU);
    ctx.arc(7, -31, 7, 0, TAU);
    fillStroke(ctx, '#FFFFFF', 3.2);
    drawAhoge(ctx, 0, -40, step * 0.18, '#FF9F1C');

  } else if (heroId === 'shiba') {
    // Floating RGB Cyber Roomba underneath!
    ctx.beginPath();
    ctx.ellipse(0, 24, 24, 8.5, 0, 0, TAU);
    fillStroke(ctx, '#2B3040', 3.4);
    ctx.strokeStyle = frame === 0 ? '#00F5D4' : '#FF4DFF';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(0, 23.5, 19, 5.2, 0, 0, TAU);
    ctx.stroke();

    // Yellow Taoist Robe
    roundRectPath(ctx, -14, 2, 28, 20, 9);
    fillStroke(ctx, '#FFD43B', 3.4);
    // Yin-yang / Bagua badge on chest
    ctx.beginPath();
    ctx.arc(0, 12, 5, 0, TAU);
    fillStroke(ctx, '#2EE6A6', 2.4);

    // Shiba Inu Pointy Ears
    ctx.beginPath();
    ctx.moveTo(-16, -16);
    ctx.lineTo(-19, -32);
    ctx.lineTo(-6, -23);
    ctx.closePath();
    fillStroke(ctx, '#F39C38', 3.2);

    ctx.beginPath();
    ctx.moveTo(16, -16);
    ctx.lineTo(19, -32);
    ctx.lineTo(6, -23);
    ctx.closePath();
    fillStroke(ctx, '#F39C38', 3.2);

    // Chubby Shiba Head
    ctx.beginPath();
    ctx.ellipse(0, -10, 18.5, 16, 0, 0, TAU);
    fillStroke(ctx, '#F7A440', 3.5);

    // White Shiba Cheeks & Muzzle
    ctx.beginPath();
    ctx.ellipse(-9, -5, 8, 7, 0, 0, TAU);
    ctx.ellipse(9, -5, 8, 7, 0, 0, TAU);
    ctx.ellipse(0, -4, 9, 7.5, 0, 0, TAU);
    ctx.fillStyle = '#FFF6E8';
    ctx.fill();

    // White Shiba Eyebrow Beans
    ctx.fillStyle = '#FFF6E8';
    ctx.beginPath();
    ctx.ellipse(-6.5, -17, 3, 1.8, -0.2, 0, TAU);
    ctx.ellipse(6.5, -17, 3, 1.8, 0.2, 0, TAU);
    ctx.fill();

    // Cool Cyber Deal-With-It Sunglasses!
    roundRectPath(ctx, -15, -15, 13, 7.5, 2.2);
    fillStroke(ctx, '#191D2B', 2.6);
    roundRectPath(ctx, 2, -15, 13, 7.5, 2.2);
    fillStroke(ctx, '#191D2B', 2.6);
    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -13); ctx.lineTo(-7, -9.5);
    ctx.moveTo(5, -13); ctx.lineTo(10, -9.5);
    ctx.stroke();

    // Cute Nose & Smirk
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, -6.2, 3.0, 2.1, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(4, -1.5, 7, -4.5);
    ctx.stroke();

    // Taoist Hat + Cyber Antenna Ahoge
    roundRectPath(ctx, -8, -29, 16, 8, 3);
    fillStroke(ctx, '#2C2240', 2.8);
    drawAhoge(ctx, 0, -29, step * 0.2, '#00F5D4');
  }

  ctx.restore();
  return c;
}

function bakeHeroes() {
  for (const h of HEROES) {
    const f0 = bakeHeroFrame(h.id, 0);
    const f1 = bakeHeroFrame(h.id, 1);
    const flash = makeWhiteFlash(f0);
    SPRITES.heroes[h.id] = {
      frames: [f0, f1],
      flash,
      portraitUrl: f0.toDataURL()
    };
  }
}

// ============================================================================
// 4. Bake 10 Hilarious Cartoon Monster Types (2 Frames + White Flash)
// ============================================================================
function bakeEnemyFrame(typeId, frame) {
  const { c, ctx } = makeCanvas(68, 68, 2);
  const cx = 34;
  const cy = 36;
  const s = frame === 0 ? -1 : 1;

  ctx.save();
  ctx.translate(cx, cy);

  switch (typeId) {
    case 'slime': { // Sour Lemon Slime
      const sx = frame === 0 ? 1.08 : 0.94;
      const sy = frame === 0 ? 0.92 : 1.07;
      ctx.scale(sx, sy);
      ctx.beginPath();
      ctx.moveTo(-19, 8);
      ctx.bezierCurveTo(-21, -14, -10, -20, 0, -20);
      ctx.bezierCurveTo(10, -20, 21, -14, 19, 8);
      ctx.bezierCurveTo(19, 17, -19, 17, -19, 8);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -20, 0, 16);
      g.addColorStop(0, '#EAFF66');
      g.addColorStop(1, '#99DB27');
      fillStroke(ctx, g, 3.4);

      // Gloss drop + green leaf on head
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(-8, -10, 4.5, 2.5, -0.5, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(3, -22, 6.5, 3.5, -0.4 + s * 0.15, 0, TAU);
      fillStroke(ctx, '#47CF57', 2.5);

      // Puckered sour '>w<' eyes!
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-10, -4); ctx.lineTo(-5, -1); ctx.lineTo(-10, 2);
      ctx.moveTo(10, -4); ctx.lineTo(5, -1); ctx.lineTo(10, 2);
      ctx.moveTo(-4, 4); ctx.quadraticCurveTo(0, 1, 4, 4);
      ctx.stroke();
      drawBlush(ctx, -11, 11, 4, 3.5, 2);
      break;
    }

    case 'bat': { // Express Delivery Bat in Yellow Helmet
      const wingY = frame === 0 ? -12 : 7;
      // Purple bat wings
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.quadraticCurveTo(-25, wingY - 8, -28, wingY + 5);
      ctx.quadraticCurveTo(-19, wingY + 3, -12, 6);
      ctx.closePath();
      fillStroke(ctx, '#8A4FFF', 3.0);

      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.quadraticCurveTo(25, wingY - 8, 28, wingY + 5);
      ctx.quadraticCurveTo(19, wingY + 3, 12, 6);
      ctx.closePath();
      fillStroke(ctx, '#8A4FFF', 3.0);

      // Chubby body
      ctx.beginPath();
      ctx.arc(0, 1, 13, 0, TAU);
      fillStroke(ctx, '#A56EFF', 3.3);

      // Yellow Delivery Helmet!
      ctx.beginPath();
      ctx.arc(0, -4, 13.5, Math.PI, TAU);
      ctx.closePath();
      fillStroke(ctx, '#FFD426', 3.2);
      roundRectPath(ctx, -15, -6, 30, 4, 2);
      fillStroke(ctx, '#FFAB1A', 2.5);

      drawCartoonEye(ctx, -5, 1, 3.0, true);
      drawCartoonEye(ctx, 5, 1, 3.0, true);
      // Tiny white fang
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-3, 6); ctx.lineTo(-1, 10); ctx.lineTo(1, 6);
      ctx.fill();
      break;
    }

    case 'broccoli': { // Buff Angry Broccoli Boxer
      // Stalk torso
      roundRectPath(ctx, -11, 0, 22, 19, 7);
      fillStroke(ctx, '#A9E876', 3.3);

      // Fluffy green broccoli crown
      const puffs = [[-13, -6, 10], [13, -6, 10], [-7, -15, 11], [7, -15, 11], [0, -10, 12]];
      ctx.fillStyle = '#2CC95D';
      for (const [px, py, pr] of puffs) {
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, TAU);
        fillStroke(ctx, '#2CC95D', 3.2);
      }
      ctx.beginPath();
      ctx.arc(0, -9, 13, 0, TAU);
      ctx.fillStyle = '#38DE6C';
      ctx.fill();

      drawCartoonEye(ctx, -5.5, 4, 3.1, true);
      drawCartoonEye(ctx, 5.5, 4, 3.1, true);

      // Red Boxing Gloves!
      ctx.beginPath();
      ctx.arc(-17, 8 + s * 3, 6.8, 0, TAU);
      fillStroke(ctx, '#FF4757', 3.0);
      ctx.beginPath();
      ctx.arc(17, 8 - s * 3, 6.8, 0, TAU);
      fillStroke(ctx, '#FF4757', 3.0);
      break;
    }

    case 'ghost': { // Overtime Ghost with Crooked Red Tie
      ctx.beginPath();
      ctx.moveTo(-16, 14);
      ctx.quadraticCurveTo(-18, -18, 0, -19);
      ctx.quadraticCurveTo(18, -18, 16, 14);
      ctx.lineTo(10, 9 + s * 2);
      ctx.lineTo(4, 15 - s * 2);
      ctx.lineTo(-3, 9 + s * 2);
      ctx.lineTo(-10, 15 - s * 2);
      ctx.closePath();
      const gg = ctx.createLinearGradient(0, -19, 0, 16);
      gg.addColorStop(0, '#E8FFFF');
      gg.addColorStop(1, '#9CECFB');
      fillStroke(ctx, gg, 3.2);

      drawCartoonEye(ctx, -5.5, -4, 3.4, false, true);
      drawCartoonEye(ctx, 5.5, -4, 3.4, false, true);

      // Red salaryman necktie!
      ctx.beginPath();
      ctx.moveTo(-2, 4);
      ctx.lineTo(2, 4);
      ctx.lineTo(4 + s, 13);
      ctx.lineTo(0 + s, 16);
      ctx.lineTo(-4 + s, 13);
      ctx.closePath();
      fillStroke(ctx, '#FF4757', 2.4);
      break;
    }

    case 'shroom': { // Polka-Dot Shy Spore Mushroom
      // Chubby cream stem
      roundRectPath(ctx, -10, -1, 20, 20, 8);
      fillStroke(ctx, '#FFF2DC', 3.2);

      // Big crimson mushroom cap
      ctx.beginPath();
      ctx.moveTo(-22, 1);
      ctx.bezierCurveTo(-24, -22, 24, -22, 22, 1);
      ctx.quadraticCurveTo(0, 6, -22, 1);
      ctx.closePath();
      fillStroke(ctx, '#FF496C', 3.4);

      // White polka dots
      ctx.fillStyle = '#FFFFFF';
      [[-10, -9, 4], [9, -11, 4.5], [0, -15, 3.2]].forEach(([dx, dy, dr]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, TAU);
        ctx.fill();
      });

      drawBlush(ctx, -7, 7, 10, 3.2, 1.8);
      drawCartoonEye(ctx, -4.5, 6.5, 2.8);
      drawCartoonEye(ctx, 4.5, 6.5, 2.8);
      break;
    }

    case 'egg_knight': { // Armored Salted-Duck-Egg Grunt
      // Egg body
      ctx.beginPath();
      ctx.ellipse(0, 2, 17, 21, 0, 0, TAU);
      fillStroke(ctx, '#FFF4DF', 3.5);

      // Iron bucket helmet top
      ctx.beginPath();
      ctx.ellipse(0, -7, 18, 13, 0, Math.PI, TAU);
      ctx.closePath();
      fillStroke(ctx, '#7F8FA6', 3.4);
      roundRectPath(ctx, -19, -9, 38, 5, 2.5);
      fillStroke(ctx, '#9AA9C2', 2.8);

      // Crack line on shell
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-8, 12); ctx.lineTo(-3, 8); ctx.lineTo(1, 13); ctx.lineTo(6, 9);
      ctx.stroke();

      drawCartoonEye(ctx, -5.5, 0, 3.1, true);
      drawCartoonEye(ctx, 5.5, 0, 3.1, true);

      // Mini wooden shield
      ctx.beginPath();
      ctx.arc(-16, 6 + s * 2, 8.5, 0, TAU);
      fillStroke(ctx, '#D9822B', 3.0);
      break;
    }

    case 'puffer': { // Spiky Puff-Bomb Fugu
      const r = frame === 0 ? 17 : 18.8;
      // Spikes around circle
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + frame * 0.15;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.2) * (r - 2), Math.sin(a - 0.2) * (r - 2));
        ctx.lineTo(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7));
        ctx.lineTo(Math.cos(a + 0.2) * (r - 2), Math.sin(a + 0.2) * (r - 2));
        ctx.closePath();
        fillStroke(ctx, '#FF793F', 2.6);
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      const pg = ctx.createRadialGradient(-4, -5, 3, 0, 0, r);
      pg.addColorStop(0, '#FFE47A');
      pg.addColorStop(1, '#FF9F2E');
      fillStroke(ctx, pg, 3.4);

      // Cream belly arc
      ctx.beginPath();
      ctx.arc(0, 4, r * 0.72, 0.15, Math.PI - 0.15);
      ctx.fillStyle = '#FFF7D6';
      ctx.fill();

      drawCartoonEye(ctx, -6.5, -3, 3.5, true);
      drawCartoonEye(ctx, 6.5, -3, 3.5, true);
      // Puffed 'O' lips
      ctx.beginPath();
      ctx.arc(0, 4, 3.5, 0, TAU);
      fillStroke(ctx, '#FF5252', 2.4);
      break;
    }

    case 'octo_mage': { // Boba-Sipping Pink Octopus Mage
      // Curled tentacles
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 6.5, 15 + ((i + frame) % 2) * 2.5, 4.8, 6.5, i * 0.15, 0, TAU);
        fillStroke(ctx, '#FF6BB5', 2.8);
      }
      // Round pink octopus head
      ctx.beginPath();
      ctx.ellipse(0, -1, 17.5, 16, 0, 0, TAU);
      fillStroke(ctx, '#FF85C8', 3.4);

      // Tiny Purple Wizard Hat
      ctx.beginPath();
      ctx.moveTo(-12, -13);
      ctx.lineTo(2, -28);
      ctx.lineTo(12, -13);
      ctx.closePath();
      fillStroke(ctx, '#6C3CE9', 2.8);

      drawCartoonEye(ctx, -6, -1, 3.3);
      drawCartoonEye(ctx, 6, -1, 3.3);
      // Octopus nozzle mouth
      ctx.beginPath();
      ctx.arc(0, 5.5, 3.6, 0, TAU);
      fillStroke(ctx, '#FF4785', 2.5);
      break;
    }

    case 'clock_knight': { // Wind-Up Clockwork Hustler Knight
      // Golden Wind-up Key on top/back!
      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(s * 0.25);
      ctx.beginPath();
      ctx.arc(-5, -4, 4.5, 0, TAU);
      ctx.arc(5, -4, 4.5, 0, TAU);
      fillStroke(ctx, '#FFD84D', 2.6);
      ctx.restore();

      // Chunky Cobalt Armor
      roundRectPath(ctx, -17, -15, 34, 34, 10);
      const cg = ctx.createLinearGradient(0, -15, 0, 19);
      cg.addColorStop(0, '#70C4FF');
      cg.addColorStop(1, '#3676C4');
      fillStroke(ctx, cg, 3.6);

      // Glowing Red Visor Slit
      roundRectPath(ctx, -12, -6, 24, 8, 4);
      fillStroke(ctx, '#1A1E2E', 2.6);
      ctx.fillStyle = '#FF3860';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.6, 0, TAU);
      ctx.arc(5, -2, 2.6, 0, TAU);
      ctx.fill();

      // Lance tip
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(29, 0);
      ctx.lineTo(16, 12);
      ctx.closePath();
      fillStroke(ctx, '#FFD84D', 2.8);
      break;
    }

    case 'mimic_pig': { // Golden Jackpot Piggy Bank with Sunglasses!
      // Ears & Trotters
      ctx.beginPath();
      ctx.ellipse(-9, 17 + s * 2, 4.5, 4, 0, 0, TAU);
      ctx.ellipse(9, 17 - s * 2, 4.5, 4, 0, 0, TAU);
      fillStroke(ctx, '#F5A623', 2.8);

      ctx.beginPath();
      ctx.ellipse(0, 1, 19, 16, 0, 0, TAU);
      const goldG = ctx.createRadialGradient(-6, -6, 2, 0, 1, 20);
      goldG.addColorStop(0, '#FFF59D');
      goldG.addColorStop(0.55, '#FFD524');
      goldG.addColorStop(1, '#EA9615');
      fillStroke(ctx, goldG, 3.5);

      // Coin slot on back with protruding gold coin!
      roundRectPath(ctx, -7, -14, 14, 3.5, 1.5);
      fillStroke(ctx, INK, 1);
      ctx.beginPath();
      ctx.arc(0, -17 + s, 5.5, 0, TAU);
      fillStroke(ctx, '#FFF066', 2.4);

      // Pig snout
      ctx.beginPath();
      ctx.ellipse(0, 4, 7.5, 5.2, 0, 0, TAU);
      fillStroke(ctx, '#FFBE3D', 2.8);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-2.5, 4, 1.4, 0, TAU);
      ctx.arc(2.5, 4, 1.4, 0, TAU);
      ctx.fill();

      // Cool shades
      roundRectPath(ctx, -13, -6, 11, 6, 2);
      roundRectPath(ctx, 2, -6, 11, 6, 2);
      fillStroke(ctx, '#1E132A', 2.2);
      break;
    }
  }

  ctx.restore();
  return c;
}

function bakeEnemies() {
  for (const id of Object.keys(ENEMY_TYPES)) {
    const f0 = bakeEnemyFrame(id, 0);
    const f1 = bakeEnemyFrame(id, 1);
    SPRITES.enemies[id] = {
      frames: [f0, f1],
      flash: makeWhiteFlash(f0)
    };
  }
}

// ============================================================================
// 5. Bake 4 Colossal Multi-Phase Stage Bosses (164x164 Retina Art!)
// ============================================================================
function bakeBossFrame(bossId, frame) {
  const { c, ctx } = makeCanvas(156, 156, 2);
  const cx = 78;
  const cy = 84;
  const s = frame === 0 ? -1 : 1;

  ctx.save();
  ctx.translate(cx, cy);

  if (bossId === 'boss_jelly') {
    // Royal Red Cape
    ctx.beginPath();
    ctx.moveTo(-36, -15);
    ctx.quadraticCurveTo(-60, 28, -48, 46);
    ctx.lineTo(48, 46);
    ctx.quadraticCurveTo(60, 28, 36, -15);
    ctx.closePath();
    fillStroke(ctx, '#E63946', 4.2);

    // Colossal Royal Jelly Body
    ctx.scale(frame === 0 ? 1.05 : 0.96, frame === 0 ? 0.96 : 1.05);
    ctx.beginPath();
    ctx.moveTo(-48, 26);
    ctx.bezierCurveTo(-54, -26, -28, -42, 0, -42);
    ctx.bezierCurveTo(28, -42, 54, -26, 48, 26);
    ctx.bezierCurveTo(46, 46, -46, 46, -48, 26);
    ctx.closePath();
    const jg = ctx.createRadialGradient(-14, -16, 8, 0, 5, 56);
    jg.addColorStop(0, '#D4FF70');
    jg.addColorStop(0.6, '#62E843');
    jg.addColorStop(1, '#26A637');
    fillStroke(ctx, jg, 4.5);

    // Glossy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-22, -20, 12, 6, -0.45, 0, TAU);
    ctx.fill();

    // Golden Crown with Ruby!
    ctx.beginPath();
    ctx.moveTo(-22, -40);
    ctx.lineTo(-26, -64);
    ctx.lineTo(-10, -52);
    ctx.lineTo(0, -68);
    ctx.lineTo(10, -52);
    ctx.lineTo(26, -64);
    ctx.lineTo(22, -40);
    ctx.closePath();
    fillStroke(ctx, '#FFD83B', 4.0);
    ctx.beginPath();
    ctx.arc(0, -49, 5.5, 0, TAU);
    fillStroke(ctx, '#FF2E63', 2.5);

    // Royal Angry Eyes + Curly White Mustache!
    drawCartoonEye(ctx, -16, -4, 6.2, true);
    drawCartoonEye(ctx, 16, -4, 6.2, true);

    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-12, 2, -24, 18, -30, 10);
    ctx.bezierCurveTo(-22, 24, -8, 19, 0, 14);
    ctx.bezierCurveTo(8, 19, 22, 24, 30, 10);
    ctx.bezierCurveTo(24, 18, 12, 2, 0, 10);
    fillStroke(ctx, '#FFFFFF', 3.0);

  } else if (bossId === 'boss_ppt') {
    // Demonic Monitor / Alarm-Clock Golem
    // Twin Brass Alarm Bells on top!
    ctx.beginPath();
    ctx.arc(-32, -48 + s * 2, 15, Math.PI * 0.8, TAU * 0.95);
    fillStroke(ctx, '#FFD43B', 3.8);
    ctx.beginPath();
    ctx.arc(32, -48 - s * 2, 15, Math.PI * 1.05, TAU * 1.1);
    fillStroke(ctx, '#FFD43B', 3.8);

    // Giant CRT / Projector Chassis
    roundRectPath(ctx, -48, -38, 96, 76, 16);
    fillStroke(ctx, '#3A3252', 4.5);

    // Glowing Red PPT Screen
    roundRectPath(ctx, -39, -29, 78, 58, 10);
    const sg = ctx.createLinearGradient(0, -29, 0, 29);
    sg.addColorStop(0, '#FF3355');
    sg.addColorStop(1, '#9E1233');
    fillStroke(ctx, sg, 3.6);

    // Evil Glowing Eyes & Jagged Grin + Pie Chart
    ctx.fillStyle = '#FFF266';
    ctx.beginPath();
    ctx.moveTo(-26, -14); ctx.lineTo(-8, -6); ctx.lineTo(-24, -2); ctx.closePath();
    ctx.moveTo(26, -14); ctx.lineTo(8, -6); ctx.lineTo(24, -2); ctx.closePath();
    ctx.fill();

    // Jagged mouth
    ctx.beginPath();
    ctx.moveTo(-26, 12);
    ctx.lineTo(-14, 19); ctx.lineTo(-6, 11); ctx.lineTo(0, 19);
    ctx.lineTo(6, 11); ctx.lineTo(14, 19); ctx.lineTo(26, 12);
    ctx.strokeStyle = '#FFF266';
    ctx.lineWidth = 3.8;
    ctx.stroke();

    // Floating claw hands
    ctx.beginPath();
    ctx.arc(-58, 8 + s * 4, 11, 0, TAU);
    ctx.arc(58, 8 - s * 4, 11, 0, TAU);
    fillStroke(ctx, '#FF5263', 3.6);

  } else if (bossId === 'boss_pie') {
    // Colossal Stargazy Pie Octopus Titan!
    // Writhing Purple Tentacles underneath
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 14, 34 + ((i + frame) % 2) * 5, 9, 15, i * 0.14, 0, TAU);
      fillStroke(ctx, '#9B51E0', 3.6);
    }

    // Golden Fluted Tart Tin & Baked Pie Crust
    ctx.beginPath();
    ctx.ellipse(0, 8, 54, 36, 0, 0, TAU);
    const pg = ctx.createRadialGradient(-10, -8, 6, 0, 8, 54);
    pg.addColorStop(0, '#FFE082');
    pg.addColorStop(0.7, '#E69A28');
    pg.addColorStop(1, '#A86214');
    fillStroke(ctx, pg, 4.4);

    // Comical Salted Fish Heads poking out of the pie crust staring at the sky!
    const fishes = [[-28, -22, -0.45], [0, -30, 0], [28, -22, 0.45]];
    for (const [fx, fy, rot] of fishes) {
      ctx.save();
      ctx.translate(fx, fy + s * 1.5);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 15, 0, 0, TAU);
      fillStroke(ctx, '#7BE3F5', 3.2);
      drawCartoonEye(ctx, -3, -5, 2.5);
      drawCartoonEye(ctx, 4, -5, 2.5);
      ctx.restore();
    }

    // Giant Menacing Boss Eyes on the crust
    drawCartoonEye(ctx, -18, 8, 6.5, true);
    drawCartoonEye(ctx, 18, 8, 6.5, true);

  } else if (bossId === 'boss_monday') {
    // Arch-Demon MONDAY: Cosmic Cape + Demon Horns + Suit + Calendar Scythe!
    // Cosmic Winged Cape
    ctx.beginPath();
    ctx.moveTo(-30, -18);
    ctx.lineTo(-64, 12 + s * 4);
    ctx.lineTo(-46, 48);
    ctx.lineTo(46, 48);
    ctx.lineTo(64, 12 - s * 4);
    ctx.lineTo(30, -18);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, -20, 0, 50);
    cg.addColorStop(0, '#7B2CBF');
    cg.addColorStop(1, '#240046');
    fillStroke(ctx, cg, 4.4);

    // Sharp Corporate Suit Torso + Red Tie
    roundRectPath(ctx, -28, 4, 56, 42, 12);
    fillStroke(ctx, '#2B2D42', 4.0);
    ctx.beginPath();
    ctx.moveTo(-5, 6); ctx.lineTo(5, 6); ctx.lineTo(7, 34); ctx.lineTo(0, 41); ctx.lineTo(-7, 34);
    ctx.closePath();
    fillStroke(ctx, '#FF2A6D', 2.8);

    // Blazing Curved Demon Horns
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.quadraticCurveTo(-48, -46, -38, -68);
    ctx.quadraticCurveTo(-22, -52, -12, -34);
    ctx.closePath();
    fillStroke(ctx, '#FFD84D', 4.0);

    ctx.beginPath();
    ctx.moveTo(24, -28);
    ctx.quadraticCurveTo(48, -46, 38, -68);
    ctx.quadraticCurveTo(22, -52, 12, -34);
    ctx.closePath();
    fillStroke(ctx, '#FFD84D', 4.0);

    // Demon Lord Chibi Head
    ctx.beginPath();
    ctx.ellipse(0, -16, 32, 27, 0, 0, TAU);
    fillStroke(ctx, '#FF4D79', 4.4);

    // Glowing Golden Demon Eyes + Third Eye
    drawCartoonEye(ctx, -13, -15, 5.8, true);
    drawCartoonEye(ctx, 13, -15, 5.8, true);
    ctx.beginPath();
    ctx.ellipse(0, -29, 4, 6.5, 0, 0, TAU);
    fillStroke(ctx, '#FFE600', 2.5);

    // Wicked Fang Grin
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0.15, Math.PI - 0.15);
    fillStroke(ctx, '#3B0918', 3.0);

    // Giant MONDAY Scythe on Right!
    ctx.save();
    ctx.translate(44, 0 + s * 3);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(6, 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(-36, -48, -46, -18);
    ctx.quadraticCurveTo(-22, -26, 2, -26);
    ctx.closePath();
    fillStroke(ctx, '#00F5D4', 3.6);
    ctx.restore();
  }

  ctx.restore();
  return c;
}

function bakeBosses() {
  for (const b of BOSSES) {
    const f0 = bakeBossFrame(b.id, 0);
    const f1 = bakeBossFrame(b.id, 1);
    SPRITES.bosses[b.id] = {
      frames: [f0, f1],
      flash: makeWhiteFlash(f0)
    };
  }
}

// ============================================================================
// 6. Bake Interactive Map Props, Pickups, Chests & Custom Weapon/Relic Icons
// ============================================================================
function bakeProps() {
  // Loot Barrel / Pot
  {
    const { c, ctx } = makeCanvas(52, 56, 2);
    ctx.translate(26, 30);
    roundRectPath(ctx, -16, -18, 32, 34, 9);
    fillStroke(ctx, '#C97A3D', 3.4);
    roundRectPath(ctx, -17, -10, 34, 5, 2);
    fillStroke(ctx, '#6E7F99', 2.6);
    roundRectPath(ctx, -17, 5, 34, 5, 2);
    fillStroke(ctx, '#6E7F99', 2.6);
    ctx.fillStyle = '#FFD84D';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('福', 0, 2);
    SPRITES.props.barrel = c;
    SPRITES.props.barrelFlash = makeWhiteFlash(c);
  }

  // Treasure Chest
  {
    const { c, ctx } = makeCanvas(64, 60, 2);
    ctx.translate(32, 32);
    roundRectPath(ctx, -22, -16, 44, 32, 7);
    fillStroke(ctx, '#D9483B', 3.8);
    roundRectPath(ctx, -23, -17, 46, 13, 6);
    fillStroke(ctx, '#FF6348', 3.6);
    // Gold trim & lock
    ctx.strokeStyle = '#FFD84D';
    ctx.lineWidth = 4;
    ctx.strokeRect(-20, -14, 40, 28);
    roundRectPath(ctx, -6, -7, 12, 12, 3);
    fillStroke(ctx, '#FFE66D', 3.0);
    SPRITES.props.chest = c;
  }

  // Roast Drumstick (Heal)
  {
    const { c, ctx } = makeCanvas(44, 44, 2);
    ctx.translate(22, 22);
    ctx.rotate(-0.45);
    roundRectPath(ctx, 4, -3.5, 14, 7, 3);
    fillStroke(ctx, '#FFF5E4', 2.8);
    ctx.beginPath();
    ctx.arc(17, -4, 4, 0, TAU);
    ctx.arc(17, 4, 4, 0, TAU);
    fillStroke(ctx, '#FFF5E4', 2.6);
    ctx.beginPath();
    ctx.ellipse(-4, 0, 13, 9.5, 0, 0, TAU);
    fillStroke(ctx, '#D97224', 3.2);
    ctx.fillStyle = 'rgba(255,230,180,0.45)';
    ctx.beginPath();
    ctx.ellipse(-6, -3, 6, 3, 0, 0, TAU);
    ctx.fill();
    SPRITES.props.chicken_leg = c;
  }

  // Magnet Pickup
  {
    const { c, ctx } = makeCanvas(44, 44, 2);
    ctx.translate(22, 22);
    ctx.beginPath();
    ctx.arc(0, 2, 12, Math.PI, TAU, true);
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = '#FF4757';
    ctx.stroke();
    roundRectPath(ctx, -15, -8, 7, 8, 1.5);
    fillStroke(ctx, '#DCE6F2', 2.5);
    roundRectPath(ctx, 8, -8, 7, 8, 1.5);
    fillStroke(ctx, '#48DBFB', 2.5);
    SPRITES.props.magnet = c;
  }

  // Freeze Clock Pickup
  {
    const { c, ctx } = makeCanvas(44, 44, 2);
    ctx.translate(22, 22);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    fillStroke(ctx, '#7CE8FF', 3.2);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, TAU);
    fillStroke(ctx, '#E8FFFF', 2.2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, 0); ctx.lineTo(5, 3);
    ctx.stroke();
    SPRITES.props.clock = c;
  }

  // Spicy Bomb Chili Pickup
  {
    const { c, ctx } = makeCanvas(44, 44, 2);
    ctx.translate(22, 22);
    ctx.beginPath();
    ctx.moveTo(-11, -8);
    ctx.quadraticCurveTo(2, -12, 12, 8);
    ctx.quadraticCurveTo(-2, 14, -11, -8);
    fillStroke(ctx, '#FF2E4C', 3.2);
    ctx.strokeStyle = '#3BD656';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-11, -8); ctx.lineTo(-15, -13);
    ctx.stroke();
    SPRITES.props.chili = c;
  }

  // Decorative Cozy Fantasy Street Lantern
  {
    const { c, ctx } = makeCanvas(64, 96, 2);
    ctx.translate(32, 84);
    // Base & iron post
    roundRectPath(ctx, -10, -8, 20, 10, 4);
    fillStroke(ctx, '#4A5568', 3.2);
    roundRectPath(ctx, -3.5, -62, 7, 56, 2);
    fillStroke(ctx, '#2D3748', 3.0);
    // Curved hook arm
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.quadraticCurveTo(18, -68, 18, -50);
    ctx.stroke();
    // Glowing warm lantern cage
    roundRectPath(ctx, 9, -50, 18, 22, 5);
    fillStroke(ctx, '#FFE066', 3.0);
    ctx.beginPath();
    ctx.moveTo(6, -50); ctx.lineTo(18, -58); ctx.lineTo(30, -50); ctx.closePath();
    fillStroke(ctx, '#4A5568', 2.8);
    SPRITES.props.lantern = c;
  }

  // Decorative Funny Wooden Signpost
  {
    const { c, ctx } = makeCanvas(76, 72, 2);
    ctx.translate(38, 60);
    roundRectPath(ctx, -4, -38, 8, 40, 2);
    fillStroke(ctx, '#8C5832', 3.0);
    ctx.save();
    ctx.rotate(-0.06);
    roundRectPath(ctx, -28, -42, 56, 24, 6);
    fillStroke(ctx, '#D99B52', 3.2);
    ctx.restore();
    SPRITES.props.signpost = c;
  }

  // Decorative Glowing Crystal Mushrooms
  {
    const { c, ctx } = makeCanvas(56, 52, 2);
    ctx.translate(28, 42);
    // Left small shroom
    roundRectPath(ctx, -15, -12, 7, 12, 3);
    fillStroke(ctx, '#DCE6F2', 2.4);
    ctx.beginPath();
    ctx.arc(-11.5, -12, 9, Math.PI, TAU);
    closePathAndFill(ctx, '#38F2D2');
    // Right main shroom
    roundRectPath(ctx, 0, -18, 9, 18, 3);
    fillStroke(ctx, '#DCE6F2', 2.6);
    ctx.beginPath();
    ctx.arc(4.5, -18, 13, Math.PI, TAU);
    closePathAndFill(ctx, '#63F5FF');
    SPRITES.props.glow_shroom = c;
  }
}

function closePathAndFill(ctx, color) {
  ctx.closePath();
  fillStroke(ctx, color, 2.8);
}

// Bake 30 Custom Illustrated Icons (Weapons, Evolutions, Passives)
function bakeAllIcons() {
  const allIds = [
    ...Object.keys(WEAPONS),
    ...Object.values(WEAPONS).map((w) => w.evoId),
    ...Object.keys(PASSIVES)
  ];

  for (const id of allIds) {
    const { c, ctx } = makeCanvas(64, 64, 2);
    const isEvo = id.startsWith('evo_');
    const baseId = isEvo ? id.replace('evo_', '') : id;
    const item = WEAPONS[baseId] || PASSIVES[baseId];
    const mainCol = isEvo ? '#FFD84D' : (item ? item.color : '#7CE8FF');
    const accCol = isEvo ? '#FF4DFF' : (item && item.accent ? item.accent : '#FFFFFF');

    // Badge backdrop
    roundRectPath(ctx, 4, 4, 56, 56, 14);
    const bg = ctx.createLinearGradient(0, 4, 0, 60);
    bg.addColorStop(0, isEvo ? '#4A1E66' : '#2E2546');
    bg.addColorStop(1, isEvo ? '#220E38' : '#1B142B');
    fillStroke(ctx, bg, 3.2, isEvo ? '#FFD84D' : '#4C3D70');

    // Soft inner glow
    const rg = ctx.createRadialGradient(32, 32, 2, 32, 32, 26);
    rg.addColorStop(0, mainCol + '66');
    rg.addColorStop(1, mainCol + '00');
    ctx.fillStyle = rg;
    ctx.fillRect(6, 6, 52, 52);

    ctx.save();
    ctx.translate(32, 32);

    switch (baseId) {
      case 'fish_sword':
        ctx.rotate(-0.65);
        ctx.beginPath();
        ctx.ellipse(0, -2, 9, 18, 0, 0, TAU);
        fillStroke(ctx, isEvo ? '#FFD84D' : '#6CE5F5', 3.0);
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(-8, -26); ctx.lineTo(8, -26); ctx.closePath();
        fillStroke(ctx, accCol, 2.5);
        roundRectPath(ctx, -10, 12, 20, 5, 2);
        fillStroke(ctx, '#FF8C2E', 2.5);
        break;

      case 'espresso_wand':
        roundRectPath(ctx, -10, -11, 20, 24, 4);
        fillStroke(ctx, isEvo ? '#FF4DFF' : '#7A4928', 3.0);
        ctx.fillStyle = '#FFE8CC';
        ctx.fillRect(-7.5, -8, 15, 6);
        ctx.beginPath();
        ctx.arc(0, -18, 6, 0, TAU);
        fillStroke(ctx, accCol, 2.4);
        break;

      case 'iron_wok':
        ctx.beginPath();
        ctx.arc(-2, -2, 15, 0, TAU);
        fillStroke(ctx, isEvo ? '#FF5E2E' : '#434A5E', 3.2);
        ctx.beginPath();
        ctx.arc(-2, -2, 9.5, 0, TAU);
        ctx.fillStyle = isEvo ? '#FFD84D' : '#656E87';
        ctx.fill();
        roundRectPath(ctx, 10, 8, 13, 6, 2.5);
        fillStroke(ctx, '#D97A2B', 2.6);
        break;

      case 'talisman':
        ctx.rotate(0.18);
        roundRectPath(ctx, -11, -18, 22, 36, 3);
        fillStroke(ctx, isEvo ? '#63F5FF' : '#FFE14D', 3.0);
        ctx.strokeStyle = '#E62E4D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, -10); ctx.lineTo(5, -10);
        ctx.moveTo(0, -10); ctx.lineTo(0, 10);
        ctx.moveTo(-6, 2); ctx.lineTo(6, 2);
        ctx.stroke();
        break;

      case 'pigeon':
        ctx.beginPath();
        ctx.ellipse(0, 3, 15, 12, 0, 0, TAU);
        fillStroke(ctx, isEvo ? '#FFE66D' : '#FFFFFF', 3.0);
        ctx.beginPath();
        ctx.arc(7, -8, 9, 0, TAU);
        fillStroke(ctx, isEvo ? '#FFE66D' : '#FFFFFF', 3.0);
        roundRectPath(ctx, 4, -11, 10, 5, 1.5);
        fillStroke(ctx, '#1E132A', 2.0);
        ctx.beginPath();
        ctx.moveTo(15, -7); ctx.lineTo(22, -5); ctx.lineTo(15, -3); ctx.closePath();
        fillStroke(ctx, '#FF9F1C', 2.2);
        break;

      case 'durian_aura':
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a - 0.25) * 12, Math.sin(a - 0.25) * 12);
          ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21);
          ctx.lineTo(Math.cos(a + 0.25) * 12, Math.sin(a + 0.25) * 12);
          fillStroke(ctx, isEvo ? '#D946EF' : '#9AE630', 2.5);
        }
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, TAU);
        fillStroke(ctx, isEvo ? '#F0ABFC' : '#C8FF4D', 3.0);
        break;

      case 'keyboard_rain':
        roundRectPath(ctx, -18, -14, 36, 28, 6);
        fillStroke(ctx, isEvo ? '#FFD84D' : '#ECEFF4', 3.2);
        roundRectPath(ctx, -13, -10, 26, 18, 4);
        fillStroke(ctx, isEvo ? '#FF3864' : '#5CE1E6', 2.4);
        ctx.fillStyle = INK;
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isEvo ? 'ENTER' : 'CTRL', 0, 2);
        break;

      case 'rubber_chicken':
        ctx.beginPath();
        ctx.ellipse(0, 7, 11, 13, 0, 0, TAU);
        fillStroke(ctx, '#FFE033', 3.0);
        roundRectPath(ctx, -5, -18, 10, 18, 5);
        fillStroke(ctx, '#FFE033', 3.0);
        ctx.beginPath();
        ctx.ellipse(2, -7, 6, 5, 0, 0, TAU);
        fillStroke(ctx, '#FF4757', 2.4);
        drawCartoonEye(ctx, -2, -13, 2.4);
        break;

      case 'boba_gun':
        roundRectPath(ctx, -12, -14, 24, 30, 5);
        fillStroke(ctx, isEvo ? '#A855F7' : '#F3C697', 3.0);
        [-5, 2, 6, -2].forEach((bx, idx) => {
          ctx.beginPath();
          ctx.arc(bx, 9 - (idx % 2) * 5, 3.2, 0, TAU);
          fillStroke(ctx, '#2E1A12', 1.5);
        });
        ctx.strokeStyle = '#FF5CA8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(2, -14); ctx.lineTo(6, -23);
        ctx.stroke();
        break;

      case 'laser_cat':
        ctx.rotate(-0.6);
        roundRectPath(ctx, -18, -5, 22, 10, 4);
        fillStroke(ctx, '#DCE6F2', 2.8);
        ctx.strokeStyle = isEvo ? '#63F5FF' : '#FF2E63';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(4, 0); ctx.lineTo(23, 0);
        ctx.stroke();
        break;

      // Passives
      case 'spinach':
        roundRectPath(ctx, -12, -15, 24, 30, 5);
        fillStroke(ctx, '#38D66B', 3.0);
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, TAU);
        fillStroke(ctx, '#A8FF60', 2.2);
        break;

      case 'coffee_bean':
        ctx.rotate(-0.35);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 16, 0, 0, TAU);
        fillStroke(ctx, '#8C5230', 3.2);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -13); ctx.quadraticCurveTo(5, 0, -2, 13);
        ctx.stroke();
        break;

      case 'dumbbell':
        ctx.rotate(-0.4);
        roundRectPath(ctx, -12, -3, 24, 6, 2);
        fillStroke(ctx, '#BAC8D9', 2.6);
        roundRectPath(ctx, -19, -11, 9, 22, 3);
        roundRectPath(ctx, 10, -11, 9, 22, 3);
        fillStroke(ctx, '#FF9F2E', 3.0);
        break;

      case 'copier':
        roundRectPath(ctx, -15, -6, 30, 20, 5);
        fillStroke(ctx, '#63E6E2', 3.0);
        roundRectPath(ctx, -9, -17, 18, 13, 2);
        fillStroke(ctx, '#FFFFFF', 2.6);
        break;

      case 'mini_fan':
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.rotate((i * TAU) / 3);
          ctx.beginPath();
          ctx.ellipse(0, -10, 5.5, 9, 0, 0, TAU);
          fillStroke(ctx, '#7CE8FF', 2.6);
          ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, TAU);
        fillStroke(ctx, '#FFFFFF', 2.5);
        break;

      case 'thermos':
        roundRectPath(ctx, -10, -17, 20, 34, 6);
        fillStroke(ctx, '#FF5C77', 3.0);
        roundRectPath(ctx, -8, -19, 16, 7, 3);
        fillStroke(ctx, '#DCE6F2', 2.6);
        break;

      case 'lucky_cat':
        ctx.beginPath();
        ctx.arc(0, 2, 14, 0, TAU);
        fillStroke(ctx, '#FFE047', 3.0);
        drawCartoonEye(ctx, -5, 0, 2.4);
        drawCartoonEye(ctx, 5, 0, 2.4);
        break;

      case 'magnet_core':
        ctx.drawImage(SPRITES.props.magnet, -20, -20, 40, 40);
        break;

      case 'gummy_bear':
        ctx.beginPath();
        ctx.arc(-7, -11, 5, 0, TAU);
        ctx.arc(7, -11, 5, 0, TAU);
        ctx.arc(0, -4, 11, 0, TAU);
        ctx.ellipse(0, 9, 10, 9, 0, 0, TAU);
        fillStroke(ctx, '#FF8CE6', 2.8);
        break;

      case 'battery':
        roundRectPath(ctx, -11, -15, 22, 32, 5);
        fillStroke(ctx, '#47FF9C', 3.0);
        roundRectPath(ctx, -5, -19, 10, 5, 2);
        fillStroke(ctx, '#DCE6F2', 2.4);
        ctx.fillStyle = '#FFE600';
        ctx.beginPath();
        ctx.moveTo(2, -9); ctx.lineTo(-6, 2); ctx.lineTo(0, 2);
        ctx.lineTo(-3, 11); ctx.lineTo(6, -1); ctx.lineTo(0, -1);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
    SPRITES.icons[id] = c;
    SPRITES.iconUrls[id] = c.toDataURL();
  }
}

function bakeAllSprites() {
  bakeGlows();
  bakeGroundTile();
  bakeHeroes();
  bakeEnemies();
  bakeBosses();
  bakeProps();
  bakeAllIcons();
}
