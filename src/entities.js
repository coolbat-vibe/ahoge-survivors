// ============================================================================
// Entities & Encounter Director:
// Wave Spawner, Swarm Events, Monster AI, Telegraphed Multi-Phase Bosses,
// Destructible Barrels, Interactive Event Shrines, Smart-Merging XP Gems
// ============================================================================

let NEXT_UID = 1;

function createEnemy(game, typeId, x, y, opts = {}) {
  const def = ENEMY_TYPES[typeId];
  const timeMin = game.runTime / 60;
  const hpScale = (1 + timeMin * 0.34 + Math.pow(timeMin, 1.55) * 0.10) * (opts.hpMult || 1);
  const dmgScale = (1 + timeMin * 0.14) * (opts.dmgMult || 1);
  const isElite = !!opts.isElite;

  const hp = Math.round(def.hp * hpScale * (isElite ? 5.2 : 1));
  return {
    uid: NEXT_UID++,
    isBoss: false,
    isElite,
    type: typeId,
    name: isElite ? `精英·${def.name}` : def.name,
    nameEn: isElite ? `Elite ${def.nameEn}` : def.nameEn,
    x,
    y,
    vx: 0,
    vy: 0,
    kx: 0,
    ky: 0,
    hp,
    maxHp: hp,
    speed: def.speed * (isElite ? 1.12 : rand(0.92, 1.08)),
    dmg: Math.round(def.dmg * dmgScale * (isElite ? 1.35 : 1)),
    radius: def.radius * (isElite ? 1.38 : 1),
    xp: Math.ceil(def.xp * (isElite ? 8 : 1)),
    color: def.color,
    knockResist: isElite ? Math.max(0.65, def.knockResist || 0) : (def.knockResist || 0),
    behavior: def.behavior,
    animTimer: rand(0, 10),
    flashTimer: 0,
    squashX: 1,
    squashY: 1,
    stunTimer: 0,
    slowTimer: 0,
    slowFactor: 1,
    weakenTimer: 0,
    aiTimer: rand(0.5, 2.2),
    aiState: 'move',
    chargeDirX: 0,
    chargeDirY: 0,
    swarmAngle: opts.swarmAngle || 0,
    dropsChest: !!opts.dropsChest,
    dead: false
  };
}

function createBoss(game, bossDef, x, y) {
  const timeMult = game.turboMode ? 0.88 : 1.0;
  const hp = Math.round(bossDef.hp * timeMult * (1 + Math.max(0, game.runTime - bossDef.spawnTime) * 0.002));
  return {
    uid: NEXT_UID++,
    isBoss: true,
    isFinal: !!bossDef.isFinal,
    isElite: true,
    type: bossDef.id,
    name: bossDef.name,
    nameEn: bossDef.nameEn,
    subtitle: bossDef.subtitle,
    subtitleEn: bossDef.subtitleEn,
    quote: bossDef.quote,
    quoteEn: bossDef.quoteEn,
    x,
    y,
    vx: 0,
    vy: 0,
    kx: 0,
    ky: 0,
    hp,
    maxHp: hp,
    speed: bossDef.speed,
    dmg: bossDef.dmg,
    radius: bossDef.radius,
    xp: 90,
    color: bossDef.color,
    accent: bossDef.accent,
    knockResist: 0.92,
    animTimer: 0,
    flashTimer: 0,
    squashX: 1,
    squashY: 1,
    stunTimer: 0,
    slowTimer: 0,
    slowFactor: 1,
    weakenTimer: 0,
    phase: 1,
    skillTimer: 2.2,
    skillIndex: 0,
    dashTimer: 0,
    dashVx: 0,
    dashVy: 0,
    dropsChest: true,
    dead: false
  };
}

function spawnGem(game, x, y, val) {
  // Auto-consolidate if gem count gets huge so zero XP is ever lost while keeping 120 FPS
  if (game.gems.length > 360) {
    for (let i = 0; i < 25; i++) {
      const g = game.gems[i];
      if (!g.magnetized) {
        g.val += val;
        return;
      }
    }
  }
  const a = rand(0, TAU);
  const sp = rand(25, 70);
  game.gems.push({
    x,
    y,
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp - rand(20, 45),
    val,
    magnetized: false,
    kickTimer: 0,
    bobOffset: rand(0, TAU)
  });
}

