// ============================================================================
// Weapons, ★ Super Evolutions, Projectiles, Ground Zones, Orbitals & Hero Dash
// ============================================================================

function fireWeaponInstance(game, w) {
  const p = game.player;
  const stats = game.stats;
  const lv = w.level;
  const isEvo = w.evolved;
  const baseDef = WEAPONS[w.id];

  // Damage scaling per weapon level + player Might + Spicy Frenzy buff
  const frenzyMult = game.spicyTimer > 0 ? 1.45 : 1.0;
  const feverMult = game.feverTimer > 0 ? 1.35 : 1.0;
  const lvDmgMult = isEvo ? 2.85 : (1 + (lv - 1) * 0.34);
  const dmg = baseDef.baseDmg * lvDmgMult * stats.might * frenzyMult * feverMult;
  const area = baseDef.baseArea * stats.area * (isEvo ? 1.38 : (1 + (lv - 1) * 0.08));
  const bonusAmt = stats.amount;

  switch (w.id) {
    // 1. 尚方咸鱼斩 / ★黄金暴龙咸鱼王
    case 'fish_sword': {
      SFX.play('slap');
      const count = isEvo ? 4 : (lv >= 5 ? 3 : lv >= 3 ? 2 : 1) + Math.min(2, bonusAmt);
      const radius = (isEvo ? 148 : 96) * area;
      const span = isEvo ? 2.25 : (1.55 + lv * 0.1);
      const baseAngle = game.getAimAngle();

      for (let i = 0; i < count; i++) {
        const ang = isEvo
          ? baseAngle + (i * TAU) / count + game.runTime * 0.7
          : i === 0
          ? baseAngle
          : i === 1
          ? baseAngle + Math.PI
          : baseAngle + (i % 2 === 0 ? 0.65 : -0.65);

        // Slight stagger for multi-slash feel
        const delay = i * 0.065;
        game.scheduleAction(delay, () => {
          const sx = p.x;
          const sy = p.y;
          FX.addSlash(
            sx,
            sy,
            ang,
            span,
            radius,
            isEvo ? '#FFD84D' : '#5CE1E6',
            isEvo ? '#FFF9D6' : '#FFFFFF',
            0.22,
            isEvo ? 30 : 22,
            true
          );
          if (isEvo && i === 0) {
            FX.addRing(sx, sy, 20, radius * 1.05, '#FFD84D', 0.28, 7, true);
          }
          // Hit enemies in arc + hit destructible props!
          const targets = game.grid.queryCircle(game.enemies, sx, sy, radius + 24);
          for (let k = 0; k < targets.length; k++) {
            const e = targets[k];
            const aTo = Math.atan2(e.y - sy, e.x - sx);
            if (isEvo || Math.abs(angleDiff(ang, aTo)) <= span * 0.58) {
              const dealt = game.damageEnemy(e, dmg, sx, sy, (isEvo ? 380 : 250) * stats.knockback, false, isEvo ? '#FFD84D' : '#5CE1E6', w);
              if (dealt > 0 && Math.random() < 0.14) {
                FX.addText(e.x, e.y - 22, callout('slap'), '#FFE066', false, 0.95);
              }
            }
          }
          game.hitPropsInCircle(sx + Math.cos(ang) * radius * 0.5, sy + Math.sin(ang) * radius * 0.5, radius * 0.7, dmg);
        });
      }
      break;
    }

    // 2. 冰美式魔弹 / ★零点死神加特林
    case 'espresso_wand': {
      SFX.play('magic');
      const count = (isEvo ? 5 : (lv >= 5 ? 4 : lv >= 4 ? 3 : lv >= 2 ? 2 : 1)) + bonusAmt;
      const bounce = (isEvo ? 4 : (lv >= 5 ? 3 : lv >= 3 ? 2 : 1)) + Math.floor(stats.pierce * 0.5);
      const speed = (isEvo ? 640 : 470) * stats.projSpeed;

      for (let i = 0; i < count; i++) {
        game.scheduleAction(i * (isEvo ? 0.032 : 0.055), () => {
          const target = game.grid.findNearest(game.enemies, p.x, p.y, 560);
          const ang = target
            ? Math.atan2(target.y - p.y, target.x - p.x) + rand(-0.08, 0.08)
            : game.getAimAngle() + (i - (count - 1) / 2) * 0.18;

          game.projectiles.push({
            kind: 'magic_bolt',
            weapon: w,
            isEvo,
            x: p.x,
            y: p.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            speed,
            r: (isEvo ? 11 : 8.5) * Math.sqrt(area),
            dmg,
            bounceLeft: bounce,
            pierceLeft: 0,
            knockback: 95 * stats.knockback,
            color: isEvo ? pick(['#FF4DFF', '#63F5FF', '#FFE047', '#6BFFB8']) : '#B978FF',
            hitSet: new Set(),
            life: 0,
            maxLife: 2.2 * stats.duration
          });
        });
      }
      break;
    }

    // 3. 夺命平底锅 / ★乾坤颠勺风火轮
    case 'iron_wok': {
      SFX.play('wok');
      const count = (isEvo ? 4 : (lv >= 5 ? 3 : lv >= 3 ? 2 : 1)) + bonusAmt;
      const speed = (isEvo ? 520 : 420) * stats.projSpeed;
      const target = game.grid.findNearest(game.enemies, p.x, p.y, 500);
      const baseAng = target ? Math.atan2(target.y - p.y, target.x - p.x) : game.getAimAngle();

      for (let i = 0; i < count; i++) {
        const ang = baseAng + (i * TAU) / count + (count > 1 ? rand(-0.1, 0.1) : 0);
        game.projectiles.push({
          kind: 'boomerang_wok',
          weapon: w,
          isEvo,
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          outDirX: Math.cos(ang),
          outDirY: Math.sin(ang),
          speed,
          r: (isEvo ? 26 : 19) * area,
          dmg,
          extraCrit: lv >= 4 ? 0.12 : 0,
          knockback: 210 * stats.knockback,
          rot: 0,
          hitCooldowns: new Map(),
          dropTimer: 0,
          life: 0,
          maxLife: 2.5 * stats.duration
        });
      }
      break;
    }

    // 4. 退退退符箓 / ★九天玄雷八卦阵
    case 'talisman': {
      SFX.play('zap');
      const count = (isEvo ? 8 : (lv >= 5 ? 8 : lv >= 4 ? 6 : lv >= 2 ? 4 : 3)) + bonusAmt;
      const speed = (isEvo ? 480 : 390) * stats.projSpeed;
      w._spinOffset = (w._spinOffset || 0) + 0.42;

      for (let i = 0; i < count; i++) {
        const ang = w._spinOffset + (i / count) * TAU;
        game.projectiles.push({
          kind: 'talisman',
          weapon: w,
          isEvo,
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          r: (isEvo ? 13 : 10) * Math.sqrt(area),
          blastR: (isEvo ? 78 : 52) * area,
          dmg,
          pierceLeft: stats.pierce,
          knockback: 120 * stats.knockback,
          rot: ang,
          hitSet: new Set(),
          life: 0,
          maxLife: 1.9 * stats.duration
        });
      }

      // ★ Evolution Bonus: Nine-Heaven Thunderbolts strike high-HP nearby targets directly!
      if (isEvo) {
        const near = game.grid.queryCircle(game.enemies, p.x, p.y, 440 * area);
        const bolts = Math.min(5 + bonusAmt, near.length);
        for (let b = 0; b < bolts; b++) {
          const e = near[(Math.random() * near.length) | 0];
          if (!e || e.dead) continue;
          FX.addBeam(p.x, p.y, e.x, e.y, '#4DFFF3', 10, 0.18, true);
          FX.addRing(e.x, e.y, 8, 60, '#FFE14D', 0.24, 5, true);
          game.damageEnemy(e, dmg * 1.45, p.x, p.y, 140, false, '#4DFFF3', w);
        }
      }
      break;
    }

    // 5. 护体咕咕鸽 / ★圣光鸽王羽刃风暴 (Managed continuously in updateOrbitals, refreshed here)
    case 'pigeon': {
      // Handled smoothly in game.updateOrbitals so pigeons orbit seamlessly!
      break;
    }

    // 6. 大蒜榴莲光环 / ★生化螺蛳粉领域
    case 'durian_aura': {
      const radius = (isEvo ? 184 : (92 + (lv - 1) * 18)) * area;
      const auraDmg = isEvo ? dmg * 1.32 : dmg;
      w._visualRadius = radius;
      w._pulseAnim = 1.0;

      const targets = game.grid.queryCircle(game.enemies, p.x, p.y, radius);
      let hitCount = 0;
      for (let i = 0; i < targets.length; i++) {
        const e = targets[i];
        if (e.dead) continue;
        hitCount++;
        e.slowTimer = 0.95;
        e.slowFactor = Math.min(e.slowFactor, isEvo ? 0.55 : (lv >= 3 ? 0.72 : 0.85));
        e.weakenTimer = 1.35;
        game.damageEnemy(e, auraDmg, p.x, p.y, isEvo ? 85 : 48, false, isEvo ? '#E879F9' : '#A8FF3E', w, true);
      }
      // Evolved Bio-Noodle Domain steals HP when melting crowds!
      if (isEvo && hitCount > 0 && p.hp < stats.maxHp) {
        p.hp = Math.min(stats.maxHp, p.hp + Math.min(2.0, hitCount * 0.22));
      }
      game.hitPropsInCircle(p.x, p.y, radius, auraDmg);
      break;
    }

    // 7. 天降机械键盘 / ★删库跑路巨型回车
    case 'keyboard_rain': {
      const drops = (isEvo ? 3 : (lv >= 5 ? 3 : lv >= 4 ? 2 : lv >= 2 ? 2 : 1)) + Math.min(2, bonusAmt);
      const blastR = (isEvo ? 124 : 78) * area;
      const labels = isEvo ? ['ENTER', 'RM-RF', '404!'] : ['CTRL', 'ALT', 'DEL', 'ESC', 'Z', 'F5'];

      for (let i = 0; i < drops; i++) {
        game.scheduleAction(i * 0.12, () => {
          let tx, ty;
          if (game.enemies.length > 0 && Math.random() < 0.82) {
            const pickE = game.enemies[(Math.random() * game.enemies.length) | 0];
            tx = pickE.x + rand(-28, 28);
            ty = pickE.y + rand(-28, 28);
          } else {
            tx = p.x + rand(-260, 260);
            ty = p.y + rand(-200, 200);
          }
          game.fallingDrops.push({
            weapon: w,
            isEvo,
            label: pick(labels),
            x: tx,
            y: ty,
            z: 360,
            vz: 920,
            blastR,
            dmg: dmg * (isEvo ? 1.05 : 1.0)
          });
        });
      }
      break;
    }

    // 8. 尖叫惨叫鸡 / ★毁灭交响惨叫鸡群
    case 'rubber_chicken': {
      SFX.play('pop');
      const count = (isEvo ? 4 : (lv >= 4 ? 3 : lv >= 2 ? 2 : 1)) + bonusAmt;
      const blastR = (isEvo ? 120 : 84) * area;

      for (let i = 0; i < count; i++) {
        const ang = rand(0, TAU);
        const dist = rand(70, 220);
        game.mines.push({
          weapon: w,
          isEvo,
          x: p.x,
          y: p.y,
          tx: p.x + Math.cos(ang) * dist,
          ty: p.y + Math.sin(ang) * dist,
          landed: false,
          flightT: 0,
          flightDur: 0.34,
          armTimer: isEvo ? 2.4 : 1.85,
          blastR,
          dmg,
          stun: lv >= 3 || isEvo ? 0.65 : 0.25,
          rot: rand(-0.3, 0.3)
        });
      }
      break;
    }

    // 9. 波霸奶茶水枪 / ★全糖去冰黑洞波霸
    case 'boba_gun': {
      const burstCount = isEvo ? (2 + Math.min(1, bonusAmt)) : ((lv >= 5 ? 6 : lv >= 4 ? 5 : lv >= 2 ? 4 : 3) + Math.min(2, bonusAmt));
      const speed = (isEvo ? 330 : 510) * stats.projSpeed;

      for (let i = 0; i < burstCount; i++) {
        const spawnPuddle = i % 2 === 0;
        game.scheduleAction(i * (isEvo ? 0.18 : 0.06), () => {
          SFX.play('boba');
          const aim = game.getAimAngle() + rand(-0.14, 0.14);
          game.projectiles.push({
            kind: isEvo ? 'blackhole_boba' : 'boba_pearl',
            weapon: w,
            isEvo,
            spawnPuddle,
            x: p.x,
            y: p.y,
            vx: Math.cos(aim) * speed,
            vy: Math.sin(aim) * speed,
            r: (isEvo ? 22 : 9.5) * Math.sqrt(area),
            puddleR: (isEvo ? 128 : (44 + lv * 5)) * area,
            dmg: isEvo ? dmg * 1.15 : dmg,
            pierceLeft: isEvo ? 99 : stats.pierce,
            knockback: isEvo ? -120 : 85 * stats.knockback,
            hitSet: new Set(),
            vortexTick: 0,
            life: 0,
            maxLife: (isEvo ? 1.38 : 1.45) * stats.duration
          });
        });
      }
      break;
    }

    // 10. 暴走激光逗猫棒 / ★轨道棱镜彩虹死光
    case 'laser_cat': {
      SFX.play('laser');
      const beams = (isEvo ? 4 : (lv >= 5 ? 3 : lv >= 3 ? 2 : 1)) + Math.min(2, bonusAmt);
      const length = (isEvo ? 580 : 470) * Math.sqrt(area);
      const width = (isEvo ? 32 : (15 + lv * 3)) * area;
      const baseAng = game.getAimAngle();
      let prismBursts = 0;

      for (let i = 0; i < beams; i++) {
        // Beam 0 always locks directly onto aim/nearest horde; extra beams fan or sweep!
        const a = isEvo
          ? (i === 0 ? baseAng : baseAng + ((i - 0.5) * TAU) / beams + Math.sin(game.runTime * 1.6) * 0.35)
          : baseAng + (i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * (0.38 * Math.ceil(i * 0.5)));
        const x2 = p.x + Math.cos(a) * length;
        const y2 = p.y + Math.sin(a) * length;
        const col = isEvo ? ['#FF3864', '#FFE047', '#00F5D4', '#C77DFF'][i % 4] : '#FF3864';

        FX.addBeam(p.x, p.y, x2, y2, col, width, 0.28, false);
        FX.directionalSparks(p.x + Math.cos(a) * 28, p.y + Math.sin(a) * 28, a, col, 6, 260);

        // Cleave every monster touching the beam!
        const halfW = width * 0.68;
        const beamDmg = isEvo ? dmg * 1.25 : dmg;
        for (let k = 0; k < game.enemies.length; k++) {
          const e = game.enemies[k];
          if (e.dead) continue;
          const rr = halfW + e.radius;
          if (pointToSegmentDistSq(e.x, e.y, p.x, p.y, x2, y2) <= rr * rr) {
            game.damageEnemy(e, beamDmg, p.x, p.y, 130 * stats.knockback, false, col, w);
            if (isEvo && prismBursts < 6) {
              prismBursts++;
              FX.addRing(e.x, e.y, 6, 56 * area, col, 0.22, 4, true);
              const splash = game.grid.queryCircle(game.enemies, e.x, e.y, 56 * area);
              for (let s = 0; s < splash.length; s++) {
                if (splash[s] !== e) {
                  game.damageEnemy(splash[s], beamDmg * 0.42, e.x, e.y, 60, false, col, w, true);
                }
              }
            }
          }
        }
        // Leave scorch fire pods on Lv.4+ or Evolved!
        if (lv >= 4 || isEvo) {
          for (let s = 1; s <= 3; s++) {
            const dist = (length * s) / 3.5;
            game.zones.push({
              kind: 'laser_ember',
              weapon: w,
              x: p.x + Math.cos(a) * dist,
              y: p.y + Math.sin(a) * dist,
              r: (isEvo ? 44 : 34) * area,
              dmg: beamDmg * (isEvo ? 0.36 : 0.28),
              slow: 1,
              color: col,
              tickTimer: 0.2,
              life: 0,
              maxLife: 1.6 * stats.duration
            });
          }
        }
      }
      break;
    }
  }
}

