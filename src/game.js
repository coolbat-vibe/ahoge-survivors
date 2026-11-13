// ============================================================================
// Core Game Engine & High-DPI Cartoon Renderer
// ============================================================================

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;

    this.grid = new SpatialHashGrid(96, 4096, 4096);
    this.director = null;

    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.victory = false;
    this.endlessMode = false;
    this.turboMode = false;
    this.autoAim = true;
    this.showFps = true;

    this.runTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    this._fpsFrames = 0;
    this._fpsAccum = 0;

    // Entity collections
    this.player = null;
    this.stats = {};
    this.weapons = [];
    this.passives = [];
    this.enemies = [];
    this.projectiles = [];
    this.enemyBullets = [];
    this.mines = [];
    this.fallingDrops = [];
    this.zones = [];
    this.orbitals = [];
    this.telegraphs = [];
    this.gems = [];
    this.pickups = [];
    this.props = [];
    this.shrines = [];
    this.scheduled = [];
    this.fireflies = [];

    this.activeBoss = null;
    this.freezeTimer = 0;
    this.spicyTimer = 0;
    this.feverTimer = 0;
    this.feverGauge = 0;

    // Run statistics
    this.kills = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.goldEarned = 0;
    this.chestsOpened = 0;
    this.evosCrafted = 0;
    this.rerollsLeft = 1;
    this.banishesLeft = 1;
    this.revivesLeft = 0;
    this.banishedIds = new Set();
    this.pendingLevelUps = 0;

    // Input state
    this.keys = {};
    this.input = {
      moveX: 0,
      moveY: 0,
      mouseX: 0,
      mouseY: 0,
      mouseWorldX: 0,
      mouseWorldY: 0,
      joyActive: false,
      joyStartX: 0,
      joyStartY: 0,
      joyCurX: 0,
      joyCurY: 0
    };

    this.camX = 0;
    this.camY = 0;

    this._bindEvents();
    this.resize();
  }

  _bindEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (!this.running) return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!UI.isModalBlocking()) UI.togglePause();
      } else if (e.code === 'Space') {
        if (!this.paused) {
          e.preventDefault();
          executeHeroDash(this);
        }
      } else if (e.code === 'KeyQ' || e.code === 'KeyE') {
        if (!this.paused) this.activateFever();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        this.autoAim = !this.autoAim;
        this.pushBanner(
          this.autoAim
            ? t('🎯 已切换为：智能自动索敌', '🎯 Switched to: Smart Auto-Aim')
            : t('🖱️ 已切换为：鼠标准星瞄准', '🖱️ Switched to: Cursor Aim'),
          '#63F5FF'
        );
        UI.syncAimBadge();
      } else if (UI.levelModalOpen && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        UI.pickUpgradeByIndex(idx);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
      if (this.input.joyActive) {
        this.input.joyCurX = e.clientX;
        this.input.joyCurY = e.clientY;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      SFX.init();
      if (!this.running || this.paused) return;
      if (e.button === 2) {
        executeHeroDash(this);
        return;
      }
      if (e.button === 0) {
        this.input.joyActive = true;
        this.input.joyStartX = e.clientX;
        this.input.joyStartY = e.clientY;
        this.input.joyCurX = e.clientX;
        this.input.joyCurY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.input.joyActive = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch virtual joystick support
    this.canvas.addEventListener('touchstart', (e) => {
      SFX.init();
      if (!this.running || this.paused || !e.touches[0]) return;
      const t = e.touches[0];
      this.input.joyActive = true;
      this.input.joyStartX = t.clientX;
      this.input.joyStartY = t.clientY;
      this.input.joyCurX = t.clientX;
      this.input.joyCurY = t.clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.input.joyActive || !e.touches[0]) return;
      const t = e.touches[0];
      this.input.joyCurX = t.clientX;
      this.input.joyCurY = t.clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.input.joyActive = false;
    });
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;
  }

  startNewRun(heroId, turboMode = false) {
    const hero = HEROES.find((h) => h.id === heroId) || HEROES[0];
    FX.reset();

    this.running = true;
    this.paused = false;
    this.gameOver = false;
    this.victory = false;
    this.endlessMode = false;
    this.turboMode = turboMode;
    this.runTime = 0;
    this.frameCount = 0;

    this.weapons = [];
    this.passives = [];
    this.enemies = [];
    this.projectiles = [];
    this.enemyBullets = [];
    this.mines = [];
    this.fallingDrops = [];
    this.zones = [];
    this.orbitals = [];
    this.telegraphs = [];
    this.gems = [];
    this.pickups = [];
    this.props = [];
    this.shrines = [];
    this.scheduled = [];
    this.activeBoss = null;

    this.freezeTimer = 0;
    this.spicyTimer = 0;
    this.feverTimer = 0;
    this.feverGauge = 25;

    this.kills = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.goldEarned = 0;
    this.chestsOpened = 0;
    this.evosCrafted = 0;
    this.banishedIds.clear();
    this.pendingLevelUps = 0;

    const talents = UI.saveData.talents || {};
    this.rerollsLeft = 1 + (talents.reroll || 0);
    this.banishesLeft = 1 + (talents.reroll || 0);
    this.revivesLeft = talents.revive || 0;

    this.player = {
      heroId: hero.id,
      x: 0,
      y: 0,
      radius: 19,
      hp: 100,
      xp: 0,
      xpNext: 10,
      level: 1,
      facing: 1,
      aimAngle: 0,
      walkAnim: 0,
      moving: false,
      invulnTimer: 1.0,
      flashTimer: 0,
      squashX: 1,
      squashY: 1,
      dashCd: 0,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      dashTrailTimer: 0
    };

    this.addWeapon(hero.starterWeapon);
    this.recomputeStats(true);
    this.player.hp = this.stats.maxHp;

    this.camX = 0;
    this.camY = 0;
    this.director = new WaveDirector(this);

    // Seed initial props, a nearby welcome shrine, and ambient fireflies!
    for (let i = 0; i < 8; i++) spawnPropNearPlayer(this);
    this.fireflies = [];
    for (let i = 0; i < 36; i++) {
      this.fireflies.push({
        ox: rand(-900, 900),
        oy: rand(-600, 600),
        phase: rand(0, TAU),
        speed: rand(0.8, 2.0),
        size: rand(2, 4),
        color: i % 3 === 0 ? '#63F5FF' : '#FFE066'
      });
    }

    // Spawn an immediate fun starter pack of slimes so action begins at 0.5s!
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      this.enemies.push(createEnemy(this, 'slime', Math.cos(a) * 420, Math.sin(a) * 340));
    }

    SFX.startBgm('normal');
    UI.updateHUD(true);
    this.pushBanner(
      t(
        `🌟 ${hero.name} 出击！${turboMode ? '【极速狂欢模式】已开启！' : '撑过 8分30秒 痛扁星期一大魔王！'}`,
        `🌟 ${hero.nameEn} deployed! ${turboMode ? '[TURBO CARNIVAL] Active!' : 'Survive 08:30 & crush Arch-Demon MONDAY!'}`
      ),
      '#FFD84D'
    );
  }

  recomputeStats(initial = false) {
    const hero = HEROES.find((h) => h.id === this.player.heroId);
    const b = hero.stats;
    const t = UI.saveData.talents || {};

    const prevMaxHp = this.stats.maxHp || b.maxHp;

    const s = {
      maxHp: b.maxHp + (t.maxHp || 0) * 15,
      speed: b.speed * (1 + (t.speed || 0) * 0.04),
      armor: b.armor,
      might: b.might * (1 + (t.might || 0) * 0.06),
      crit: b.crit + (t.crit || 0) * 0.03,
      critDmg: b.critDmg,
      cdr: b.cdr * Math.pow(0.965, t.cdr || 0),
      area: b.area,
      projSpeed: b.projSpeed,
      duration: b.duration,
      amount: b.amount,
      pierce: b.pierce,
      magnet: b.magnet * (1 + (t.magnet || 0) * 0.12),
      regen: b.regen,
      luck: b.luck,
      knockback: b.knockback,
      xpMult: (1 + (t.growth || 0) * 0.08) * (this.turboMode ? 1.38 : 1.0),
      goldMult: (1 + (t.greed || 0) * 0.12) * (this.turboMode ? 1.25 : 1.0)
    };

    // Apply Passive Relics
    for (const pas of this.passives) {
      const lv = pas.level;
      switch (pas.id) {
        case 'spinach': s.might += lv * 0.14; break;
        case 'coffee_bean': s.cdr *= Math.pow(0.92, lv); break;
        case 'dumbbell': s.area += lv * 0.14; break;
        case 'copier':
          s.amount += lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
          s.might += lv * 0.06;
          break;
        case 'mini_fan':
          s.projSpeed += lv * 0.15;
          s.duration += lv * 0.15;
          break;
        case 'thermos':
          s.maxHp += lv * 22;
          s.regen += lv * 1.2;
          break;
        case 'lucky_cat':
          s.crit += lv * 0.07;
          s.luck += lv * 0.15;
          s.goldMult += lv * 0.15;
          break;
        case 'magnet_core':
          s.magnet *= 1 + lv * 0.30;
          break;
        case 'gummy_bear':
          s.pierce += lv;
          s.knockback += lv * 0.12;
          break;
        case 'battery':
          s.critDmg += lv * 0.18;
          s.speed *= 1 + lv * 0.08;
          break;
      }
    }

    s.cdr = Math.max(0.28, s.cdr);
    this.stats = s;

    if (!initial && s.maxHp > prevMaxHp) {
      this.player.hp = Math.min(s.maxHp, this.player.hp + (s.maxHp - prevMaxHp));
    }
    this.rebuildOrbitals();
  }

  addWeapon(id) {
    const existing = this.weapons.find((w) => w.id === id);
    if (existing) {
      if (existing.level < 5) existing.level++;
      this.recomputeStats();
      return existing;
    }
    if (this.weapons.length >= GAME_META.maxWeapons) return null;
    const w = {
      id,
      level: 1,
      evolved: false,
      cdTimer: 0.15,
      totalDmg: 0,
      _visualRadius: 0,
      _pulseAnim: 0
    };
    this.weapons.push(w);
    this.recomputeStats();
    return w;
  }

  addPassive(id) {
    const existing = this.passives.find((p) => p.id === id);
    if (existing) {
      if (existing.level < 5) existing.level++;
      this.recomputeStats();
      return existing;
    }
    if (this.passives.length >= GAME_META.maxPassives) return null;
    const pas = { id, level: 1 };
    this.passives.push(pas);
    this.recomputeStats();
    return pas;
  }

  getEvolvableWeapons() {
    const out = [];
    for (const w of this.weapons) {
      if (w.evolved || w.level < 5) continue;
      const def = WEAPONS[w.id];
      if (this.passives.some((p) => p.id === def.pairPassive)) {
        out.push(w);
      }
    }
    return out;
  }

  evolveWeapon(w) {
    w.evolved = true;
    this.evosCrafted++;
    this.recomputeStats();
    SFX.play('evo');
    FX.flashScreen('#FFD84D', 0.55);
    FX.addShake(0.65);
    FX.addRing(this.player.x, this.player.y, 18, 280, '#FFD84D', 0.6, 12, true);
    UI.unlockAchievement('first_evo');
  }

  scheduleAction(delay, fn) {
    if (delay <= 0) fn();
    else this.scheduled.push({ t: delay, fn });
  }

  getAimAngle() {
    const p = this.player;
    if (!this.autoAim) {
      return Math.atan2(this.input.mouseWorldY - p.y, this.input.mouseWorldX - p.x);
    }
    const nearest = this.grid.findNearest(this.enemies, p.x, p.y, 520);
    if (nearest) {
      return Math.atan2(nearest.y - p.y, nearest.x - p.x);
    }
    return p.aimAngle;
  }

  activateFever() {
    if (this.feverGauge < 100 || this.feverTimer > 0) return;
    this.feverGauge = 0;
    this.feverTimer = 6.5;
    SFX.play('evo');
    SFX.setBgmMode('fever');
    FX.flashScreen('#63F5FF', 0.38);
    FX.addShake(0.5);
    FX.addRing(this.player.x, this.player.y, 15, 290, '#63F5FF', 0.5, 11, true);
    FX.addText(this.player.x, this.player.y - 44, t('🌈 摸鱼之魂全开!!', '🌈 SLACKING FEVER OVERLOAD!!'), '#FFE047', true, 1.45);

    // Pull nearby gems for instant satisfaction!
    for (const g of this.gems) {
      if (distSq(g.x, g.y, this.player.x, this.player.y) < 520 * 520) {
        g.magnetized = true;
        g.kickTimer = 0.08;
      }
    }
  }

  // ============================================================================
  // Main Simulation Step
  // ============================================================================
  update(rawDt) {
    if (!this.running || this.paused || this.gameOver) return;

    // Track FPS smoothly
    this._fpsFrames++;
    this._fpsAccum += rawDt;
    if (this._fpsAccum >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsFrames = 0;
      this._fpsAccum = 0;
    }

    // Micro Hit-Stop for juicy big crits / boss kills!
    if (FX.hitStop > 0) {
      FX.hitStop -= rawDt;
      FX.update(rawDt * 0.35);
      return;
    }

    const dt = Math.min(rawDt, 0.05);
    this.frameCount++;
    const timeFlow = this.turboMode ? 1.75 : 1.0;
    this.runTime += dt * timeFlow;

    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.spicyTimer > 0) this.spicyTimer -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
    if (this.feverTimer > 0) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        SFX.setBgmMode(this.activeBoss && !this.activeBoss.dead ? 'boss' : 'normal');
      }
    }

    // Delayed weapon multi-shot callbacks
    for (let i = this.scheduled.length - 1; i >= 0; i--) {
      const s = this.scheduled[i];
      s.t -= dt;
      if (s.t <= 0) {
        s.fn();
        swapPop(this.scheduled, i);
      }
    }

    this._updatePlayer(dt);
    this.director.update(dt * timeFlow);
    updateEnemiesAndBosses(this, dt);
    this._updateWeapons(dt);
    this._updateOrbitals(dt);
    this._updateProjectiles(dt);
    this._updateFallingDrops(dt);
    this._updateMines(dt);
    this._updateZones(dt);
    this._updatePropsAndShrines(dt);
    this._updateGemsAndPickups(dt);
    FX.update(dt);

    // Smooth camera follow
    this.camX = lerp(this.camX, this.player.x, Math.min(1, dt * 12));
    this.camY = lerp(this.camY, this.player.y, Math.min(1, dt * 12));
    this.input.mouseWorldX = this.camX - this.viewW * 0.5 + this.input.mouseX;
    this.input.mouseWorldY = this.camY - this.viewH * 0.5 + this.input.mouseY;

    // Trigger queued level-up draft safely outside collision loops
    if (this.pendingLevelUps > 0 && !UI.isModalBlocking()) {
      this.pendingLevelUps--;
      UI.openLevelUpModal();
    }

    if ((this.frameCount & 3) === 0) {
      UI.updateHUD(false);
    }
  }

  _updatePlayer(dt) {
    const p = this.player;
    const s = this.stats;

    // HP Regeneration
    if (s.regen > 0 && p.hp < s.maxHp) {
      p.hp = Math.min(s.maxHp, p.hp + s.regen * dt);
    }

    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.flashTimer > 0) p.flashTimer -= dt;
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    p.squashX = lerp(p.squashX, 1, Math.min(1, dt * 14));
    p.squashY = lerp(p.squashY, 1, Math.min(1, dt * 14));

    // Compute movement vector from WASD/Arrows OR Virtual Joystick
    let mx = 0;
    let my = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) my -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) my += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) mx -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) mx += 1;

    if (mx === 0 && my === 0 && this.input.joyActive) {
      const jx = this.input.joyCurX - this.input.joyStartX;
      const jy = this.input.joyCurY - this.input.joyStartY;
      const jDist = Math.hypot(jx, jy);
      if (jDist > 10) {
        mx = jx / jDist;
        my = jy / jDist;
      }
    }

    const mLen = Math.hypot(mx, my);
    if (mLen > 0.01) {
      mx /= mLen;
      my /= mLen;
      p.moving = true;
      p.aimAngle = Math.atan2(my, mx);
      if (Math.abs(mx) > 0.08) p.facing = mx > 0 ? 1 : -1;
      p.walkAnim += dt * 11;
    } else {
      p.moving = false;
      p.walkAnim += dt * 3;
    }
    this.input.moveX = mx;
    this.input.moveY = my;

    // Active Dash Physics & Special Hero Dash Effects!
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.x += p.dashVx * dt;
      p.y += p.dashVy * dt;
      p.dashTrailTimer -= dt;

      if (p.dashTrailTimer <= 0) {
        p.dashTrailTimer = 0.04;
        const hSprite = SPRITES.heroes[p.heroId].frames[0];
        FX.addGhost(p.x, p.y, hSprite, p.facing * 1.08, 0.92);

        if (p.heroId === 'shiba') {
          // Cyber Roomba leaves electric trail pods!
          this.zones.push({
            kind: 'cyber_trail',
            x: p.x,
            y: p.y,
            r: 38,
            dmg: (20 + p.level * 4) * s.might,
            slow: 0.75,
            color: '#00F5D4',
            tickTimer: 0.15,
            life: 0,
            maxLife: 2.0
          });
        }
      }

      if (p.heroId === 'goose') {
        // Chef Goose Stampede rams and crits enemies along path!
        const ram = this.grid.queryCircle(this.enemies, p.x, p.y, 58);
        for (const e of ram) {
          if (e._gooseHitAt && this.runTime - e._gooseHitAt < 0.3) continue;
          e._gooseHitAt = this.runTime;
          this.damageEnemy(e, (42 + p.level * 7) * s.might, p.x, p.y, 380, true, '#FFD84D');
        }
      }

      // Knight Salted Fish Landing Slam!
      if (p.dashTimer <= 0 && p.heroId === 'knight') {
        SFX.play('slap');
        FX.addShake(0.42);
        FX.addRing(p.x, p.y, 16, 150, '#FFD84D', 0.36, 10, true);
        FX.burst(p.x, p.y, '#FFD84D', 14, 220, 7, 'star', true);
        const hit = this.grid.queryCircle(this.enemies, p.x, p.y, 150);
        for (const e of hit) {
          e.stunTimer = Math.max(e.stunTimer, 1.15);
          this.damageEnemy(e, (46 + p.level * 7) * s.might, p.x, p.y, 340, true, '#FFD84D');
        }
      }
    } else {
      const feverSpd = this.feverTimer > 0 ? 1.26 : 1.0;
      const spicySpd = this.spicyTimer > 0 ? 1.20 : 1.0;
      const spd = s.speed * feverSpd * spicySpd;
      p.x += mx * spd * dt;
      p.y += my * spd * dt;
    }

    // Spicy Chili Pickup breathes cartoon fireballs while active!
    if (this.spicyTimer > 0 && (this.frameCount % 8 === 0)) {
      const a = this.getAimAngle() + rand(-0.25, 0.25);
      this.projectiles.push({
        kind: 'talisman',
        weapon: null,
        isEvo: false,
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        r: 11,
        blastR: 60,
        dmg: (28 + p.level * 4) * s.might,
        pierceLeft: 1,
        knockback: 140,
        rot: a,
        hitSet: new Set(),
        life: 0,
        maxLife: 1.0
      });
    }
  }

  _updateWeapons(dt) {
    const feverCdr = this.feverTimer > 0 ? 0.58 : 1.0;
    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      if (w._pulseAnim > 0) w._pulseAnim = Math.max(0, w._pulseAnim - dt * 3.5);
      if (w.id === 'pigeon') continue; // Orbitals run continuously

      w.cdTimer -= dt;
      if (w.cdTimer <= 0) {
        const def = WEAPONS[w.id];
        const lvCdr = w.evolved
          ? (w.id === 'espresso_wand' ? 0.26 : w.id === 'durian_aura' ? 0.46 : 0.68)
          : Math.pow(0.93, w.level - 1);
        w.cdTimer = Math.max(0.09, def.baseCd * lvCdr * this.stats.cdr * feverCdr);
        fireWeaponInstance(this, w);
      }
    }
  }

  rebuildOrbitals() {
    const pw = this.weapons.find((w) => w.id === 'pigeon');
    if (!pw) {
      this.orbitals.length = 0;
      return;
    }
    const lv = pw.level;
    const isEvo = pw.evolved;
    const count = (isEvo ? 8 : (lv >= 5 ? 6 : lv >= 4 ? 4 : lv >= 2 ? 3 : 2)) + this.stats.amount;
    this.orbitals.length = 0;
    for (let i = 0; i < count; i++) {
      this.orbitals.push({
        weapon: pw,
        isEvo,
        index: i,
        count,
        angle: (i / count) * TAU,
        x: this.player.x,
        y: this.player.y,
        r: 20 * this.stats.area,
        featherTimer: rand(0.1, 0.5),
        hitCooldowns: new Map()
      });
    }
  }

  _updateOrbitals(dt) {
    if (this.orbitals.length === 0) return;
    const p = this.player;
    const pw = this.orbitals[0].weapon;
    const lv = pw.level;
    const isEvo = pw.evolved;
    const orbitR = (isEvo ? 118 : (86 + lv * 6)) * this.stats.area;
    const rotSpd = (isEvo ? 5.2 : (3.0 + lv * 0.35)) * this.stats.projSpeed;
    const dmg = WEAPONS.pigeon.baseDmg * (isEvo ? 2.95 : (1 + (lv - 1) * 0.34)) * this.stats.might;

    for (let i = 0; i < this.orbitals.length; i++) {
      const orb = this.orbitals[i];
      orb.angle += rotSpd * dt;
      orb.x = p.x + Math.cos(orb.angle) * orbitR;
      orb.y = p.y + Math.sin(orb.angle) * orbitR;
      orb.r = (isEvo ? 23 : 19) * Math.sqrt(this.stats.area);

      const hits = this.grid.queryCircle(this.enemies, orb.x, orb.y, orb.r + 8);
      for (let k = 0; k < hits.length; k++) {
        const e = hits[k];
        const last = orb.hitCooldowns.get(e.uid) || -10;
        if (this.runTime - last < 0.30) continue;
        orb.hitCooldowns.set(e.uid, this.runTime);
        this.damageEnemy(e, dmg, p.x, p.y, 195 * this.stats.knockback, false, '#8CE8FF', pw);
        FX.burst(orb.x, orb.y, '#FFFFFF', 4, 120, 4.5, 'circle', false);
      }
      this.hitPropsInCircle(orb.x, orb.y, orb.r, dmg);

      // ★ Evolved Holy Pigeon King shoots piercing golden feather-blades outward!
      if (isEvo) {
        orb.featherTimer -= dt;
        if (orb.featherTimer <= 0) {
          orb.featherTimer = 0.32;
          const fa = orb.angle + 0.35;
          this.projectiles.push({
            kind: 'magic_bolt',
            weapon: pw,
            isEvo: true,
            x: orb.x,
            y: orb.y,
            vx: Math.cos(fa) * 580,
            vy: Math.sin(fa) * 580,
            speed: 580,
            r: 9.5,
            dmg: dmg * 0.92,
            bounceLeft: 0,
            pierceLeft: 2,
            knockback: 90,
            color: '#FFE66D',
            hitSet: new Set(),
            life: 0,
            maxLife: 1.15
          });
        }
      }
    }
  }

  checkOrbitalBlock(bx, by, br) {
    for (let i = 0; i < this.orbitals.length; i++) {
      const o = this.orbitals[i];
      const rr = o.r + br + 4;
      if (distSq(bx, by, o.x, o.y) <= rr * rr) return true;
    }
    return false;
  }

  _updateProjectiles(dt) {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life += dt;
      if (pr.life >= pr.maxLife) {
        if (pr.kind === 'blackhole_boba') this._detonateBlackholeBoba(pr);
        swapPop(this.projectiles, i);
        continue;
      }

      if (pr.kind === 'boomerang_wok') {
        pr.rot += dt * 15;
        // Outward for first 0.52s, then accelerate back toward hero!
        if (pr.life > 0.52) {
          const dx = p.x - pr.x;
          const dy = p.y - pr.y;
          const d = Math.hypot(dx, dy) || 1;
          pr.vx = lerp(pr.vx, (dx / d) * pr.speed * 1.35, Math.min(1, dt * 6.5));
          pr.vy = lerp(pr.vy, (dy / d) * pr.speed * 1.35, Math.min(1, dt * 6.5));
          if (pr.life > 0.85 && d < 32) {
            swapPop(this.projectiles, i);
            continue;
          }
        }
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        // Evolved Flaming Wok drops scorching chili-oil fire trail!
        if (pr.isEvo) {
          pr.dropTimer -= dt;
          if (pr.dropTimer <= 0) {
            pr.dropTimer = 0.14;
            this.zones.push({
              kind: 'chili_fire',
              weapon: pr.weapon,
              x: pr.x,
              y: pr.y,
              r: 36 * this.stats.area,
              dmg: pr.dmg * 0.34,
              slow: 1,
              color: '#FF5E2E',
              tickTimer: 0.2,
              life: 0,
              maxLife: 1.7
            });
          }
        }

        const hits = this.grid.queryCircle(this.enemies, pr.x, pr.y, pr.r);
        for (let k = 0; k < hits.length; k++) {
          const e = hits[k];
          const last = pr.hitCooldowns.get(e.uid) || -10;
          if (this.runTime - last < 0.34) continue;
          pr.hitCooldowns.set(e.uid, this.runTime);
          SFX.play('wok');
          FX.directionalSparks(e.x, e.y, Math.atan2(pr.vy, pr.vx), '#FFE082', 5, 210);
          const forceCrit = Math.random() < (this.stats.crit + pr.extraCrit);
          this.damageEnemy(e, pr.dmg, pr.x, pr.y, pr.knockback, forceCrit, '#FF9F2E', pr.weapon);
        }
        this.hitPropsInCircle(pr.x, pr.y, pr.r, pr.dmg);
        continue;
      }

      // Standard movement
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // ★ Evolved Blackhole Boba pulls nearby monsters inward as it flies!
      if (pr.kind === 'blackhole_boba') {
        pr.vortexTick -= dt;
        if (pr.vortexTick <= 0) {
          pr.vortexTick = 0.16;
          const pullR = pr.puddleR * 1.15;
          const pulled = this.grid.queryCircle(this.enemies, pr.x, pr.y, pullR);
          for (let k = 0; k < pulled.length; k++) {
            const e = pulled[k];
            if (!e.isBoss) {
              e.x = lerp(e.x, pr.x, 0.24);
              e.y = lerp(e.y, pr.y, 0.24);
            }
            this.damageEnemy(e, pr.dmg * 0.20, pr.x, pr.y, 0, false, '#D946EF', pr.weapon, true);
          }
        }
        continue;
      }

      // Hit check for bolts, talismans, boba pearls
      const hits = this.grid.queryCircle(this.enemies, pr.x, pr.y, pr.r + 4);
      this.hitPropsInCircle(pr.x, pr.y, pr.r + 6, pr.dmg);

      let consumed = false;
      for (let k = 0; k < hits.length; k++) {
        const e = hits[k];
        if (pr.hitSet.has(e.uid)) continue;
        pr.hitSet.add(e.uid);

        this.damageEnemy(e, pr.dmg, pr.x, pr.y, pr.knockback, false, pr.color || '#FFE066', pr.weapon);

        if (pr.kind === 'talisman') {
          // Talisman AoE static burst!
          SFX.play('zap');
          FX.addRing(pr.x, pr.y, 6, pr.blastR, pr.isEvo ? '#4DFFF3' : '#FFE14D', 0.22, 5, true);
          const splash = this.grid.queryCircle(this.enemies, pr.x, pr.y, pr.blastR);
          for (let s = 0; s < splash.length; s++) {
            const se = splash[s];
            if (se !== e) this.damageEnemy(se, pr.dmg * 0.65, pr.x, pr.y, 90, false, '#4DFFF3', pr.weapon, true);
          }
        } else if (pr.kind === 'boba_pearl' && pr.spawnPuddle !== false) {
          // Splat brown-sugar slow puddle!
          this.zones.push({
            kind: 'boba_puddle',
            weapon: pr.weapon,
            x: pr.x,
            y: pr.y,
            r: pr.puddleR,
            dmg: pr.dmg * 0.18,
            slow: 0.62,
            color: '#9C5221',
            tickTimer: 0.28,
            life: 0,
            maxLife: 1.9 * this.stats.duration
          });
        }

        if (pr.bounceLeft > 0) {
          pr.bounceLeft--;
          const nextE = this.grid.findNearest(this.enemies, pr.x, pr.y, 290, pr.hitSet);
          if (nextE) {
            const ba = Math.atan2(nextE.y - pr.y, nextE.x - pr.x);
            pr.vx = Math.cos(ba) * pr.speed;
            pr.vy = Math.sin(ba) * pr.speed;
            FX.directionalSparks(pr.x, pr.y, ba, pr.color, 4, 180);
            break;
          }
        }

        if (pr.pierceLeft > 0) {
          pr.pierceLeft--;
        } else {
          consumed = true;
          break;
        }
      }

      if (consumed) {
        swapPop(this.projectiles, i);
      }
    }
  }

  _detonateBlackholeBoba(pr) {
    SFX.play('explode');
    FX.addShake(0.28);
    FX.addRing(pr.x, pr.y, 12, pr.puddleR * 1.25, '#E879F9', 0.35, 9, true);
    FX.burst(pr.x, pr.y, '#F0ABFC', 14, 240, 7.5, 'circle', true);
    const targets = this.grid.queryCircle(this.enemies, pr.x, pr.y, pr.puddleR * 1.25);
    for (let i = 0; i < targets.length; i++) {
      this.damageEnemy(targets[i], pr.dmg * 1.25, pr.x, pr.y, 240, false, '#F0ABFC', pr.weapon);
    }
  }

  _updateFallingDrops(dt) {
    for (let i = this.fallingDrops.length - 1; i >= 0; i--) {
      const d = this.fallingDrops[i];
      d.z -= d.vz * dt;
      if (d.z <= 0) {
        SFX.play('keyboom');
        FX.addShake(d.isEvo ? 0.35 : 0.18);
        const col = d.isEvo ? '#FFD84D' : '#5CE1E6';
        FX.addRing(d.x, d.y, 10, d.blastR, col, 0.32, d.isEvo ? 9 : 6, true);
        FX.burst(d.x, d.y, '#FF5CA8', 10, 210, 6.5, 'star', true);

        const hits = this.grid.queryCircle(this.enemies, d.x, d.y, d.blastR);
        for (let k = 0; k < hits.length; k++) {
          this.damageEnemy(hits[k], d.dmg, d.x, d.y, 220 * this.stats.knockback, false, col, d.weapon);
        }
        this.hitPropsInCircle(d.x, d.y, d.blastR, d.dmg);

        // ★ Evolved Giant ENTER Key fractures into 4 mini RGB keycap cluster bombs!
        if (d.isEvo && !d.isCluster) {
          for (let c = 0; c < 4; c++) {
            const ca = (c / 4) * TAU + rand(-0.3, 0.3);
            this.fallingDrops.push({
              weapon: d.weapon,
              isEvo: false,
              isCluster: true,
              label: ['R', 'G', 'B', '!'][c],
              x: d.x + Math.cos(ca) * 95,
              y: d.y + Math.sin(ca) * 95,
              z: 150,
              vz: 620,
              blastR: d.blastR * 0.60,
              dmg: d.dmg * 0.34
            });
          }
        }
        swapPop(this.fallingDrops, i);
      }
    }
  }

  _updateMines(dt) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      if (!m.landed) {
        m.flightT += dt;
        const p = Math.min(1, m.flightT / m.flightDur);
        m.curX = lerp(m.x, m.tx, p);
        m.curY = lerp(m.y, m.ty, p) - Math.sin(p * Math.PI) * 52;
        if (p >= 1) {
          m.landed = true;
          m.x = m.tx;
          m.y = m.ty;
        }
        continue;
      }

      // ★ Evolved Rubber Chickens sprint directly toward nearest monster!
      if (m.isEvo) {
        const target = this.grid.findNearest(this.enemies, m.x, m.y, 340);
        if (target) {
          const a = Math.atan2(target.y - m.y, target.x - m.x);
          m.x += Math.cos(a) * 240 * dt;
          m.y += Math.sin(a) * 240 * dt;
        }
      }

      m.armTimer -= dt;
      const triggerHits = this.grid.queryCircle(this.enemies, m.x, m.y, 28);
      if (triggerHits.length > 0 || m.armTimer <= 0) {
        SFX.play('chicken');
        FX.addRing(m.x, m.y, 10, m.blastR, '#FFE033', 0.34, 8, true);
        if (m.isEvo) {
          FX.addRing(m.x, m.y, 18, m.blastR * 1.25, '#FF5733', 0.42, 6, true);
        }
        FX.burst(m.x, m.y, '#FFE033', 10, 195, 6, 'star', true);
        FX.addText(m.x, m.y - 24, t('喔——!!', 'SQUAWK!!'), '#FFE033', false, 1.05);

        const hits = this.grid.queryCircle(this.enemies, m.x, m.y, m.blastR);
        for (let k = 0; k < hits.length; k++) {
          const e = hits[k];
          e.stunTimer = Math.max(e.stunTimer, m.stun);
          this.damageEnemy(e, m.dmg, m.x, m.y, 210 * this.stats.knockback, false, '#FFE033', m.weapon);
        }
        this.hitPropsInCircle(m.x, m.y, m.blastR, m.dmg);
        swapPop(this.mines, i);
      }
    }
  }

  _updateZones(dt) {
    if (this.zones.length > 55) this.zones.splice(0, this.zones.length - 55);
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.life += dt;
      if (z.life >= z.maxLife) {
        swapPop(this.zones, i);
        continue;
      }
      z.tickTimer -= dt;
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.28;
        const hits = this.grid.queryCircle(this.enemies, z.x, z.y, z.r);
        for (let k = 0; k < hits.length; k++) {
          const e = hits[k];
          if (z.slow < 1) {
            e.slowTimer = 0.5;
            e.slowFactor = Math.min(e.slowFactor, z.slow);
          }
          this.damageEnemy(e, z.dmg, z.x, z.y, 12, false, z.color, z.weapon, true);
        }
      }
    }
  }

  hitPropsInCircle(x, y, r, dmg) {
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      if (pr.dead) continue;
      const rr = r + pr.radius;
      if (distSq(x, y, pr.x, pr.y) <= rr * rr) {
        pr.hp -= dmg;
        pr.flashTimer = 0.08;
        pr.squashX = 1.25;
        pr.squashY = 0.78;
        if (pr.hp <= 0) {
          pr.dead = true;
          SFX.play('pop');
          FX.burst(pr.x, pr.y, '#E09952', 9, 170, 6, 'circle', false);
          // Drop exciting loot!
          const roll = Math.random();
          if (roll < 0.28) spawnPickup(this, pr.x, pr.y, 'chicken_leg', 38);
          else if (roll < 0.42) spawnPickup(this, pr.x, pr.y, 'magnet', 1);
          else if (roll < 0.54) spawnPickup(this, pr.x, pr.y, 'chili', 1);
          else if (roll < 0.65) spawnPickup(this, pr.x, pr.y, 'clock', 1);
          else {
            spawnPickup(this, pr.x, pr.y, 'coin', randInt(8, 16));
            spawnPickup(this, pr.x, pr.y, 'coin', randInt(6, 12));
          }
          swapPop(this.props, i);
        }
      }
    }
  }

  _updatePropsAndShrines(dt) {
    const p = this.player;
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      if (pr.flashTimer > 0) pr.flashTimer -= dt;
      pr.squashX = lerp(pr.squashX, 1, Math.min(1, dt * 14));
      pr.squashY = lerp(pr.squashY, 1, Math.min(1, dt * 14));
      if (distSq(pr.x, pr.y, p.x, p.y) > 1500 * 1500) {
        swapPop(this.props, i);
      }
    }

    for (let i = this.shrines.length - 1; i >= 0; i--) {
      const sh = this.shrines[i];
      if (sh.used) {
        swapPop(this.shrines, i);
        continue;
      }
      if (distSq(sh.x, sh.y, p.x, p.y) <= sh.radius * sh.radius) {
        sh.progress += dt / 2.2;
        if (sh.progress >= 1) {
          sh.used = true;
          this._triggerShrine(sh);
          swapPop(this.shrines, i);
        }
      } else {
        sh.progress = Math.max(0, sh.progress - dt * 0.4);
      }
    }
  }

  _triggerShrine(sh) {
    const p = this.player;
    FX.addShake(0.45);
    FX.addRing(sh.x, sh.y, 15, 220, sh.color, 0.48, 10, true);
    SFX.play('heal');

    if (sh.kind === 'tea') {
      p.hp = Math.min(this.stats.maxHp, p.hp + this.stats.maxHp * 0.45);
      p.invulnTimer = Math.max(p.invulnTimer, 4.0);
      for (let i = 0; i < 4; i++) spawnPickup(this, sh.x, sh.y, 'coin', 10);
      this.pushBanner(
        t(
          '☕ 带薪摸鱼成功！恢复 45% 生命并获得 4秒 金身护盾！',
          '☕ Paid Break Complete! Restored 45% HP + 4s Invulnerable Shield!'
        ),
        '#47FF9C'
      );
    } else if (sh.kind === 'challenge') {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        const e = createEnemy(this, 'clock_knight', sh.x + Math.cos(a) * 190, sh.y + Math.sin(a) * 190, {
          isElite: true,
          dropsChest: i === 0
        });
        this.enemies.push(e);
      }
      this.pushBanner(
        t(
          '⚔️ 加急试炼开启！击败精英发条小队夺取黄金宝箱！',
          '⚔️ Urgent Trial Started! Defeat the Elite Clockwork Squad for a Golden Chest!'
        ),
        '#FF5263'
      );
    } else if (sh.kind === 'gacha') {
      this.feverGauge = 100;
      this.activateFever();
      this.spicyTimer = 7.0;
      for (const g of this.gems) {
        g.magnetized = true;
        g.kickTimer = 0.08;
      }
      this.pushBanner(
        t(
          '🎰 欧皇大奖！触发全屏磁力吸金 + 狂热暴走！',
          '🎰 GACHA JACKPOT! Full-Screen Magnet + Fever Overload!'
        ),
        '#FFD84D'
      );
    } else if (sh.kind === 'anvil') {
      p.hp = Math.min(this.stats.maxHp, p.hp + this.stats.maxHp * 0.30);
      const evos = this.getEvolvableWeapons();
      if (evos.length > 0) {
        const w = evos[0];
        this.evolveWeapon(w);
        const wDef = WEAPONS[w.id];
        this.pushBanner(
          t(
            `🔨 欧皇铁砧神迹！【★${wDef.evoName}】直接锻造觉醒！`,
            `🔨 ANVIL MIRACLE! [★ ${wDef.evoNameEn}] forged & awakened!`
          ),
          '#FFD84D'
        );
      } else {
        const upgradable = this.weapons.filter((w) => !w.evolved && w.level < 5);
        if (upgradable.length > 0) {
          const targetW = pick(upgradable);
          this.addWeapon(targetW.id);
          const wDef = WEAPONS[targetW.id];
          SFX.play('evo');
          this.pushBanner(
            t(
              `🔨 欧皇铁砧锻造！【${wDef.name}】免费升至 Lv.${targetW.level}！`,
              `🔨 Sacred Anvil! [${wDef.nameEn}] forged to Lv.${targetW.level}!`
            ),
            '#63F5FF'
          );
        } else {
          this.stats.might *= 1.15;
          for (let i = 0; i < 4; i++) spawnPickup(this, sh.x, sh.y, 'coin', 12);
          this.pushBanner(
            t('🔨 神匠淬火！全武器伤害永久 +15%！', '🔨 Masterwork Temper! All Weapon Damage +15%!'),
            '#63F5FF'
          );
        }
      }
      UI.updateHUD(true);
    }
  }

  _updateGemsAndPickups(dt) {
    const p = this.player;
    const magR = this.stats.magnet * (this.feverTimer > 0 ? 1.55 : 1.0);
    const magRSq = magR * magR;

    // 1. XP Gems with Outward-Kick Anticipation Curve!
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d2 = dx * dx + dy * dy;

      if (!g.magnetized) {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.vx *= Math.exp(-7 * dt);
        g.vy *= Math.exp(-7 * dt);
        if (d2 <= magRSq) {
          g.magnetized = true;
          g.kickTimer = 0.085;
          const d = Math.sqrt(d2) || 1;
          g.vx = -(dx / d) * 165;
          g.vy = -(dy / d) * 165;
        }
      } else {
        if (g.kickTimer > 0) {
          g.kickTimer -= dt;
          g.x += g.vx * dt;
          g.y += g.vy * dt;
        } else {
          const d = Math.sqrt(d2) || 1;
          const pullSpd = 660;
          g.x += (dx / d) * pullSpd * dt;
          g.y += (dy / d) * pullSpd * dt;
          if (d < 26) {
            this.gainXp(g.val);
            SFX.play('xp');
            swapPop(this.gems, i);
          }
        }
      }
    }

    // 2. Pickups & Boss Treasure Chests
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.life += dt;
      pk.x += pk.vx * dt;
      pk.y += pk.vy * dt;
      pk.vx *= Math.exp(-7 * dt);
      pk.vy *= Math.exp(-7 * dt);

      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const d2 = dx * dx + dy * dy;

      if (pk.kind === 'chest') {
        // Gentle magnetic pull on nearby Treasure Chests so players don't miss them in chaos!
        if (d2 <= 145 * 145) {
          const d = Math.sqrt(d2) || 1;
          pk.x += (dx / d) * 260 * dt;
          pk.y += (dy / d) * 260 * dt;
        }
      } else if (pk.magnetized || d2 <= magRSq) {
        pk.magnetized = true;
        const d = Math.sqrt(d2) || 1;
        pk.x += (dx / d) * 580 * dt;
        pk.y += (dy / d) * 580 * dt;
      }

      const touchR = pk.kind === 'chest' ? 42 : 30;
      if (d2 <= touchR * touchR) {
        this._collectPickup(pk);
        swapPop(this.pickups, i);
      }
    }
  }

  _collectPickup(pk) {
    const p = this.player;
    switch (pk.kind) {
      case 'coin': {
        const amt = Math.max(1, Math.round(pk.val * this.stats.goldMult));
        this.goldEarned += amt;
        UI.addGold(amt);
        SFX.play('coin');
        FX.addText(p.x, p.y - 26, `+${amt}💰`, '#FFE047', false, 0.95);
        break;
      }
      case 'chicken_leg':
        p.hp = Math.min(this.stats.maxHp, p.hp + pk.val);
        SFX.play('heal');
        FX.addText(p.x, p.y - 28, `🍗 +${pk.val} HP`, '#6BFF95', true, 1.05);
        break;

      case 'magnet':
        SFX.play('evo');
        FX.addRing(p.x, p.y, 20, 360, '#63F5FF', 0.5, 8, true);
        FX.addText(p.x, p.y - 34, t('🧲 全屏吸星大法!!', '🧲 MEGA MAGNET!!'), '#63F5FF', true, 1.25);
        for (const g of this.gems) {
          g.magnetized = true;
          g.kickTimer = 0.08;
        }
        break;

      case 'clock':
        this.freezeTimer = 5.0;
        SFX.play('magic');
        FX.flashScreen('#7CE8FF', 0.30);
        FX.addText(p.x, p.y - 34, t('❄️ 时间静止 5秒!!', '❄️ TIME FREEZE 5s!!'), '#7CE8FF', true, 1.25);
        break;

      case 'chili':
        this.spicyTimer = 6.5;
        SFX.play('explode');
        FX.addText(p.x, p.y - 34, t('🌶️ 爆辣喷火狂飙!!', '🌶️ SPICY FIREBREATH!!'), '#FF4757', true, 1.25);
        break;

      case 'chest':
        this.chestsOpened++;
        UI.openChestModal();
        break;
    }
  }

  gainXp(rawVal) {
    const p = this.player;
    p.xp += rawVal * this.stats.xpMult;
    this.feverGauge = Math.min(100, this.feverGauge + rawVal * 0.55);

    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.round(10 + p.level * 7 + Math.pow(p.level, 1.42) * 2.1);
      this.pendingLevelUps++;

      SFX.play('levelup');
      FX.addRing(p.x, p.y, 14, 155, '#FFD84D', 0.42, 8, true);
      FX.addText(p.x, p.y - 40, callout('levelUp'), '#FFD84D', true, 1.3);

      if (p.level >= 25) UI.unlockAchievement('level_25');
    }
  }

  // ============================================================================
  // Combat Resolution: Damage Enemy & Damage Player
  // ============================================================================
  damageEnemy(e, rawDmg, srcX, srcY, knockback = 120, forceCrit = false, fxColor = '#FFFFFF', weaponInst = null, isDoT = false) {
    if (!e || e.dead) return 0;

    const isCrit = forceCrit || (!isDoT && Math.random() < this.stats.crit);
    const weakMult = e.weakenTimer > 0 ? 1.15 : 1.0;
    const dmg = Math.max(1, Math.round(rawDmg * weakMult * (isCrit ? this.stats.critDmg : 1.0) * rand(0.94, 1.06)));

    e.hp -= dmg;
    e.flashTimer = 0.075;
    e.squashX = 1.28;
    e.squashY = 0.74;

    if (weaponInst) weaponInst.totalDmg += dmg;

    // Knockback impulse
    if (knockback !== 0) {
      const dx = e.x - srcX;
      const dy = e.y - srcY;
      const d = Math.hypot(dx, dy) || 1;
      const resist = e.weakenTimer > 0 ? e.knockResist * 0.5 : e.knockResist;
      const kb = knockback * Math.max(0.06, 1 - resist);
      e.kx = (dx / d) * kb;
      e.ky = (dy / d) * kb;
    }

    if (!isDoT) {
      SFX.play(isCrit ? 'crit' : 'hit');
      if (isCrit && dmg >= 65) FX.triggerHitStop(0.025, this.runTime);
      FX.spawnParticle({
        x: e.x + rand(-8, 8),
        y: e.y + rand(-8, 8),
        vx: rand(-110, 110),
        vy: rand(-110, 110),
        size: isCrit ? 7 : 4.8,
        color: isCrit ? '#FFE047' : fxColor,
        maxLife: 0.22,
        shape: isCrit ? 'star' : 'circle',
        additive: true,
        outlined: false
      });
    }

    if (!isDoT || (this.frameCount % 3 === 0)) {
      const label = isCrit ? `${dmg}!` : `${dmg}`;
      FX.addText(e.x, e.y - e.radius * 0.65, label, isCrit ? '#FFE047' : '#FFFFFF', isCrit);
      if (isCrit && Math.random() < 0.09) {
        FX.addText(e.x, e.y - e.radius - 18, callout('crit'), '#FF9F2E', true, 0.92);
      }
    }

    if (e.hp <= 0) {
      this._killEnemy(e);
    }
    return dmg;
  }

  _killEnemy(e) {
    e.dead = true;
    this.kills++;
    this.comboCount++;
    this.comboTimer = 2.8;
    UI.saveData.totalKills = (UI.saveData.totalKills || 0) + 1;
    this.feverGauge = Math.min(100, this.feverGauge + (e.isBoss ? 45 : e.isElite ? 12 : 0.85));

    // Cartoon death splat + puff!
    FX.addDecal(e.x, e.y, e.radius * 0.95, e.color);
    FX.burst(e.x, e.y, e.color, e.isBoss ? 34 : e.isElite ? 14 : 6, e.isBoss ? 310 : 165, e.isBoss ? 10 : 6.2, 'circle', false);
    SFX.play(e.isBoss ? 'explode' : 'pop');

    // Spore shroom funny death puff
    if (e.type === 'shroom') {
      FX.addRing(e.x, e.y, 6, 48, '#FF5E7E', 0.28, 4, false);
    }

    // Golden Piggy Jackpot!
    if (e.type === 'mimic_pig') {
      for (let c = 0; c < 8; c++) spawnPickup(this, e.x, e.y, 'coin', 12);
      FX.addText(e.x, e.y - 30, t('🐷 暴富大奖!!', '🐷 JACKPOT!!'), '#FFE047', true, 1.4);
      UI.unlockAchievement('rich_pig');
    }

    // XP & Gold Drops
    spawnGem(this, e.x, e.y, e.xp);
    if (Math.random() < 0.11 * this.stats.luck) {
      spawnPickup(this, e.x, e.y, 'coin', randInt(2, 5));
    }
    if (e.dropsChest) {
      spawnPickup(this, e.x, e.y, 'chest', 1);
      this.pushBanner(
        t('🎁 黄金宝箱已掉落！触碰开启豪华轮盘抽奖！', '🎁 Golden Chest dropped! Touch it to spin the roulette!'),
        '#FFD84D'
      );
    }

    // Achievements check
    if (UI.saveData.totalKills >= 100) UI.unlockAchievement('first_blood');
    if (this.kills >= 1000) UI.unlockAchievement('slayer_1000');

    if (e.isBoss) {
      if (this.activeBoss === e) this.activeBoss = null;
      SFX.setBgmMode(this.feverTimer > 0 ? 'fever' : 'normal');
      FX.addShake(0.85);
      FX.flashScreen('#FFD84D', 0.5);
      FX.triggerHitStop(0.06, this.runTime);
      FX.addRing(e.x, e.y, 20, 340, '#FFD84D', 0.65, 14, true);
      FX.addText(e.x, e.y - 45, callout('killBoss'), '#FFE047', true, 1.5);

      if (e.type === 'boss_jelly') UI.unlockAchievement('first_boss');
      for (let c = 0; c < 6; c++) spawnPickup(this, e.x, e.y, 'coin', 15);
      spawnPickup(this, e.x, e.y - 25, 'chicken_leg', 55);
      // Magnetize nearby XP gems on boss victory for an instant celebratory shower!
      for (const g of this.gems) {
        if (distSq(g.x, g.y, this.player.x, this.player.y) < 620 * 620) {
          g.magnetized = true;
          g.kickTimer = 0.08;
        }
      }

      if (e.isFinal && !this.endlessMode) {
        UI.unlockAchievement('beat_monday');
        this.scheduleAction(1.15, () => {
          this.victory = true;
          this.paused = true;
          UI.openEndModal(true);
        });
      }
    }
  }

  damagePlayer(rawDmg, srcX, srcY) {
    const p = this.player;
    if (p.invulnTimer > 0 || this.gameOver) return;

    const reduced = Math.max(1, Math.round(rawDmg - this.stats.armor));
    p.hp -= reduced;
    p.invulnTimer = 0.58;
    p.flashTimer = 0.16;
    p.squashX = 1.32;
    p.squashY = 0.72;

    SFX.play('hurt');
    FX.addShake(0.45);
    FX.flashScreen('#FF2E4C', 0.28);
    FX.addText(p.x, p.y - 30, `-${reduced} ${callout('hurt')}`, '#FF5263', true, 1.1);

    if (p.hp <= 0) {
      if (this.revivesLeft > 0) {
        this.revivesLeft--;
        p.hp = this.stats.maxHp;
        p.invulnTimer = 2.6;
        SFX.play('evo');
        FX.flashScreen('#FFD84D', 0.6);
        FX.addRing(p.x, p.y, 15, 340, '#FFD84D', 0.55, 14, true);
        FX.addText(p.x, p.y - 44, t('💫 仰卧起坐满血复活!!', '💫 REVIVED AT 100% HP!!'), '#FFE047', true, 1.45);
        const near = this.grid.queryCircle(this.enemies, p.x, p.y, 280);
        for (const e of near) {
          this.damageEnemy(e, 180, p.x, p.y, 480, true, '#FFD84D');
        }
      } else {
        p.hp = 0;
        this.gameOver = true;
        this.paused = true;
        SFX.stopBgm();
        UI.openEndModal(false);
      }
    }
  }

  pushBanner(msg, color = '#FFD84D') {
    UI.showToastBanner(msg, color);
  }

  showBossAlert(boss) {
    UI.showBossAlert(boss);
  }

  // ============================================================================
  // High-DPI Layered Cartoon Renderer
  // ============================================================================
  render() {
    const ctx = this.ctx;
    const W = this.viewW;
    const H = this.viewH;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    if (!this.running || !this.player) {
      // Cozy animated menu backdrop
      this._renderMenuBackdrop(ctx, W, H);
      ctx.restore();
      return;
    }

    const camL = this.camX - W * 0.5 + FX.shakeX;
    const camT = this.camY - H * 0.5 + FX.shakeY;
    const camR = camL + W;
    const camB = camT + H;

    // 1. Seamless Hand-Painted Arena Ground Tile
    const tile = SPRITES.groundTile;
    const ts = 512;
    const startX = Math.floor(camL / ts) * ts;
    const startY = Math.floor(camT / ts) * ts;

    ctx.save();
    ctx.translate(-camL, -camT);

    for (let gx = startX; gx < camR + ts; gx += ts) {
      for (let gy = startY; gy < camB + ts; gy += ts) {
        ctx.drawImage(tile, gx, gy, ts, ts);
      }
    }

    // 2. Ground Splat Decals, Procedural World Landmarks & Hazard Zones
    FX.renderDecals(ctx, camL, camT, camR, camB);
    this._renderLandmarks(ctx, camL, camT, camR, camB);
    this._renderZones(ctx, camL, camT, camR, camB);
    this._renderAuraWeapons(ctx);
    this._renderShrines(ctx, camL, camT, camR, camB);
    this._renderTelegraphs(ctx);

    // 3. Batch Ground Contact Shadows (1 fast fill pass!)
    this._renderShadows(ctx, camL, camT, camR, camB);

    // 4. Gems, Pickups & Props
    this._renderGemsAndPickups(ctx, camL, camT, camR, camB);
    this._renderPropsAndMines(ctx, camL, camT, camR, camB);

    // 5. Ghost Dash Afterimages, Enemies, Player & Orbitals
    FX.renderGhosts(ctx);
    this._renderEnemies(ctx, camL, camT, camR, camB);
    this._renderPlayer(ctx);
    this._renderOrbitals(ctx);

    // 6. Projectiles, Enemy Bullets & Skyfall Keycaps
    this._renderProjectiles(ctx, camL, camT, camR, camB);
    this._renderFallingDrops(ctx);

    // 7. Additive Slash Waves, Shockwaves, Lasers, Particles & Comic Popups
    FX.renderVFX(ctx, camL, camT, camR, camB);

    // 8. Ambient Magical Fireflies
    this._renderFireflies(ctx);

    ctx.restore(); // End world-space camera transform

    // 9. Screen-Space Overlays: Off-screen Compass Arrows, Vignette, Freeze/Fever FX, Virtual Joystick
    this._renderCompassIndicators(ctx, W, H, camL, camT);
    this._renderAtmosphereOverlays(ctx, W, H);

    ctx.restore();
  }

  _renderMenuBackdrop(ctx, W, H) {
    const t = performance.now() * 0.001;
    const tile = SPRITES.groundTile;
    if (tile) {
      const ox = (t * 42) % 512;
      const oy = (t * 16) % 512;
      for (let x = -512; x < W + 512; x += 512) {
        for (let y = -512; y < H + 512; y += 512) {
          ctx.drawImage(tile, x - ox, y - oy, 512, 512);
        }
      }
    } else {
      ctx.fillStyle = '#1B2838';
      ctx.fillRect(0, 0, W, H);
    }

    // Live Attract-Mode Cartoon Parade: Our 4 Chibi Heroes chasing Slimes & Golden Piggy!
    const paradeY = H * 0.76;
    const loopW = W + 420;
    const baseX = ((t * 115) % loopW) - 210;
    const frame = ((t * 7) | 0) & 1;

    // Warm lanterns in background
    if (SPRITES.props.lantern) {
      for (let lx = 180; lx < W; lx += 380) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 + Math.sin(t * 4 + lx) * 0.08;
        ctx.drawImage(SPRITES.glows.warm, lx - 65, paradeY - 125, 150, 150);
        ctx.restore();
        ctx.drawImage(SPRITES.props.lantern, lx - 32, paradeY - 110, 64, 96);
      }
    }

    // Fleeing Golden Piggy + Slimes ahead of heroes!
    const pigBank = SPRITES.enemies.mimic_pig;
    const slimeBank = SPRITES.enemies.slime;
    if (pigBank && slimeBank) {
      const px = baseX + 260;
      const hop = Math.abs(Math.sin(t * 11)) * 7;
      ctx.drawImage(pigBank.frames[frame], px - 34, paradeY - 40 - hop, 68, 68);
      ctx.drawImage(slimeBank.frames[frame], px + 65 - 34, paradeY - 28 - hop * 0.7, 68, 68);
    }

    // Chasing Heroes!
    const heroOrder = ['knight', 'witch', 'goose', 'shiba'];
    for (let i = 0; i < heroOrder.length; i++) {
      const hb = SPRITES.heroes[heroOrder[i]];
      if (!hb) continue;
      const hx = baseX - i * 82;
      const hop = Math.abs(Math.sin(t * 10 + i)) * 6;
      ctx.drawImage(hb.frames[(frame + i) & 1], hx - 42, paradeY - 52 - hop, 84, 88);
    }

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.1, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(18,14,34,0.32)');
    vg.addColorStop(1, 'rgba(12,9,24,0.82)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  _renderLandmarks(ctx, l, t, r, b) {
    const cell = 620;
    const cx0 = Math.floor(l / cell) - 1;
    const cx1 = Math.floor(r / cell) + 1;
    const cy0 = Math.floor(t / cell) - 1;
    const cy1 = Math.floor(b / cell) + 1;
    const signs = isEn()
      ? ['NO HUSTLE', 'SLACK ZONE', 'BEWARE GOOSE', 'BAN MONDAY', 'HYDRATE!']
      : ['禁止内卷', '摸鱼圣地', '小心恶鹅', '周一退散', '多喝热水'];

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        // Deterministic integer hash per sector
        const h = Math.abs((cx * 92837111) ^ (cy * 689287499));
        const kind = h % 5;
        if (kind >= 3) continue; // Keep arena open & uncluttered!

        const wx = cx * cell + 140 + (h % 340);
        const wy = cy * cell + 140 + ((h >> 9) % 340);
        if (wx < l - 100 || wx > r + 100 || wy < t - 100 || wy > b + 100) continue;

        if (kind === 0 && SPRITES.props.lantern) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.42 + Math.sin(this.runTime * 4 + h) * 0.06;
          ctx.drawImage(SPRITES.glows.warm, wx - 56, wy - 96, 148, 148);
          ctx.restore();
          ctx.drawImage(SPRITES.props.lantern, wx - 32, wy - 84, 64, 96);
        } else if (kind === 1 && SPRITES.props.signpost) {
          ctx.drawImage(SPRITES.props.signpost, wx - 38, wy - 60, 76, 72);
          ctx.save();
          ctx.translate(wx, wy - 30);
          ctx.rotate(-0.06);
          ctx.fillStyle = INK;
          ctx.font = '900 10px "PingFang SC", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(signs[h % signs.length], 0, 3);
          ctx.restore();
        } else if (kind === 2 && SPRITES.props.glow_shroom) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.30;
          ctx.drawImage(SPRITES.glows.cyan, wx - 42, wy - 52, 84, 84);
          ctx.restore();
          ctx.drawImage(SPRITES.props.glow_shroom, wx - 28, wy - 42, 56, 52);
        }
      }
    }
  }

  _renderZones(ctx, l, t, r, b) {
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (z.x + z.r < l || z.x - z.r > r || z.y + z.r < t || z.y - z.r > b) continue;
      const alpha = (1 - z.life / z.maxLife) * 0.48;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    }
  }

  _renderAuraWeapons(ctx) {
    const da = this.weapons.find((w) => w.id === 'durian_aura');
    if (!da) return;
    const p = this.player;
    const isEvo = da.evolved;
    const rad = (da._visualRadius || (isEvo ? 168 : 90) * this.stats.area) * (1 + da._pulseAnim * 0.06);

    ctx.save();
    ctx.translate(p.x, p.y);
    const g = ctx.createRadialGradient(0, 0, rad * 0.25, 0, 0, rad);
    g.addColorStop(0, isEvo ? 'rgba(217,70,239,0.06)' : 'rgba(168,255,62,0.05)');
    g.addColorStop(0.8, isEvo ? 'rgba(217,70,239,0.22)' : 'rgba(168,255,62,0.20)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = isEvo ? 'rgba(240,171,252,0.65)' : 'rgba(190,255,90,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.rotate(this.runTime * (isEvo ? 1.8 : 1.0));
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.92, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // ★ Evolved Talisman Rotating Bagua Array under feet!
    const tal = this.weapons.find((w) => w.id === 'talisman' && w.evolved);
    if (tal) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-this.runTime * 2.2);
      ctx.strokeStyle = 'rgba(77,255,243,0.68)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        const px = Math.cos(a) * 68;
        const py = Math.sin(a) * 68;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  _renderShrines(ctx, l, t, r, b) {
    for (let i = 0; i < this.shrines.length; i++) {
      const sh = this.shrines[i];
      if (sh.x + sh.radius < l || sh.x - sh.radius > r || sh.y + sh.radius < t || sh.y - sh.radius > b) continue;

      ctx.save();
      ctx.translate(sh.x, sh.y);

      // Outer magic circle
      ctx.fillStyle = sh.color + '24';
      ctx.beginPath();
      ctx.arc(0, 0, sh.radius, 0, TAU);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = sh.color + '88';
      ctx.stroke();

      // Activation fill arc
      if (sh.progress > 0) {
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, sh.radius - 4, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * sh.progress);
        ctx.stroke();
      }

      // Floating shrine totem center
      const bob = Math.sin(this.runTime * 4) * 5;
      roundRectPath(ctx, -18, -26 + bob, 36, 40, 10);
      fillStroke(ctx, sh.color, 3.4);

      const shLabel = L(sh, 'name');
      ctx.font = '900 13px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.strokeText(shLabel, 0, -36 + bob);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(shLabel, 0, -36 + bob);
      ctx.restore();
    }
  }

  _renderTelegraphs(ctx) {
    for (let i = 0; i < this.telegraphs.length; i++) {
      const tg = this.telegraphs[i];
      const p = clamp(tg.t / tg.duration, 0, 1);

      ctx.save();
      if (tg.kind === 'circle') {
        ctx.fillStyle = 'rgba(255, 56, 96, 0.18)';
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.r, 0, TAU);
        ctx.fill();

        // Growing inner warning fill!
        ctx.fillStyle = 'rgba(255, 56, 96, 0.34)';
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.r * p, 0, TAU);
        ctx.fill();

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#FF3860';
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.r, 0, TAU);
        ctx.stroke();
      } else if (tg.kind === 'line') {
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 56, 96, 0.24)';
        ctx.lineWidth = tg.width;
        ctx.beginPath();
        ctx.moveTo(tg.x1, tg.y1);
        ctx.lineTo(tg.x2, tg.y2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 75, 110, 0.78)';
        ctx.lineWidth = Math.max(4, tg.width * p);
        ctx.beginPath();
        ctx.moveTo(tg.x1, tg.y1);
        ctx.lineTo(tg.x2, tg.y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _renderShadows(ctx, l, t, r, b) {
    ctx.fillStyle = 'rgba(14, 10, 26, 0.38)';
    ctx.beginPath();

    // Player shadow
    const p = this.player;
    ctx.moveTo(p.x + 20, p.y + 24);
    ctx.ellipse(p.x, p.y + 24, 20, 8, 0, 0, TAU);

    // Enemy shadows
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.x < l - 70 || e.x > r + 70 || e.y < t - 70 || e.y > b + 70) continue;
      const rx = e.radius * 0.88;
      const ry = rx * 0.42;
      const sy = e.y + e.radius * 0.78;
      ctx.moveTo(e.x + rx, sy);
      ctx.ellipse(e.x, sy, rx, ry, 0, 0, TAU);
    }
    ctx.fill();
  }

  _renderGemsAndPickups(ctx, l, t, r, b) {
    // 1. XP Gems (4 Crisp Tiers)
    for (let i = 0; i < this.gems.length; i++) {
      const g = this.gems[i];
      if (g.x < l - 24 || g.x > r + 24 || g.y < t - 24 || g.y > b + 24) continue;

      const col = g.val >= 40 ? '#FF4DFF' : g.val >= 12 ? '#FFD84D' : g.val >= 4 ? '#47FF9C' : '#5CE1E6';
      const sz = g.val >= 40 ? 9.5 : g.val >= 12 ? 8 : g.val >= 4 ? 6.8 : 5.8;

      ctx.save();
      ctx.translate(g.x, g.y + Math.sin(this.runTime * 5 + g.bobOffset) * 2);
      ctx.beginPath();
      ctx.moveTo(0, -sz * 1.25);
      ctx.lineTo(sz, 0);
      ctx.lineTo(0, sz * 1.25);
      ctx.lineTo(-sz, 0);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = INK;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-sz * 0.22, -sz * 0.3, sz * 0.26, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // 2. Pickups & Bouncy Golden Treasure Chests
    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i];
      if (pk.x < l - 50 || pk.x > r + 50 || pk.y < t - 50 || pk.y > b + 50) continue;

      const bob = Math.sin(this.runTime * 5.5 + i) * 3.5;
      if (pk.kind === 'coin') {
        ctx.save();
        ctx.translate(pk.x, pk.y + bob);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7.5 * Math.abs(Math.cos(this.runTime * 4 + i)) + 2.5, 8.5, 0, 0, TAU);
        fillStroke(ctx, '#FFD84D', 2.4);
        ctx.restore();
      } else if (pk.kind === 'chest') {
        // Golden light pillar under Boss Chest!
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(SPRITES.glows.gold, pk.x - 54, pk.y - 54, 108, 108);
        ctx.restore();
        ctx.drawImage(SPRITES.props.chest, pk.x - 32, pk.y - 30 + bob, 64, 60);
      } else {
        const sp = SPRITES.props[pk.kind];
        if (sp) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(SPRITES.glows.warm, pk.x - 28, pk.y - 28, 56, 56);
          ctx.restore();
          ctx.drawImage(sp, pk.x - 22, pk.y - 22 + bob, 44, 44);
        }
      }
    }
  }

  _renderPropsAndMines(ctx, l, t, r, b) {
    // Barrels
    for (let i = 0; i < this.props.length; i++) {
      const pr = this.props[i];
      if (pr.x < l - 40 || pr.x > r + 40 || pr.y < t - 40 || pr.y > b + 40) continue;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.scale(pr.squashX, pr.squashY);
      const img = pr.flashTimer > 0 ? SPRITES.props.barrelFlash : SPRITES.props.barrel;
      ctx.drawImage(img, -26, -30, 52, 56);
      ctx.restore();
    }

    // Rubber Chicken Mines
    const chkIcon = SPRITES.icons.rubber_chicken;
    for (let i = 0; i < this.mines.length; i++) {
      const m = this.mines[i];
      const mx = m.landed ? m.x : m.curX;
      const my = m.landed ? m.y : m.curY;
      if (mx < l - 40 || mx > r + 40 || my < t - 40 || my > b + 40) continue;

      const pulse = m.landed && m.armTimer < 0.6 ? 1 + Math.sin(this.runTime * 28) * 0.22 : 1;
      ctx.save();
      ctx.translate(mx, my);
      ctx.scale(pulse, pulse);
      ctx.rotate(m.isEvo ? Math.sin(this.runTime * 20) * 0.25 : m.rot);
      // Draw mini rubber chicken directly for clean transparency!
      ctx.beginPath();
      ctx.ellipse(0, 5, 9, 11, 0, 0, TAU);
      fillStroke(ctx, m.isEvo ? '#FF9F1C' : '#FFE033', 2.6);
      roundRectPath(ctx, -4, -14, 8, 14, 4);
      fillStroke(ctx, m.isEvo ? '#FF9F1C' : '#FFE033', 2.6);
      ctx.beginPath();
      ctx.arc(1, -5, 4.2, 0, TAU);
      fillStroke(ctx, '#FF3B4E', 2.0);
      ctx.restore();
    }
  }

  _renderEnemies(ctx, l, t, r, b) {
    const frozen = this.freezeTimer > 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const pad = e.isBoss ? 110 : 50;
      if (e.x < l - pad || e.x > r + pad || e.y < t - pad || e.y > b + pad) continue;

      const bank = e.isBoss ? SPRITES.bosses[e.type] : SPRITES.enemies[e.type];
      if (!bank) continue;
      const frameIdx = ((e.animTimer | 0) & 1);
      const img = e.flashTimer > 0 ? bank.flash : bank.frames[frameIdx];
      const lw = img.logicalW;
      const lh = img.logicalH;
      const flip = this.player.x < e.x ? -1 : 1;
      const hop = frozen ? 0 : Math.abs(Math.sin(e.animTimer * 1.6)) * (e.isBoss ? 5 : 3.5);
      const sc = e.isElite && !e.isBoss ? 1.36 : 1.0;

      ctx.save();
      ctx.translate(e.x, e.y - hop);

      // Elite Golden Aura Ring
      if (e.isElite && !e.isBoss) {
        ctx.strokeStyle = '#FFD84D';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 4, e.radius * 1.05, 0, TAU);
        ctx.stroke();
      }

      ctx.scale(flip * e.squashX * sc, e.squashY * sc);
      ctx.drawImage(img, -lw * 0.5, -lh * 0.54, lw, lh);

      // Ice cube overlay when frozen!
      if (frozen) {
        roundRectPath(ctx, -e.radius, -e.radius, e.radius * 2, e.radius * 2, 6);
        ctx.fillStyle = 'rgba(130, 240, 255, 0.42)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#E8FFFF';
        ctx.stroke();
      }
      ctx.restore();

      // Stun stars above dizzy monsters
      if (e.stunTimer > 0) {
        ctx.save();
        ctx.translate(e.x, e.y - e.radius - 12);
        for (let s = 0; s < 3; s++) {
          const sa = this.runTime * 6 + (s * TAU) / 3;
          ctx.fillStyle = '#FFE047';
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * 11, Math.sin(sa) * 4, 3.2, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      // Health bar for damaged Elites
      if (e.isElite && !e.isBoss && e.hp < e.maxHp) {
        const bw = 42;
        const bx = e.x - bw * 0.5;
        const by = e.y - e.radius - 16;
        ctx.fillStyle = '#1B142B';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
        ctx.fillStyle = '#FFD84D';
        ctx.fillRect(bx, by, bw * clamp(e.hp / e.maxHp, 0, 1), 5);
      }
    }
  }

  _renderPlayer(ctx) {
    const p = this.player;
    const bank = SPRITES.heroes[p.heroId];
    const frameIdx = p.moving ? ((p.walkAnim | 0) & 1) : 0;
    const img = p.flashTimer > 0 ? bank.flash : bank.frames[frameIdx];
    const hop = p.moving ? Math.abs(Math.sin(p.walkAnim * 1.5)) * 4.5 : Math.sin(p.walkAnim) * 1.5;
    const tilt = p.moving ? Math.sin(p.walkAnim * 1.5) * 0.06 : 0;

    // Warm Hero Spotlight / Fever Aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glowImg = this.feverTimer > 0 ? SPRITES.glows.cyan : SPRITES.glows.warm;
    ctx.globalAlpha = this.feverTimer > 0 ? 0.55 : 0.25;
    ctx.drawImage(glowImg, p.x - 68, p.y - 68, 136, 136);
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y - hop);
    ctx.rotate(tilt);

    // Invulnerability Shield Bubble (from Shrine or Revive)
    if (p.invulnTimer > 0.65) {
      ctx.strokeStyle = '#63F5FF';
      ctx.fillStyle = 'rgba(99, 245, 255, 0.16)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -4, 36, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    ctx.scale(p.facing * p.squashX, p.squashY);
    ctx.drawImage(img, -42, -50, 84, 88);
    ctx.restore();

    // Overhead miniature crisp HP bar right beneath hero feet for effortless peripheral tracking!
    const hpRatio = clamp(p.hp / this.stats.maxHp, 0, 1);
    const bw = 48;
    const bx = p.x - bw * 0.5;
    const by = p.y + 32;
    roundRectPath(ctx, bx - 2, by - 2, bw + 4, 9, 4);
    ctx.fillStyle = '#181126';
    ctx.fill();
    roundRectPath(ctx, bx, by, bw * hpRatio, 5, 2.5);
    ctx.fillStyle = hpRatio > 0.4 ? '#47FF9C' : '#FF4757';
    ctx.fill();

    // Manual Cursor Aim Reticle when in manual aim mode
    if (!this.autoAim) {
      const mx = this.input.mouseWorldX;
      const my = this.input.mouseWorldY;
      ctx.save();
      ctx.translate(mx, my);
      ctx.strokeStyle = '#63F5FF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.moveTo(-18, 0); ctx.lineTo(-8, 0);
      ctx.moveTo(8, 0); ctx.lineTo(18, 0);
      ctx.moveTo(0, -18); ctx.lineTo(0, -8);
      ctx.moveTo(0, 8); ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.restore();
    }
  }

  _renderOrbitals(ctx) {
    for (let i = 0; i < this.orbitals.length; i++) {
      const o = this.orbitals[i];
      ctx.save();
      ctx.translate(o.x, o.y);
      const col = o.isEvo ? '#FFE66D' : '#FFFFFF';
      // Cute Chubby Sunglasses Pigeon!
      ctx.beginPath();
      ctx.ellipse(0, 2, o.r * 0.82, o.r * 0.65, 0, 0, TAU);
      fillStroke(ctx, col, 2.8);
      ctx.beginPath();
      ctx.arc(o.r * 0.35, -o.r * 0.35, o.r * 0.45, 0, TAU);
      fillStroke(ctx, col, 2.8);
      // Shades
      roundRectPath(ctx, o.r * 0.15, -o.r * 0.52, o.r * 0.55, o.r * 0.28, 2);
      fillStroke(ctx, '#1E132A', 1.8);
      // Beak
      ctx.beginPath();
      ctx.moveTo(o.r * 0.75, -o.r * 0.38);
      ctx.lineTo(o.r * 1.08, -o.r * 0.26);
      ctx.lineTo(o.r * 0.75, -o.r * 0.15);
      ctx.closePath();
      fillStroke(ctx, '#FF9F1C', 2.0);
      ctx.restore();
    }
  }

  _renderProjectiles(ctx, l, t, r, b) {
    // Enemy bullets
    for (let i = 0; i < this.enemyBullets.length; i++) {
      const eb = this.enemyBullets[i];
      if (eb.x < l - 30 || eb.x > r + 30 || eb.y < t - 30 || eb.y > b + 30) continue;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.r, 0, TAU);
      fillStroke(ctx, eb.color, 2.8);
      ctx.beginPath();
      ctx.arc(eb.x - 2, eb.y - 2, eb.r * 0.4, 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    // Hero projectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      const pr = this.projectiles[i];
      if (pr.x < l - 60 || pr.x > r + 60 || pr.y < t - 60 || pr.y > b + 60) continue;

      ctx.save();
      ctx.translate(pr.x, pr.y);

      if (pr.kind === 'boomerang_wok') {
        ctx.rotate(pr.rot);
        if (pr.isEvo) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(SPRITES.glows.gold, -pr.r * 1.6, -pr.r * 1.6, pr.r * 3.2, pr.r * 3.2);
          ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, pr.r, 0, TAU);
        fillStroke(ctx, pr.isEvo ? '#FF5E2E' : '#434A5E', 3.4);
        ctx.beginPath();
        ctx.arc(0, 0, pr.r * 0.64, 0, TAU);
        ctx.fillStyle = pr.isEvo ? '#FFD84D' : '#68738F';
        ctx.fill();
        roundRectPath(ctx, pr.r * 0.75, -4, 13, 8, 3);
        fillStroke(ctx, '#D97A2B', 2.5);
      } else if (pr.kind === 'talisman') {
        ctx.rotate(pr.rot + Math.PI * 0.5);
        roundRectPath(ctx, -7, -12, 14, 24, 2.5);
        fillStroke(ctx, pr.isEvo ? '#63F5FF' : '#FFE14D', 2.6);
        ctx.strokeStyle = '#E62E4D';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-3, -6); ctx.lineTo(3, -6);
        ctx.moveTo(0, -6); ctx.lineTo(0, 7);
        ctx.stroke();
      } else if (pr.kind === 'boba_pearl') {
        ctx.beginPath();
        ctx.arc(0, 0, pr.r, 0, TAU);
        fillStroke(ctx, '#3A1F14', 2.5, '#FFF3E0');
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.arc(-pr.r * 0.3, -pr.r * 0.3, pr.r * 0.28, 0, TAU);
        ctx.fill();
      } else if (pr.kind === 'blackhole_boba') {
        ctx.rotate(this.runTime * 8);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(SPRITES.glows.magenta, -pr.r * 2.4, -pr.r * 2.4, pr.r * 4.8, pr.r * 4.8);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(0, 0, pr.r, 0, TAU);
        fillStroke(ctx, '#2E1065', 3.5, '#F0ABFC');
      } else {
        // Starry magic bolt / feather blade
        ctx.rotate(Math.atan2(pr.vy, pr.vx));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(SPRITES.glows.cyan, -pr.r * 2.2, -pr.r * 2.2, pr.r * 4.4, pr.r * 4.4);
        ctx.restore();
        ctx.beginPath();
        ctx.ellipse(0, 0, pr.r * 1.45, pr.r * 0.78, 0, 0, TAU);
        fillStroke(ctx, pr.color, 2.4);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2, 0, pr.r * 0.42, 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  _renderFallingDrops(ctx) {
    for (let i = 0; i < this.fallingDrops.length; i++) {
      const d = this.fallingDrops[i];
      const prog = 1 - clamp(d.z / 360, 0, 1);

      // Ground target ring
      ctx.save();
      ctx.strokeStyle = d.isEvo ? '#FFD84D' : '#5CE1E6';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.45 + prog * 0.45;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.blastR * prog, 0, TAU);
      ctx.stroke();

      // Falling Giant Mechanical Keycap!
      const kw = d.isEvo ? 54 : 36;
      const kh = d.isEvo ? 44 : 30;
      ctx.globalAlpha = 1;
      ctx.translate(d.x, d.y - d.z);
      roundRectPath(ctx, -kw * 0.5, -kh * 0.5, kw, kh, 8);
      fillStroke(ctx, d.isEvo ? '#FFD84D' : '#F1F5F9', 3.4);
      roundRectPath(ctx, -kw * 0.36, -kh * 0.38, kw * 0.72, kh * 0.68, 5);
      fillStroke(ctx, d.isEvo ? '#FF3864' : '#5CE1E6', 2.2);
      ctx.fillStyle = INK;
      ctx.font = '900 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, 0, -1);
      ctx.restore();
    }
  }

  _renderFireflies(ctx) {
    const p = this.player;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.fireflies.length; i++) {
      const f = this.fireflies[i];
      const fx = p.x + ((f.ox - p.x * 0.15 + Math.sin(this.runTime * f.speed + f.phase) * 35) % 900);
      const fy = p.y + ((f.oy - p.y * 0.15 + Math.cos(this.runTime * f.speed + f.phase) * 35) % 600);
      ctx.globalAlpha = 0.35 + Math.sin(this.runTime * 3 + f.phase) * 0.25;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(fx, fy, f.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  _renderCompassIndicators(ctx, W, H, camL, camT) {
    const targets = [];
    for (const pk of this.pickups) {
      if (pk.kind === 'chest') targets.push({ x: pk.x, y: pk.y, label: t('🎁 宝箱', '🎁 CHEST'), color: '#FFD84D' });
    }
    for (const sh of this.shrines) {
      if (!sh.used) targets.push({ x: sh.x, y: sh.y, label: L(sh, 'shortName') || L(sh, 'name').slice(0, 7), color: sh.color });
    }
    if (this.activeBoss && !this.activeBoss.dead) {
      targets.push({ x: this.activeBoss.x, y: this.activeBoss.y, label: '💀 BOSS', color: '#FF3860' });
    }

    const pad = 58;
    for (const tgt of targets) {
      const sx = tgt.x - camL;
      const sy = tgt.y - camT;
      if (sx >= 24 && sx <= W - 24 && sy >= 24 && sy <= H - 24) continue;

      const ang = Math.atan2(sy - H * 0.5, sx - W * 0.5);
      const ix = clamp(sx, pad, W - pad);
      const iy = clamp(sy, pad + 40, H - pad - 30);

      ctx.save();
      ctx.translate(ix, iy);
      roundRectPath(ctx, -44, -16, 88, 32, 16);
      fillStroke(ctx, '#1F1633E6', 2.8, tgt.color);
      ctx.fillStyle = tgt.color;
      ctx.font = '800 12px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tgt.label, 0, 0);

      // Directional pointer triangle
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(52, 0);
      ctx.lineTo(42, -6);
      ctx.lineTo(42, 6);
      ctx.closePath();
      ctx.fillStyle = tgt.color;
      ctx.fill();
      ctx.restore();
    }
  }

  _renderAtmosphereOverlays(ctx, W, H) {
    // Soft cinematic edge vignette
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.36, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,7,20,0.46)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Low-HP Critical Crimson Heartbeat Vignette (< 32% HP)
    if (this.player && this.stats.maxHp > 0) {
      const hpRatio = this.player.hp / this.stats.maxHp;
      if (hpRatio > 0 && hpRatio < 0.32) {
        const dangerAlpha = (1 - hpRatio / 0.32) * (0.28 + 0.14 * Math.sin(this.runTime * 9));
        const dg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.68);
        dg.addColorStop(0, 'rgba(255, 30, 66, 0)');
        dg.addColorStop(1, `rgba(255, 28, 64, ${dangerAlpha.toFixed(3)})`);
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // Rainbow Fever border glow
    if (this.feverTimer > 0) {
      ctx.save();
      ctx.strokeStyle = `hsla(${(this.runTime * 260) % 360}, 95%, 62%, 0.65)`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, W - 10, H - 10);
      ctx.restore();
    }

    // Screen impact flash
    if (FX.screenFlash > 0.01) {
      ctx.save();
      ctx.globalAlpha = FX.screenFlash;
      ctx.fillStyle = FX.screenFlashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Juicy Arcade Kill-Streak Combo Badge!
    if (this.comboCount >= 8 && this.comboTimer > 0) {
      const pulse = 1 + Math.sin(this.runTime * 18) * 0.05;
      ctx.save();
      ctx.translate(W - 122, 92);
      ctx.scale(pulse, pulse);
      ctx.rotate(-0.05);
      ctx.font = '900 25px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      const txt = isEn() ? `🔥 ${this.comboCount} COMBO!` : `🔥 ${this.comboCount} 连斩!`;
      ctx.strokeText(txt, 0, 0);
      ctx.fillStyle = this.comboCount >= 50 ? '#FFD84D' : '#FF7B54';
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }

    // Virtual Joystick visual feedback when dragging mouse / touch
    if (this.input.joyActive && !this.paused) {
      const sx = this.input.joyStartX;
      const sy = this.input.joyStartY;
      const dx = this.input.joyCurX - sx;
      const dy = this.input.joyCurY - sy;
      const d = Math.min(48, Math.hypot(dx, dy));
      const a = Math.atan2(dy, dx);

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.fillStyle = 'rgba(30,19,42,0.28)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 48, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,216,77,0.82)';
      ctx.beginPath();
      ctx.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 20, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}