function spawnPickup(game, x, y, kind, val = 1) {
  const a = rand(0, TAU);
  const sp = rand(25, 65);
  game.pickups.push({
    x,
    y,
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp,
    kind, // 'coin' | 'chicken_leg' | 'magnet' | 'clock' | 'chili' | 'chest'
    val,
    magnetized: false,
    life: 0
  });
}

function spawnPropNearPlayer(game) {
  if (game.props.length >= 22) return;
  const ang = rand(0, TAU);
  const dist = rand(560, 920);
  const x = game.player.x + Math.cos(ang) * dist;
  const y = game.player.y + Math.sin(ang) * dist;
  game.props.push({
    uid: NEXT_UID++,
    x,
    y,
    hp: 28 + Math.floor(game.runTime * 0.12),
    maxHp: 28 + Math.floor(game.runTime * 0.12),
    radius: 22,
    flashTimer: 0,
    squashX: 1,
    squashY: 1,
    dead: false
  });
}

function spawnShrineNearPlayer(game) {
  if (game.shrines.length >= 2) return;
  const kinds = [
    {
      kind: 'tea',
      name: '☕ 带薪摸鱼茶水间',
      nameEn: '☕ Paid Break Lounge',
      shortName: '☕ 茶水间',
      shortNameEn: '☕ Lounge',
      desc: '站立充能：恢复45%生命 + 无敌护盾',
      descEn: 'Hold zone: Heal 45% HP + Invulnerable Shield',
      color: '#47FF9C'
    },
    {
      kind: 'challenge',
      name: '⚔️ 甲方加急试炼台',
      nameEn: '⚔️ Urgent Client Trial',
      shortName: '⚔️ 试炼台',
      shortNameEn: '⚔️ Trial',
      desc: '站立充能：召唤精英小队，击败必掉黄金宝箱！',
      descEn: 'Hold zone: Summon Elite Squad that drops a Golden Chest!',
      color: '#FF5263'
    },
    {
      kind: 'gacha',
      name: '🎰 欧皇盲盒扭蛋机',
      nameEn: '🎰 Lucky Gacha Shrine',
      shortName: '🎰 扭蛋机',
      shortNameEn: '🎰 Gacha',
      desc: '站立充能：立刻引爆全屏吸金狂热大招！',
      descEn: 'Hold zone: Instant Mega-Magnet + Fever Overload!',
      color: '#FFD84D'
    },
    {
      kind: 'anvil',
      name: '🔨 欧皇超武铁砧',
      nameEn: '🔨 Sacred Forge Anvil',
      shortName: '🔨 铁砧',
      shortNameEn: '🔨 Anvil',
      desc: '站立充能：免费升级随机武器（满级配齐则直接进化★超武）！',
      descEn: 'Hold zone: Free weapon upgrade (or instant ★ Evolution if ready)!',
      color: '#63F5FF'
    }
  ];
  const def = pick(kinds);
  const ang = rand(0, TAU);
  const dist = rand(650, 940);
  game.shrines.push({
    x: game.player.x + Math.cos(ang) * dist,
    y: game.player.y + Math.sin(ang) * dist,
    radius: 68,
    kind: def.kind,
    name: def.name,
    nameEn: def.nameEn,
    shortName: def.shortName,
    shortNameEn: def.shortNameEn,
    desc: def.desc,
    descEn: def.descEn,
    color: def.color,
    progress: 0,
    used: false
  });
  game.pushBanner(
    t(
      `✨ 附近出现了奇遇【${def.name}】！跟随边缘指引前往！`,
      `✨ Event Shrine [${def.nameEn}] appeared nearby! Follow the compass!`
    ),
    def.color
  );
}

// ============================================================================
// Wave & Boss Director
// ============================================================================
class WaveDirector {
  constructor(game) {
    this.game = game;
    this.spawnAccum = 0;
    this.swarmTimer = 28;
    this.eliteTimer = 36;
    this.propTimer = 3.5;
    this.shrineTimer = 30;
    this.mimicTimer = 72;
    this.bossIndex = 0;
  }

