// ============================================================================
// Juicy Cartoon VFX Engine: Pooled Particles, Slash Arcs, Shockwaves,
// Lightning/Laser Beams, Ground Decals, Ghost Trails & Comic Damage Popups
// ============================================================================

class FXManager {
  constructor() {
    this.particles = [];
    this.particlePool = [];
    this.rings = [];
    this.slashes = [];
    this.beams = [];
    this.decals = [];
    this.ghosts = [];
    this.texts = [];

    this.shakeTrauma = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.hitStop = 0;
    this.lastHitStopAt = 0;
    this.screenFlash = 0;
    this.screenFlashColor = '#FFFFFF';
  }

  reset() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.slashes.length = 0;
    this.beams.length = 0;
    this.decals.length = 0;
    this.ghosts.length = 0;
    this.texts.length = 0;
    this.shakeTrauma = 0;
    this.hitStop = 0;
    this.screenFlash = 0;
  }

  addShake(amount) {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + amount);
  }

  triggerHitStop(duration = 0.032, now = 0) {
    // Throttle hitstop so ultra-rapid endgame hits never cause stutter
    if (now - this.lastHitStopAt < 0.22) return;
    this.lastHitStopAt = now;
    this.hitStop = Math.max(this.hitStop, duration);
  }

  flashScreen(color = '#FFFFFF', alpha = 0.45) {
    this.screenFlashColor = color;
    this.screenFlash = Math.max(this.screenFlash, alpha);
  }

  spawnParticle(opts) {
    if (this.particles.length >= 900) return;
    const p = this.particlePool.pop() || {};
    p.x = opts.x || 0;
    p.y = opts.y || 0;
    p.vx = opts.vx || 0;
    p.vy = opts.vy || 0;
    p.size = opts.size || 6;
    p.endSize = opts.endSize !== undefined ? opts.endSize : 0.5;
    p.color = opts.color || '#FFE066';
    p.life = 0;
    p.maxLife = opts.maxLife || 0.38;
    p.drag = opts.drag !== undefined ? opts.drag : 4.5;
    p.gravity = opts.gravity || 0;
    p.shape = opts.shape || 'circle'; // 'circle' | 'star' | 'spark' | 'ringlet'
    p.rot = opts.rot || rand(0, TAU);
    p.vrot = opts.vrot || 0;
    p.additive = !!opts.additive;
    p.outlined = opts.outlined !== false;
    this.particles.push(p);
  }

  burst(x, y, color, count = 8, speed = 170, size = 6.5, shape = 'circle', additive = false) {
    // Scale burst count gracefully if particle count is already high
    const factor = this.particles.length > 550 ? 0.45 : 1;
    const n = Math.max(2, Math.round(count * factor));
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(speed * 0.35, speed);
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: rand(size * 0.65, size * 1.25),
        color,
        maxLife: rand(0.22, 0.46),
        shape,
        additive,
        outlined: !additive,
        vrot: rand(-8, 8)
      });
    }
  }

  directionalSparks(x, y, angle, color, count = 6, speed = 240) {
    const n = this.particles.length > 600 ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-0.55, 0.55);
      const sp = rand(speed * 0.45, speed * 1.15);
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: rand(5, 9),
        color,
        maxLife: rand(0.16, 0.30),
        shape: 'spark',
        additive: true,
        outlined: false,
        drag: 6
      });
    }
  }

  addRing(x, y, r0, r1, color = '#FFD84D', maxLife = 0.32, width = 7, additive = true) {
    if (this.rings.length >= 75) return;
    this.rings.push({ x, y, r0, r1, color, life: 0, maxLife, width, additive });
  }

  addSlash(x, y, angle, span, radius, color = '#5CE1E6', accent = '#FFFFFF', maxLife = 0.20, thickness = 22, isFish = false) {
    if (this.slashes.length >= 40) return;
    this.slashes.push({ x, y, angle, span, radius, color, accent, life: 0, maxLife, thickness, isFish });
  }

  addBeam(x1, y1, x2, y2, color = '#FF3864', width = 14, maxLife = 0.20, jagged = false) {
    if (this.beams.length >= 50) return;
    const pts = [];
    if (jagged) {
      const segs = 7;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const jitter = (i === 0 || i === segs) ? 0 : rand(-14, 14);
        pts.push({ x: x1 + dx * t + nx * jitter, y: y1 + dy * t + ny * jitter });
      }
    }
    this.beams.push({ x1, y1, x2, y2, color, width, life: 0, maxLife, jagged, pts });
  }

  addDecal(x, y, radius, color) {
    if (this.decals.length >= 110) this.decals.shift();
    this.decals.push({
      x,
      y,
      radius,
      color,
      rot: rand(0, TAU),
      life: 0,
      maxLife: 4.5
    });
  }

  addGhost(x, y, sprite, scaleX = 1, scaleY = 1, tint = '#63F5FF') {
    if (this.ghosts.length >= 28) return;
    this.ghosts.push({ x, y, sprite, scaleX, scaleY, tint, life: 0, maxLife: 0.24 });
  }

  addText(x, y, text, color = '#FFFFFF', isCrit = false, scale = 1.0) {
    if (!isCrit && this.texts.length >= 130) return;
    if (this.texts.length >= 180) this.texts.shift();
    this.texts.push({
      x: x + rand(-10, 10),
      y: y - 12 + rand(-6, 4),
      vx: rand(-26, 26),
      vy: isCrit ? -115 : -78,
      text,
      color,
      isCrit,
      baseScale: scale * (isCrit ? 1.28 : 1.0),
      life: 0,
      maxLife: isCrit ? 0.78 : 0.56
    });
  }

  update(dt) {
    // Screen flash & Camera trauma
    if (this.screenFlash > 0) this.screenFlash = Math.max(0, this.screenFlash - dt * 2.4);
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.6);
      const mag = this.shakeTrauma * this.shakeTrauma * 18;
      this.shakeX = rand(-mag, mag);
      this.shakeY = rand(-mag, mag);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particlePool.push(p);
        swapPop(this.particles, i);
        continue;
      }
      const damp = Math.exp(-p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
    }

    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life += dt;
      if (r.life >= r.maxLife) swapPop(this.rings, i);
    }

    // Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life += dt;
      if (s.life >= s.maxLife) swapPop(this.slashes, i);
    }

    // Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life += dt;
      if (b.life >= b.maxLife) swapPop(this.beams, i);
    }

    // Decals
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life += dt;
      if (d.life >= d.maxLife) swapPop(this.decals, i);
    }

    // Ghosts
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.life += dt;
      if (g.life >= g.maxLife) swapPop(this.ghosts, i);
    }

    // Floating Damage & Callout Texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life += dt;
      if (t.life >= t.maxLife) {
        swapPop(this.texts, i);
        continue;
      }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += 155 * dt; // subtle gravity arc
    }
  }

  renderDecals(ctx, viewL, viewT, viewR, viewB) {
    for (let i = 0; i < this.decals.length; i++) {
      const d = this.decals[i];
      if (d.x + d.radius < viewL || d.x - d.radius > viewR || d.y + d.radius < viewT || d.y - d.radius > viewB) continue;
      const alpha = 0.26 * (1 - d.life / d.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.radius, d.radius * 0.68, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.radius * 0.72, -d.radius * 0.25, d.radius * 0.32, 0, TAU);
      ctx.arc(-d.radius * 0.65, d.radius * 0.35, d.radius * 0.25, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  renderGhosts(ctx) {
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      const t = 1 - g.life / g.maxLife;
      ctx.save();
      ctx.globalAlpha = t * 0.48;
      ctx.translate(g.x, g.y);
      ctx.scale(g.scaleX, g.scaleY);
      const w = g.sprite.logicalW || 84;
      const h = g.sprite.logicalH || 88;
      ctx.drawImage(g.sprite, -w * 0.5, -h * 0.58, w, h);
      ctx.restore();
    }
  }

  renderVFX(ctx, viewL, viewT, viewR, viewB) {
    // 1. Crescent Blade Slashes
    for (let i = 0; i < this.slashes.length; i++) {
      const s = this.slashes[i];
      const p = s.life / s.maxLife;
      const alpha = 1 - p * p;
      const r = s.radius * (0.86 + p * 0.22);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.globalAlpha = alpha;

      // Outer vibrant slash crescent
      ctx.beginPath();
      ctx.arc(0, 0, r, -s.span * 0.5, s.span * 0.5, false);
      ctx.arc(-s.thickness * (1 - p * 0.5), 0, Math.max(8, r - s.thickness * 0.65), s.span * 0.5, -s.span * 0.5, true);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, -s.span * 0.38, s.span * 0.38);
      ctx.lineWidth = Math.max(2, s.thickness * 0.34 * (1 - p));
      ctx.strokeStyle = s.accent;
      ctx.stroke();

      // Swinging Cartoon Salted Fish Blade along the leading edge!
      if (s.isFish) {
        const fishAng = lerp(-s.span * 0.45, s.span * 0.45, Math.min(1, p * 1.25));
        ctx.save();
        ctx.rotate(fishAng);
        ctx.translate(r * 0.72, 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 9, 0, 0, TAU);
        fillStroke(ctx, s.color, 3.0);
        ctx.beginPath();
        ctx.moveTo(19, 0); ctx.lineTo(28, -8); ctx.lineTo(28, 8); ctx.closePath();
        fillStroke(ctx, '#FFD84D', 2.4);
        ctx.restore();
      }
      ctx.restore();
    }

    // 2. Shockwave Rings
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      const p = r.life / r.maxLife;
      const ease = 1 - Math.pow(1 - p, 3);
      const rad = lerp(r.r0, r.r1, ease);
      if (r.x + rad < viewL || r.x - rad > viewR || r.y + rad < viewT || r.y - rad > viewB) continue;
      ctx.save();
      if (r.additive) ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1.2, r.width * (1 - p));
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Laser & Lightning Beams
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      const p = b.life / b.maxLife;
      const alpha = 1 - p;
      ctx.globalAlpha = alpha;
      if (b.jagged && b.pts.length > 1) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width * (1 - p * 0.5);
        ctx.beginPath();
        ctx.moveTo(b.pts[0].x, b.pts[0].y);
        for (let k = 1; k < b.pts.length; k++) ctx.lineTo(b.pts[k].x, b.pts[k].y);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1.5, b.width * 0.36 * (1 - p * 0.5));
        ctx.stroke();
      } else {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width * (1 - p * 0.45);
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(2, b.width * 0.42 * (1 - p * 0.45));
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 4. Particles (Normal Outlined Cartoon Puffs first, then Additive Sparks)
    for (let pass = 0; pass < 2; pass++) {
      const wantAdditive = pass === 1;
      ctx.save();
      if (wantAdditive) ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.additive !== wantAdditive) continue;
        if (p.x < viewL - 30 || p.x > viewR + 30 || p.y < viewT - 30 || p.y > viewB + 30) continue;

        const t = p.life / p.maxLife;
        const sz = lerp(p.size, p.endSize, t);
        if (sz <= 0.4) continue;
        ctx.globalAlpha = 1 - t * t;

        if (p.shape === 'spark') {
          const ang = Math.atan2(p.vy, p.vx);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.6, sz * 0.55);
          ctx.beginPath();
          ctx.moveTo(p.x - Math.cos(ang) * sz * 1.6, p.y - Math.sin(ang) * sz * 1.6);
          ctx.lineTo(p.x + Math.cos(ang) * sz * 1.6, p.y + Math.sin(ang) * sz * 1.6);
          ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * sz * 1.5, Math.sin(a) * sz * 1.5);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * sz * 0.5, Math.sin(a + Math.PI / 4) * sz * 0.5);
          }
          ctx.closePath();
          ctx.fill();
          if (p.outlined) {
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = INK;
            ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, sz, 0, TAU);
          ctx.fill();
          if (p.outlined) {
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = INK;
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 5. Comic Floating Damage Numbers & Callouts
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (t.x < viewL - 80 || t.x > viewR + 80 || t.y < viewT - 80 || t.y > viewB + 80) continue;
      const p = t.life / t.maxLife;
      // Spring pop-in scale: 0 -> 1.38 -> 1.0
      let sc = t.baseScale;
      if (p < 0.16) sc *= lerp(0.35, 1.38, p / 0.16);
      else if (p < 0.34) sc *= lerp(1.38, 1.0, (p - 0.16) / 0.18);
      const alpha = p > 0.72 ? (1 - p) / 0.28 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y);
      ctx.scale(sc, sc);
      ctx.font = t.isCrit
        ? '900 20px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif'
        : '800 15px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif';
      ctx.lineWidth = t.isCrit ? 5.2 : 4.0;
      ctx.strokeStyle = INK;
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

const FX = new FXManager();