// ============================================================================
// Execute Hero Active Dash Skill (`Space` / Right-Click / HUD Button)
// ============================================================================
function executeHeroDash(game) {
  const p = game.player;
  if (p.dashCd > 0 || game.paused || game.gameOver) return;

  const hero = HEROES.find((h) => h.id === p.heroId);
  p.dashCd = hero.dash.cd * game.stats.cdr;
  p.invulnTimer = Math.max(p.invulnTimer, 0.46);

  // Dash direction: movement input if held, otherwise toward aim/facing
  let dx = game.input.moveX;
  let dy = game.input.moveY;
  const len = Math.hypot(dx, dy);
  if (len > 0.05) {
    dx /= len;
    dy /= len;
  } else {
    const a = game.getAimAngle();
    dx = Math.cos(a);
    dy = Math.sin(a);
  }

  const baseDmg = (38 + p.level * 6) * game.stats.might;
  SFX.play('dash');

  if (p.heroId === 'witch') {
    // Instant Latte Arcane Blink! Leave exploding magic circle at origin + arrival burst!
    const oldX = p.x;
    const oldY = p.y;
    FX.addRing(oldX, oldY, 12, 135, '#B978FF', 0.36, 9, true);
    FX.burst(oldX, oldY, '#63F5FF', 16, 230, 7, 'star', true);
    const hitOld = game.grid.queryCircle(game.enemies, oldX, oldY, 135);
    for (const e of hitOld) {
      game.damageEnemy(e, baseDmg * 1.45, oldX, oldY, 260, true, '#63F5FF');
    }

    p.x += dx * 215;
    p.y += dy * 215;
    FX.addRing(p.x, p.y, 10, 95, '#63F5FF', 0.28, 7, true);
    SFX.play('magic');
  } else {
    p.dashTimer = 0.24;
    p.dashVx = dx * 760;
    p.dashVy = dy * 760;

    if (p.heroId === 'goose') {
      // HONK STAMPEDE!
      SFX.play('honk');
      FX.addShake(0.35);
      FX.addRing(p.x, p.y, 15, 165, '#FF9F2E', 0.34, 9, true);
      FX.addText(p.x, p.y - 36, callout('honk'), '#FFE047', true, 1.35);
    } else if (p.heroId === 'shiba') {
      SFX.play('zap');
      FX.addText(p.x, p.y - 34, t('⚡ 氮气全开!', '⚡ NITRO DRIFT!'), '#00F5D4', true, 1.15);
    }
  }
}