  update(dt) {
    const g = this.game;
    const runSec = g.runTime;

    // 1. Check Scheduled Stage Bosses
    if (this.bossIndex < BOSSES.length) {
      const nextBoss = BOSSES[this.bossIndex];
      if (runSec >= nextBoss.spawnTime) {
        this.bossIndex++;
        this.spawnStageBoss(nextBoss);
      }
    } else if (g.endlessMode && Math.floor(runSec) % 90 === 0 && !this._endlessBossAt) {
      this._endlessBossAt = Math.floor(runSec);
      const randomBoss = pick(BOSSES);
      this.spawnStageBoss(randomBoss);
    }
    if (this._endlessBossAt && Math.floor(runSec) !== this._endlessBossAt) {
      this._endlessBossAt = null;
    }

    // 2. Continuous Wave Spawning (Capped at 420 active monsters for butter-smooth 60-120fps)
    const maxEnemies = 420;
    if (g.enemies.length < maxEnemies) {
      // Spawn rate ramps smoothly from 2.8/sec at 0:00 up to ~16/sec in late game
      const rate = 2.8 + (runSec / 60) * 1.45 + (g.endlessMode ? 4.5 : 0);
      this.spawnAccum += rate * dt;
      while (this.spawnAccum >= 1 && g.enemies.length < maxEnemies) {
        this.spawnAccum -= 1;
        const typeId = this.pickEnemyType(runSec);
        const pos = this.getPerimeterSpawnPos();
        g.enemies.push(createEnemy(g, typeId, pos.x, pos.y));
      }
    }

    // 3. Special Bat / Slime Swarm Flocks!
    this.swarmTimer -= dt;
    if (this.swarmTimer <= 0) {
      this.swarmTimer = rand(28, 40);
      this.spawnSwarmEvent(runSec);
    }

    // 4. Periodic Crowned Mini-Elites (Drop Chests or Fat XP!)
    this.eliteTimer -= dt;
    if (this.eliteTimer <= 0) {
      this.eliteTimer = rand(36, 46);
      const pool = runSec < 120 ? ['broccoli', 'ghost'] : runSec < 280 ? ['egg_knight', 'puffer', 'octo_mage'] : ['clock_knight', 'egg_knight', 'octo_mage'];
      const pos = this.getPerimeterSpawnPos();
      const elite = createEnemy(g, pick(pool), pos.x, pos.y, { isElite: true, dropsChest: true });
      g.enemies.push(elite);
      g.pushBanner(
        t(
          `👑 精英魔物【${elite.name}】携黄金宝箱出现！`,
          `👑 Elite [${elite.nameEn}] arrived carrying a Golden Chest!`
        ),
        '#FFD84D'
      );
    }

    // 5. Rare Golden Jackpot Piggy!
    this.mimicTimer -= dt;
    if (this.mimicTimer <= 0) {
      this.mimicTimer = rand(75, 105);
      const pos = this.getPerimeterSpawnPos();
      g.enemies.push(createEnemy(g, 'mimic_pig', pos.x, pos.y));
      g.pushBanner(
        t(
          '🐷 稀有【黄金暴富存钱猪】路过！快截住它爆金币！',
          '🐷 Rare [Golden Jackpot Piggy] spotted! Smash it for coins!'
        ),
        '#FFE047'
      );
    }

    // 6. Destructible Loot Barrels & Event Shrines
    this.propTimer -= dt;
    if (this.propTimer <= 0) {
      this.propTimer = rand(3.8, 6.2);
      spawnPropNearPlayer(g);
    }

    this.shrineTimer -= dt;
    if (this.shrineTimer <= 0) {
      this.shrineTimer = rand(48, 68);
      spawnShrineNearPlayer(g);
    }
  }

  pickEnemyType(t) {
    if (t < 40) return Math.random() < 0.78 ? 'slime' : 'bat';
    if (t < 100) return pick(['slime', 'slime', 'bat', 'broccoli', 'ghost']);
    if (t < 190) return pick(['slime', 'bat', 'broccoli', 'ghost', 'shroom', 'egg_knight']);
    if (t < 300) return pick(['broccoli', 'ghost', 'shroom', 'egg_knight', 'puffer', 'octo_mage']);
    if (t < 430) return pick(['shroom', 'egg_knight', 'puffer', 'octo_mage', 'clock_knight', 'bat']);
    return pick(['egg_knight', 'puffer', 'octo_mage', 'clock_knight', 'clock_knight', 'broccoli']);
  }

  getPerimeterSpawnPos(extraDist = 0) {
    const g = this.game;
    const halfW = g.viewW * 0.5 + 85 + extraDist;
    const halfH = g.viewH * 0.5 + 85 + extraDist;
    const side = randInt(0, 3);
    let x = g.player.x;
    let y = g.player.y;
    if (side === 0) { x += rand(-halfW, halfW); y -= halfH; }
    else if (side === 1) { x += rand(-halfW, halfW); y += halfH; }
    else if (side === 2) { x -= halfW; y += rand(-halfH, halfH); }
    else { x += halfW; y += rand(-halfH, halfH); }
    return { x, y };
  }

  spawnSwarmEvent(runSec) {
    const g = this.game;
    const isBats = Math.random() < 0.65;
    const angle = rand(0, TAU);
    const centerX = g.player.x + Math.cos(angle) * (g.viewW * 0.56 + 90);
    const centerY = g.player.y + Math.sin(angle) * (g.viewH * 0.56 + 90);
    const aimToPlayer = Math.atan2(g.player.y - centerY, g.player.x - centerX);
    const count = isBats ? 18 : 14;
    for (let i = 0; i < count && g.enemies.length < 440; i++) {
      const ox = rand(-75, 75);
      const oy = rand(-75, 75);
      g.enemies.push(
        createEnemy(g, isBats ? 'bat' : 'slime', centerX + ox, centerY + oy, {
          swarmAngle: aimToPlayer,
          hpMult: 0.75
        })
      );
    }
    if (isBats) {
      g.pushBanner(
        t('🛵 外卖晚高峰！大批狂飙蝙蝠正在斜线冲锋！', '🛵 RUSH HOUR! Express Delivery Bats incoming!'),
        '#C78BFF'
      );
    }
  }

  spawnStageBoss(bossDef) {
    const g = this.game;
    const ang = rand(0, TAU);
    const dist = Math.max(g.viewW, g.viewH) * 0.42;
    const bx = g.player.x + Math.cos(ang) * dist;
    const by = g.player.y + Math.sin(ang) * dist;
    const boss = createBoss(g, bossDef, bx, by);
    g.enemies.push(boss);
    g.activeBoss = boss;

    SFX.play('bossWarn');
    SFX.setBgmMode('boss');
    FX.addShake(0.65);
    FX.flashScreen('#FF2E63', 0.32);
    FX.addRing(bx, by, 20, 220, bossDef.color, 0.55, 12, true);
    g.showBossAlert(boss);
  }
}

// ============================================================================
// Update Enemies, Multi-Phase Boss AI & Telegraphed Attacks
// ============================================================================
function updateEnemiesAndBosses(game, dt) {
  const p = game.player;
  const frozen = game.freezeTimer > 0;

  // Update Telegraphed Boss / Charger Hazard Zones
  for (let i = game.telegraphs.length - 1; i >= 0; i--) {
    const tg = game.telegraphs[i];
    if (!frozen) tg.t += dt;
    if (tg.t >= tg.duration) {
      triggerTelegraphEffect(game, tg);
      swapPop(game.telegraphs, i);
    }
  }

  // Update Enemy Projectiles
  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const b = game.enemyBullets[i];
    if (!frozen) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life += dt;
    }
    if (b.life >= b.maxLife) {
      swapPop(game.enemyBullets, i);
      continue;
    }
    // Check collision with orbiting pigeons shield!
    if (game.checkOrbitalBlock(b.x, b.y, b.r)) {
      FX.burst(b.x, b.y, '#8CE8FF', 5, 110, 4.5, 'star', true);
      SFX.play('pop');
      swapPop(game.enemyBullets, i);
      continue;
    }
    // Hit player
    const rr = b.r + p.radius * 0.78;
    if (distSq(b.x, b.y, p.x, p.y) <= rr * rr) {
      game.damagePlayer(b.dmg, b.x, b.y);
      swapPop(game.enemyBullets, i);
    }
  }

  // Rebuild Spatial Hash Grid for Enemies
  const enemies = game.enemies;
  game.grid.ensureCapacity(enemies.length + 16);
  game.grid.clear();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.dead) game.grid.insert(i, e.x, e.y);
  }

  const maxLeashSq = Math.pow(Math.max(game.viewW, game.viewH) * 0.88 + 260, 2);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dead) {
      swapPop(enemies, i);
      continue;
    }

    // Visual timers
    if (e.flashTimer > 0) e.flashTimer -= dt;
    e.squashX = lerp(e.squashX, 1, Math.min(1, dt * 14));
    e.squashY = lerp(e.squashY, 1, Math.min(1, dt * 14));

    if (e.slowTimer > 0) e.slowTimer -= dt;
    else e.slowFactor = 1;
    if (e.weakenTimer > 0) e.weakenTimer -= dt;

    // Knockback decay
    e.x += e.kx * dt;
    e.y += e.ky * dt;
    const kd = Math.exp(-10 * dt);
    e.kx *= kd;
    e.ky *= kd;

    // Relocate far-away regular enemies back ahead of player so horde density stays juicy!
    const dxP = p.x - e.x;
    const dyP = p.y - e.y;
    const dSqP = dxP * dxP + dyP * dyP;
    if (!e.isBoss && !e.isElite && e.type !== 'mimic_pig' && dSqP > maxLeashSq) {
      const pos = game.director.getPerimeterSpawnPos();
      e.x = pos.x;
      e.y = pos.y;
      continue;
    }

    if (frozen || e.stunTimer > 0) {
      if (e.stunTimer > 0 && !frozen) e.stunTimer -= dt;
      continue;
    }

    e.animTimer += dt * (e.isBoss ? 5.5 : 6.5);
    const distP = Math.sqrt(dSqP) || 1;
    const dirX = dxP / distP;
    const dirY = dyP / distP;
    const moveSpd = e.speed * e.slowFactor;

    if (e.isBoss) {
      updateBossAI(game, e, dt, dirX, dirY, distP, moveSpd);
    } else {
      updateRegularEnemyAI(game, e, dt, dirX, dirY, distP, moveSpd);
    }

    // Soft neighbor separation (using SpatialGrid, fast local check on small subset)
    if (!e.isBoss && ((i + game.frameCount) & 1) === 0) {
      const near = game.grid.queryCircle(enemies, e.x, e.y, e.radius * 1.65);
      let pushX = 0;
      let pushY = 0;
      const limit = Math.min(near.length, 6);
      for (let k = 0; k < limit; k++) {
        const o = near[k];
        if (o === e) continue;
        const sx = e.x - o.x;
        const sy = e.y - o.y;
        const sd2 = sx * sx + sy * sy;
        const minR = e.radius + o.radius;
        if (sd2 > 0.01 && sd2 < minR * minR) {
          const sd = Math.sqrt(sd2);
          const f = (minR - sd) / minR;
          pushX += (sx / sd) * f;
          pushY += (sy / sd) * f;
        }
      }
      e.x += pushX * 95 * dt;
      e.y += pushY * 95 * dt;
    }

    // Contact damage with Player
    const hitR = e.radius * 0.78 + p.radius * 0.72;
    if (distSq(e.x, e.y, p.x, p.y) <= hitR * hitR) {
      game.damagePlayer(e.dmg, e.x, e.y);
    }
  }
}

function updateRegularEnemyAI(game, e, dt, dirX, dirY, distP, moveSpd) {
  switch (e.behavior) {
    case 'swarm': {
      // Express bats zoom in fast diagonal formation then curve toward player
      if (e.swarmAngle !== 0 && distP > 190) {
        e.x += Math.cos(e.swarmAngle) * moveSpd * 1.25 * dt;
        e.y += Math.sin(e.swarmAngle) * moveSpd * 1.25 * dt;
      } else {
        e.x += dirX * moveSpd * dt;
        e.y += dirY * moveSpd * dt;
      }
      break;
    }

    case 'waver': {
      const perpX = -dirY;
      const perpY = dirX;
      const wave = Math.sin(e.animTimer * 1.4) * 0.55;
      e.x += (dirX + perpX * wave) * moveSpd * dt;
      e.y += (dirY + perpY * wave) * moveSpd * dt;
      break;
    }

    case 'bomber': {
      // Pufferfish inflates red and explodes when close!
      if (e.aiState === 'primed') {
        e.aiTimer -= dt;
        e.squashX = 1.25 + Math.sin(e.animTimer * 8) * 0.14;
        e.squashY = 1.25 - Math.sin(e.animTimer * 8) * 0.14;
        if (e.aiTimer <= 0) {
          e.dead = true;
          SFX.play('explode');
          FX.addRing(e.x, e.y, 12, 105, '#FF793F', 0.34, 8, true);
          FX.burst(e.x, e.y, '#FFB84D', 14, 220, 7.5, 'star', true);
          // Damages player if inside & ALSO blasts nearby monsters!
          if (distSq(e.x, e.y, game.player.x, game.player.y) <= 102 * 102) {
            game.damagePlayer(e.dmg, e.x, e.y);
          }
          const splashTargets = game.grid.queryCircle(game.enemies, e.x, e.y, 110);
          for (let k = 0; k < splashTargets.length; k++) {
            const o = splashTargets[k];
            if (o !== e && !o.dead) game.damageEnemy(o, 45, e.x, e.y, 260, false, '#FF9F2E');
          }
        }
      } else {
        e.x += dirX * moveSpd * dt;
        e.y += dirY * moveSpd * dt;
        if (distP < 92) {
          e.aiState = 'primed';
          e.aiTimer = 0.78;
          game.telegraphs.push({
            kind: 'circle',
            x: e.x,
            y: e.y,
            r: 102,
            t: 0,
            duration: 0.78,
            dmg: 0, // handled by bomber itself
            color: '#FF793F'
          });
        }
      }
      break;
    }

    case 'ranged': {
      // Boba Octopus keeps comfortable range and shoots purple ink-boba orbs
      if (distP > 250) {
        e.x += dirX * moveSpd * dt;
        e.y += dirY * moveSpd * dt;
      } else if (distP < 150) {
        e.x -= dirX * moveSpd * 0.5 * dt;
        e.y -= dirY * moveSpd * 0.5 * dt;
      }
      e.aiTimer -= dt;
      if (e.aiTimer <= 0 && distP < 420 && game.enemyBullets.length < 90) {
        e.aiTimer = rand(2.3, 3.2);
        e.squashX = 1.25;
        e.squashY = 0.8;
        game.enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: dirX * 195,
          vy: dirY * 195,
          r: 8,
          dmg: e.dmg,
          color: '#FF66D9',
          life: 0,
          maxLife: 3.2
        });
      }
      break;
    }

    case 'charger': {
      // Clockwork Knight winds up with red lane telegraph then charges!
      if (e.aiState === 'windup') {
        e.aiTimer -= dt;
        if (e.aiTimer <= 0) {
          e.aiState = 'charging';
          e.aiTimer = 0.52;
        }
      } else if (e.aiState === 'charging') {
        e.x += e.chargeDirX * moveSpd * 3.6 * dt;
        e.y += e.chargeDirY * moveSpd * 3.6 * dt;
        e.aiTimer -= dt;
        if (Math.random() < 0.4) {
          FX.spawnParticle({ x: e.x, y: e.y + 10, vx: rand(-20, 20), vy: rand(-20, 20), size: 5, color: '#70C4FF', maxLife: 0.22 });
        }
        if (e.aiTimer <= 0) {
          e.aiState = 'move';
          e.aiTimer = rand(2.6, 3.8);
        }
      } else {
        e.x += dirX * moveSpd * dt;
        e.y += dirY * moveSpd * dt;
        e.aiTimer -= dt;
        if (e.aiTimer <= 0 && distP < 320) {
          e.aiState = 'windup';
          e.aiTimer = 0.68;
          e.chargeDirX = dirX;
          e.chargeDirY = dirY;
          game.telegraphs.push({
            kind: 'line',
            x1: e.x,
            y1: e.y,
            x2: e.x + dirX * 290,
            y2: e.y + dirY * 290,
            width: 34,
            t: 0,
            duration: 0.68,
            dmg: 0,
            color: '#FF4757'
          });
        }
      }
      break;
    }

    case 'treasure': {
      // Golden Piggy runs tangentially / away when player gets close, dropping coins!
      const tangX = -dirY;
      const tangY = dirX;
      const flee = distP < 240 ? -0.75 : 0.25;
      e.x += (dirX * flee + tangX * 0.85) * moveSpd * dt;
      e.y += (dirY * flee + tangY * 0.85) * moveSpd * dt;
      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiTimer = 0.9;
        spawnPickup(game, e.x, e.y, 'coin', 5);
      }
      break;
    }

    default:
      e.x += dirX * moveSpd * dt;
      e.y += dirY * moveSpd * dt;
      break;
  }
}

function updateBossAI(game, b, dt, dirX, dirY, distP, moveSpd) {
  // Enrage Phase 2 at 50% HP!
  if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
    b.phase = 2;
    b.speed *= 1.18;
    FX.addShake(0.6);
    FX.addRing(b.x, b.y, 20, 240, '#FFD84D', 0.5, 11, true);
    FX.addText(b.x, b.y - 50, t('💢 二阶段暴走!!', '💢 PHASE 2 ENRAGED!!'), '#FFE047', true, 1.35);
    SFX.play('bossWarn');
  }

  if (b.dashTimer > 0) {
    b.dashTimer -= dt;
    b.x += b.dashVx * dt;
    b.y += b.dashVy * dt;
    if (Math.random() < 0.6) {
      FX.burst(b.x, b.y, b.color, 2, 90, 6, 'star', true);
    }
    return;
  }

  b.x += dirX * moveSpd * dt;
  b.y += dirY * moveSpd * dt;

  b.skillTimer -= dt * (b.phase === 2 ? 1.3 : 1.0);
  if (b.skillTimer > 0) return;

  const p = game.player;
  b.skillIndex = (b.skillIndex + 1) % 2;
  b.skillTimer = rand(2.5, 3.4);

  if (b.type === 'boss_jelly') {
    if (b.skillIndex === 0) {
      // Royal Belly Slam at Player position!
      game.telegraphs.push({
        kind: 'circle',
        x: p.x,
        y: p.y,
        r: 135,
        t: 0,
        duration: 0.95,
        dmg: b.dmg * 1.25,
        color: '#7CFF5B',
        bossJump: b
      });
    } else {
      // Radial Lime Jelly Bullet Nova
      const n = b.phase === 2 ? 14 : 10;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + b.animTimer;
        game.enemyBullets.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 215, vy: Math.sin(a) * 215,
          r: 10, dmg: b.dmg * 0.85, color: '#9DFF4D', life: 0, maxLife: 3.6
        });
      }
      FX.addRing(b.x, b.y, 20, 120, '#7CFF5B', 0.3, 6, true);
    }
  } else if (b.type === 'boss_ppt') {
    if (b.skillIndex === 0) {
      // Deadline Red Lane Charge!
      const tx = b.x + dirX * 430;
      const ty = b.y + dirY * 430;
      game.telegraphs.push({
        kind: 'line',
        x1: b.x, y1: b.y, x2: tx, y2: ty,
        width: 74, t: 0, duration: 0.78, dmg: 0, color: '#FF3860',
        onTrigger: () => {
          b.dashTimer = 0.45;
          b.dashVx = dirX * 920;
          b.dashVy = dirY * 920;
          SFX.play('dash');
        }
      });
    } else {
      // Pie-Chart Fan Volley
      const baseA = Math.atan2(p.y - b.y, p.x - b.x);
      const count = b.phase === 2 ? 9 : 6;
      for (let k = 0; k < count; k++) {
        const a = baseA + (k - (count - 1) / 2) * 0.22;
        game.enemyBullets.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 255, vy: Math.sin(a) * 255,
          r: 10, dmg: b.dmg * 0.9, color: '#FF5263', life: 0, maxLife: 3.4
        });
      }
    }
  } else if (b.type === 'boss_pie') {
    if (b.skillIndex === 0) {
      // Multi-Circle Stargazy Bombardment around player!
      const spots = b.phase === 2 ? 5 : 3;
      for (let k = 0; k < spots; k++) {
        const ox = k === 0 ? 0 : rand(-190, 190);
        const oy = k === 0 ? 0 : rand(-190, 190);
        game.telegraphs.push({
          kind: 'circle',
          x: p.x + ox, y: p.y + oy,
          r: 95, t: 0, duration: 0.92, dmg: b.dmg * 1.15, color: '#C77DFF'
        });
      }
    } else {
      // Dual Spiral Tentacle Orbs
      const n = b.phase === 2 ? 16 : 12;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU;
        game.enemyBullets.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 235, vy: Math.sin(a) * 235,
          r: 10, dmg: b.dmg * 0.9, color: '#E0AAFF', life: 0, maxLife: 3.6
        });
      }
    }
  } else if (b.type === 'boss_monday') {
    if (b.skillIndex === 0) {
      // Arch-Demon MONDAY Cross Cleave + Slam!
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + (b.phase === 2 ? 0.35 : 0);
        game.telegraphs.push({
          kind: 'line',
          x1: b.x, y1: b.y,
          x2: b.x + Math.cos(a) * 520, y2: b.y + Math.sin(a) * 520,
          width: 62, t: 0, duration: 0.85, dmg: b.dmg * 1.2, color: '#FF2E7E'
        });
      }
      game.telegraphs.push({
        kind: 'circle',
        x: p.x, y: p.y, r: 125, t: 0, duration: 0.9, dmg: b.dmg * 1.25, color: '#FFD84D', bossJump: b
      });
    } else {
      // Monday Scythe Crescent Waves!
      const baseA = Math.atan2(p.y - b.y, p.x - b.x);
      const waves = b.phase === 2 ? 14 : 9;
      for (let k = 0; k < waves; k++) {
        const a = baseA + (k / waves) * TAU;
        game.enemyBullets.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 265, vy: Math.sin(a) * 265,
          r: 11, dmg: b.dmg, color: '#00F5D4', life: 0, maxLife: 3.8
        });
      }
      SFX.play('laser');
    }
  }
}

function triggerTelegraphEffect(game, tg) {
  const p = game.player;
  if (tg.onTrigger) tg.onTrigger();

  if (tg.bossJump && !tg.bossJump.dead) {
    tg.bossJump.x = tg.x;
    tg.bossJump.y = tg.y;
    tg.bossJump.squashX = 1.38;
    tg.bossJump.squashY = 0.68;
  }

  if (tg.kind === 'circle' && tg.dmg > 0) {
    SFX.play('explode');
    FX.addShake(0.35);
    FX.addRing(tg.x, tg.y, 12, tg.r, tg.color, 0.34, 9, true);
    FX.burst(tg.x, tg.y, tg.color, 14, 210, 7, 'star', true);
    const rr = tg.r + p.radius * 0.5;
    if (distSq(tg.x, tg.y, p.x, p.y) <= rr * rr) {
      game.damagePlayer(tg.dmg, tg.x, tg.y);
    }
  } else if (tg.kind === 'line' && tg.dmg > 0) {
    SFX.play('laser');
    FX.addShake(0.28);
    FX.addBeam(tg.x1, tg.y1, tg.x2, tg.y2, tg.color, tg.width * 0.85, 0.26, false);
    const halfW = tg.width * 0.5 + p.radius * 0.5;
    if (pointToSegmentDistSq(p.x, p.y, tg.x1, tg.y1, tg.x2, tg.y2) <= halfW * halfW) {
      game.damagePlayer(tg.dmg, tg.x1, tg.y1);
    }
  }
}
