// ============================================================================
// UI Controller, Bilingual I18N (ZH / EN), Persistence, Smart Upgrade Draft
// (with Banish + Weapon Guarantee), Chest Roulette, HUD Buffs & Boot Loop
// ============================================================================

class UIManager {
  constructor() {
    this.saveData = this._loadSave();
    this.selectedHero = this.saveData.lastHero || 'knight';
    this.turboMode = false;
    this.levelModalOpen = false;
    this.chestModalOpen = false;
    this.banishMode = false;
    this.currentDraftChoices = [];
    this._bossAlertTimer = null;
  }

  _loadSave() {
    const fallback = {
      gold: 120, // Welcome starter gold so players can try the shop right away!
      totalKills: 0,
      bestTime: 0,
      lastHero: 'knight',
      talents: {},
      achievements: {}
    };
    try {
      const raw = localStorage.getItem(GAME_META.saveKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Object.assign(fallback, parsed);
    } catch (_) {
      return fallback;
    }
  }

  persist() {
    try {
      localStorage.setItem(GAME_META.saveKey, JSON.stringify(this.saveData));
    } catch (_) {}
    this.syncGoldDisplays();
  }

  addGold(amt) {
    this.saveData.gold = Math.max(0, Math.round((this.saveData.gold || 0) + amt));
    this.persist();
  }

  syncGoldDisplays() {
    const g = this.saveData.gold || 0;
    const mEl = document.getElementById('menu-gold-text');
    const sEl = document.getElementById('shop-gold-text');
    if (mEl) mEl.textContent = g.toLocaleString();
    if (sEl) sEl.textContent = g.toLocaleString();
  }

  isModalBlocking() {
    return (
      this.levelModalOpen ||
      this.chestModalOpen ||
      !document.getElementById('modal-pause').classList.contains('hidden') ||
      !document.getElementById('modal-end').classList.contains('hidden')
    );
  }

  init() {
    this._bindMenuButtons();
    this.applyLanguage();
    this.syncGoldDisplays();
  }

  // ============================================================================
  // Seamless Bilingual Switching (ZH <-> EN)
  // ============================================================================
  toggleLanguage() {
    SFX.init();
    SFX.play('click');
    setGameLang(isEn() ? 'zh' : 'en');
    this.applyLanguage();
    this.showToastBanner(
      t('🌐 已切换为中文界面！', '🌐 Switched to English Version!'),
      '#63F5FF'
    );
  }

  applyLanguage() {
    const byId = (id) => document.getElementById(id);
    const setTxt = (id, zh, en) => {
      const el = byId(id);
      if (el) el.textContent = t(zh, en);
    };

    document.documentElement.lang = isEn() ? 'en' : 'zh-CN';
    document.title = t(
      '呆毛幸存者：离谱地下城 | AHOGE SURVIVORS',
      'AHOGE SURVIVORS: Absurdia | Cartoon Action Roguelite'
    );

    // Language toggle buttons show the OTHER language as target action
    setTxt('btn-toggle-lang', '🌐 EN', '🌐 中文');
    setTxt('btn-pause-lang', '🌐 EN', '🌐 中文');

    // Topbar & Main Menu
    setTxt('btn-open-shop', '🛒 摸鱼小卖部', '🛒 Slack Shop');
    setTxt('btn-open-codex', '📖 超武配方图鉴', '📖 Evo Codex');
    setTxt('btn-open-ach', '🏆 成就勋章', '🏆 Trophies');
    byId('btn-toggle-mute').textContent = SFX.muted
      ? t('🔇 音效: 关', '🔇 Audio: OFF')
      : t('🔊 音效: 开', '🔊 Audio: ON');

    setTxt(
      'menu-brand-badge',
      '★ 获奖级卡通Q版肉鸽割草 · Made by Carbon ★',
      '★ Award-Style Chibi Action Roguelite · Made by Carbon ★'
    );
    setTxt('menu-game-title', GAME_META.title, GAME_META.titleEn);
    setTxt('menu-game-tagline', GAME_META.tagline, GAME_META.taglineEn);

    setTxt('mode-normal', '⚔️ 标准讨伐（8分30秒决战）', '⚔️ Standard Hunt (08:30 Showdown)');
    setTxt('mode-turbo', '🔥 极速狂欢（节奏×1.75 · 经验暴涨）', '🔥 Turbo Carnival (1.75x Speed & XP)');

    const ctrlEl = byId('menu-controls-hint');
    if (ctrlEl) {
      ctrlEl.innerHTML = isEn()
        ? '🎮 <b>WASD / Arrows / Drag</b> Move · <b>Space / R-Click</b> Dash Skill · <b>Q</b> Fever Ult · <b>Tab</b> Aim Mode'
        : '🎮 <b>WASD / 方向键 / 鼠标拖拽</b> 移动 · <b>空格/右键</b> 冲刺特技 · <b>Q</b> 狂热大招 · <b>Tab</b> 切换瞄准';
    }
    setTxt('btn-start-run', '🚀 出发摸鱼！', '🚀 START RUN!');

    // X / Creator Links
    document.querySelectorAll('.i18n-follow-x-short').forEach((el) => {
      el.textContent = t('关注 X', 'Follow X');
    });
    document.querySelectorAll('.i18n-follow-x-full').forEach((el) => {
      el.textContent = t('关注 X @coolbat1999', 'Follow X @coolbat1999');
    });
    document.querySelectorAll('.i18n-close-btn').forEach((el) => {
      el.textContent = t('✖ 关闭', '✖ Close');
    });

    // Boss Alert & HUD
    setTxt('boss-alert-header', '⚠️ 高能预警 · 离谱首领降临 ⚠️', '⚠️ WARNING · ABSURD BOSS APPROACHING ⚠️');
    setTxt('btn-hud-pause', '⏸ 暂停', '⏸ Pause');
    this.syncAimBadge();

    // Level-Up Modal
    setTxt('levelup-modal-title', '✨ 摸鱼悟道 · 选择强化 ✨', '✨ LEVEL UP · PICK AN UPGRADE ✨');
    setTxt(
      'levelup-modal-sub',
      '凑齐【满级Lv.5武器 + 对应专属被动】，拾取宝箱或铁砧即可觉醒 ★超级武器！',
      'Pair a [Lv.5 Weapon + Synergy Relic], then open a Chest or Forge Anvil to awaken a ★ Super Weapon!'
    );
    setTxt('levelup-hotkey-hint', '快捷键 [1] [2] [3]', 'Hotkeys [1] [2] [3]');
    setTxt(
      'banish-mode-banner',
      '🚫 请点击下方任意一张卡牌，将其在本局永久封印排除（不消耗本次升级）！',
      '🚫 Click any card below to BANISH it for the rest of this run (replaces card for free)!'
    );
    setTxt('btn-skip-heal', '🍗 跳过并吃口烤鸡（+25 HP & +15💰）', '🍗 Skip & Eat Roast Chicken (+25 HP & +15💰)');

    // Chest Modal
    setTxt('btn-chest-claim', '⚡ 爽快收下！', '⚡ CLAIM LOOT!');

    // Shop Modal
    setTxt('shop-modal-title', '🛒 摸鱼小卖部 · 局外永久强化', '🛒 Slack-Off Tuck Shop · Permanent Upgrades');
    setTxt(
      'shop-modal-sub',
      '消耗局内收集的金币永久提升所有英雄战力，随时可免费全额退货重配！',
      'Spend gold earned in runs to permanently buff all heroes. 100% free respec anytime!'
    );
    setTxt('btn-shop-refund', '♻️ 免费洗点', '♻️ Free Respec');

    // Codex Modal
    setTxt('codex-modal-title', '📖 ★超级武器合成配方 & 离谱图鉴', '📖 ★ Super Evolution Recipes & Monster Codex');
    setTxt(
      'codex-modal-sub',
      '主武器升至 Lv.5 + 持有对应被动宝物 → 开启黄金宝箱或铁砧必出 ★超武觉醒！',
      'Max Weapon (Lv.5) + Paired Relic → Open any Golden Chest or Forge Anvil for guaranteed ★ Evolution!'
    );
    setTxt('codex-evo-heading', '⚡ 十大★超级武器进化公式', '⚡ 10 ★ Super Weapon Evolution Formulas');
    setTxt('codex-enemy-heading', '👾 地下城魔物与首领名录', '👾 Absurdia Bestiary & Stage Bosses');

    // Achievements Modal
    setTxt('ach-modal-title', '🏆 荣誉摸鱼勋章墙', '🏆 Hall of Slacking Trophies');

    // Pause Modal
    setTxt('pause-modal-title', '⏸ 战术喝水暂停中', '⏸ Tactical Hydration Pause');
    setTxt('btn-resume', '▶ 继续战斗', '▶ Resume');
    setTxt('pause-bgm-label', '🎵 背景音乐音量', '🎵 Music Volume');
    setTxt('pause-sfx-label', '💥 打击音效音量', '💥 SFX Volume');
    setTxt('pause-dps-heading', '📊 当前武器伤害统计', '📊 Live Weapon Damage Meter');
    setTxt('btn-pause-codex', '📖 查看超武配方', '📖 Evo Recipes');
    setTxt('btn-pause-restart', '🔄 重新开始', '🔄 Restart Run');
    setTxt('btn-pause-quit', '🏠 结算返回主页', '🏠 Main Menu');

    // End Summary Modal
    setTxt('end-lbl-time', '存活时间', 'Survived');
    setTxt('end-lbl-lv', '达成等级', 'Hero Level');
    setTxt('end-lbl-kills', '击败魔物', 'Monsters Slain');
    setTxt('end-lbl-gold', '收获金币', 'Gold Earned');
    setTxt('end-dps-heading', '⚔️ 本局武器输出排行榜', '⚔️ Final Weapon Damage Breakdown');
    setTxt('btn-end-endless', '🌈 继续挑战【无尽狂欢模式】！', '🌈 Continue into [ENDLESS CARNIVAL]!');
    setTxt('btn-end-retry', '🔄 再战一局！', '🔄 Play Again!');
    setTxt('btn-end-menu', '🏠 返回小卖部强化', '🏠 Upgrade in Shop');

    // Re-render dynamic views so cards immediately reflect new language
    this.renderHeroCards();
    if (!byId('modal-shop').classList.contains('hidden')) this.renderShop();
    if (!byId('modal-codex').classList.contains('hidden')) this.renderCodex();
    if (!byId('modal-ach').classList.contains('hidden')) this.renderAchievements();
    if (!byId('modal-pause').classList.contains('hidden') && GAME && GAME.running) {
      this._renderDpsChart('pause-dps-list');
    }
    if (this.levelModalOpen && GAME && GAME.running) {
      // Refresh localized fields on current draft choices without changing RNG roll!
      this.currentDraftChoices = this.currentDraftChoices.map((c) => this._rehydrateChoiceLocale(c));
      this._renderDraftCards();
    }
    if (GAME && GAME.running && GAME.player) {
      this.updateHUD(true);
    }
  }

  _bindMenuButtons() {
    const byId = (id) => document.getElementById(id);

    byId('btn-toggle-lang').addEventListener('click', () => this.toggleLanguage());
    byId('btn-pause-lang').addEventListener('click', () => this.toggleLanguage());

    byId('mode-normal').addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      this.turboMode = false;
      byId('mode-normal').classList.add('active');
      byId('mode-turbo').classList.remove('active');
    });

    byId('mode-turbo').addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      this.turboMode = true;
      byId('mode-turbo').classList.add('active');
      byId('mode-normal').classList.remove('active');
    });

    byId('btn-start-run').addEventListener('click', () => {
      SFX.init();
      SFX.play('evo');
      byId('menu-screen').classList.add('hidden');
      byId('hud').classList.remove('hidden');
      GAME.startNewRun(this.selectedHero, this.turboMode);
      this.syncAimBadge();
    });

    byId('btn-open-shop').addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      this.renderShop();
      byId('modal-shop').classList.remove('hidden');
    });

    byId('btn-open-codex').addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      this.renderCodex();
      byId('modal-codex').classList.remove('hidden');
    });

    byId('btn-open-ach').addEventListener('click', () => {
      SFX.init(); SFX.play('click');
      this.renderAchievements();
      byId('modal-ach').classList.remove('hidden');
    });

    byId('btn-toggle-mute').addEventListener('click', () => {
      SFX.init();
      SFX.setMuted(!SFX.muted);
      byId('btn-toggle-mute').textContent = SFX.muted
        ? t('🔇 音效: 关', '🔇 Audio: OFF')
        : t('🔊 音效: 开', '🔊 Audio: ON');
    });

    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SFX.play('click');
        byId(btn.getAttribute('data-close')).classList.add('hidden');
      });
    });

    byId('btn-shop-refund').addEventListener('click', () => {
      SFX.play('coin');
      let refunded = 0;
      for (const tal of SHOP_TALENTS) {
        const lv = this.saveData.talents[tal.id] || 0;
        for (let i = 0; i < lv; i++) {
          refunded += tal.baseCost + i * tal.costStep;
        }
        this.saveData.talents[tal.id] = 0;
      }
      this.saveData.gold += refunded;
      this.persist();
      this.renderShop();
      this.showToastBanner(
        t(`♻️ 已全额退还 ${refunded} 金币！`, `♻️ Refunded ${refunded} Gold in full!`),
        '#47FF9C'
      );
    });

    // HUD & Pause buttons
    byId('btn-hud-pause').addEventListener('click', () => this.togglePause());
    byId('btn-resume').addEventListener('click', () => this.togglePause());

    byId('btn-skill-dash').addEventListener('click', () => executeHeroDash(GAME));
    byId('btn-skill-fever').addEventListener('click', () => GAME.activateFever());
    byId('btn-skill-aim').addEventListener('click', () => {
      GAME.autoAim = !GAME.autoAim;
      this.syncAimBadge();
    });

    byId('slider-bgm').addEventListener('input', (e) => {
      SFX.bgmVolume = Number(e.target.value) / 100;
      SFX.updateVolumes();
    });
    byId('slider-sfx').addEventListener('input', (e) => {
      SFX.sfxVolume = Number(e.target.value) / 100;
      SFX.updateVolumes();
    });

    byId('btn-pause-codex').addEventListener('click', () => {
      this.renderCodex();
      byId('modal-codex').classList.remove('hidden');
    });

    byId('btn-pause-restart').addEventListener('click', () => {
      byId('modal-pause').classList.add('hidden');
      GAME.startNewRun(this.selectedHero, this.turboMode);
    });

    byId('btn-pause-quit').addEventListener('click', () => {
      byId('modal-pause').classList.add('hidden');
      this.returnToMenu();
    });

    // Level-Up buttons: Reroll, Banish, Skip+Heal
    byId('btn-reroll').addEventListener('click', () => {
      if (GAME.rerollsLeft <= 0) return;
      GAME.rerollsLeft--;
      this.banishMode = false;
      SFX.play('roulette');
      this._populateLevelUpCards();
    });

    byId('btn-banish').addEventListener('click', () => {
      if (GAME.banishesLeft <= 0) return;
      SFX.play('click');
      this.banishMode = !this.banishMode;
      this._renderDraftCards();
    });

    byId('btn-skip-heal').addEventListener('click', () => {
      SFX.play('heal');
      this.banishMode = false;
      GAME.player.hp = Math.min(GAME.stats.maxHp, GAME.player.hp + 25);
      GAME.goldEarned += 15;
      this.addGold(15);
      this.closeLevelUpModal();
    });

    // Chest claim
    byId('btn-chest-claim').addEventListener('click', () => {
      SFX.play('click');
      this.chestModalOpen = false;
      byId('modal-chest').classList.add('hidden');
      GAME.paused = false;
      this.updateHUD(true);
    });

    // End modal buttons
    byId('btn-end-endless').addEventListener('click', () => {
      SFX.play('evo');
      byId('modal-end').classList.add('hidden');
      GAME.endlessMode = true;
      GAME.victory = false;
      GAME.paused = false;
      SFX.startBgm('normal');
      this.showToastBanner(
        t('🌈 无尽狂欢模式开启！看看你的电脑和呆毛谁先冒烟！', '🌈 ENDLESS CARNIVAL UNLEASHED! Push your build past the limit!'),
        '#63F5FF'
      );
    });

    byId('btn-end-retry').addEventListener('click', () => {
      SFX.play('evo');
      byId('modal-end').classList.add('hidden');
      GAME.startNewRun(this.selectedHero, this.turboMode);
    });

    byId('btn-end-menu').addEventListener('click', () => {
      SFX.play('click');
      byId('modal-end').classList.add('hidden');
      this.returnToMenu();
    });
  }

  returnToMenu() {
    GAME.running = false;
    GAME.paused = false;
    SFX.stopBgm();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    this.syncGoldDisplays();
  }

  syncAimBadge() {
    const el = document.getElementById('hud-aim-label');
    if (!el) return;
    const auto = GAME ? GAME.autoAim : true;
    el.textContent = auto ? t('🎯 自动索敌', '🎯 Auto-Aim') : t('🖱️ 鼠标瞄准', '🖱️ Cursor Aim');
  }

  renderHeroCards() {
    const grid = document.getElementById('hero-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const h of HEROES) {
      const selected = h.id === this.selectedHero;
      const wDef = WEAPONS[h.starterWeapon];
      const portrait = SPRITES.heroes[h.id].portraitUrl;
      const wIcon = SPRITES.iconUrls[h.starterWeapon];

      const hName = L(h, 'name');
      const hTitle = L(h, 'title');
      const wName = L(wDef, 'name');
      const wTag = L(wDef, 'tag');
      const pasDesc = L(h, 'passiveDesc');
      const dashName = L(h.dash, 'name');
      const dashDesc = L(h.dash, 'desc');
      const quote = L(h, 'quote');
      const checkLabel = t('✔ 出战勇者', '✔ SELECTED');
      const starterPrefix = t('初始：', 'Starter: ');
      const spaceKey = t('空格', 'Space');

      const card = document.createElement('div');
      card.className = `hero-card ${selected ? 'selected' : ''}`;
      card.innerHTML = `
        ${selected ? `<div class="hero-card-check">${checkLabel}</div>` : ''}
        <div class="hero-card-top">
          <div class="hero-portrait-box"><img src="${portrait}" alt="${hName}" /></div>
          <div>
            <h3 class="hero-name">${hName}</h3>
            <span class="hero-role-badge">${hTitle}</span>
          </div>
        </div>
        <div class="hero-weapon-row">
          <img src="${wIcon}" alt="${wName}" />
          <div>
            <div style="font-size:13px; font-weight:900; color:#FFE066;">${starterPrefix}${wName}</div>
            <div style="font-size:11px; color:var(--muted);">${wTag}</div>
          </div>
        </div>
        <div class="hero-passive">✦ ${pasDesc}</div>
        <div class="hero-dash-desc">⚡ <b>[${spaceKey}] ${dashName}</b>: ${dashDesc}</div>
        <div class="hero-quote">${quote}</div>
      `;

      card.addEventListener('click', () => {
        SFX.init();
        SFX.play('click');
        this.selectedHero = h.id;
        this.saveData.lastHero = h.id;
        this.persist();
        this.renderHeroCards();
      });

      grid.appendChild(card);
    }
  }

  // ============================================================================
  // Live Battle HUD Sync (With Next-Boss Countdown & Active Buff Pills!)
  // ============================================================================
  updateHUD(rebuildSlots = false) {
    if (!GAME.player) return;
    const p = GAME.player;
    const s = GAME.stats;

    document.getElementById('hud-xp-fill').style.width = `${clamp((p.xp / p.xpNext) * 100, 0, 100)}%`;
    document.getElementById('hud-level-text').textContent = `Lv.${p.level}`;
    document.getElementById('hud-hp-fill').style.width = `${clamp((p.hp / s.maxHp) * 100, 0, 100)}%`;
    document.getElementById('hud-hp-text').textContent = `${Math.ceil(p.hp)} / ${Math.round(s.maxHp)}`;
    document.getElementById('hud-timer').textContent = formatTime(GAME.runTime);
    document.getElementById('hud-kills').textContent = GAME.kills.toLocaleString();
    document.getElementById('hud-gold').textContent = GAME.goldEarned.toLocaleString();
    document.getElementById('hud-fps').textContent = `${GAME.fps} FPS`;

    // Dash skill button state
    const dashBtn = document.getElementById('btn-skill-dash');
    const dashLbl = document.getElementById('hud-dash-label');
    if (p.dashCd <= 0.05) {
      dashBtn.classList.add('ready');
      dashLbl.textContent = t('冲刺就绪', 'Dash Ready');
    } else {
      dashBtn.classList.remove('ready');
      dashLbl.textContent = t(`冷却 ${p.dashCd.toFixed(1)}s`, `CD ${p.dashCd.toFixed(1)}s`);
    }

    // Fever Ultimate button state
    const fevBtn = document.getElementById('btn-skill-fever');
    const fevLbl = document.getElementById('hud-fever-label');
    if (GAME.feverTimer > 0) {
      fevBtn.classList.add('fever-ready');
      fevLbl.textContent = t(`🌈 爆发中 ${GAME.feverTimer.toFixed(1)}s`, `🌈 FEVER ${GAME.feverTimer.toFixed(1)}s`);
    } else if (GAME.feverGauge >= 100) {
      fevBtn.classList.add('fever-ready');
      fevLbl.textContent = t('🔥 狂热就绪! [Q]', '🔥 FEVER READY! [Q]');
    } else {
      fevBtn.classList.remove('fever-ready');
      fevLbl.textContent = t(`狂热 ${Math.floor(GAME.feverGauge)}%`, `Fever ${Math.floor(GAME.feverGauge)}%`);
    }

    // Boss HP Bar & Next Boss Countdown Pill
    const bossBox = document.getElementById('hud-boss-box');
    const nextBossEl = document.getElementById('hud-next-boss');
    const b = GAME.activeBoss;
    if (b && !b.dead) {
      bossBox.classList.remove('hidden');
      if (nextBossEl) nextBossEl.classList.add('hidden');
      document.getElementById('hud-boss-name').textContent = `💀 ${L(b, 'name')} (${Math.max(0, Math.ceil(b.hp))} / ${b.maxHp})`;
      document.getElementById('hud-boss-fill').style.width = `${clamp((b.hp / b.maxHp) * 100, 0, 100)}%`;
    } else {
      bossBox.classList.add('hidden');
      if (nextBossEl) {
        if (GAME.director && GAME.director.bossIndex < BOSSES.length) {
          const nextBossDef = BOSSES[GAME.director.bossIndex];
          const rem = Math.max(0, nextBossDef.spawnTime - GAME.runTime);
          nextBossEl.classList.remove('hidden');
          nextBossEl.classList.toggle('imminent', rem <= 15);
          nextBossEl.textContent = t(
            `⏳ 首领降临 ${formatTime(rem)}`,
            `⏳ Next Boss ${formatTime(rem)}`
          );
        } else if (GAME.endlessMode) {
          nextBossEl.classList.remove('hidden');
          nextBossEl.classList.remove('imminent');
          nextBossEl.textContent = t('♾️ 无尽狂欢模式', '♾️ Endless Carnival');
        } else {
          nextBossEl.classList.add('hidden');
        }
      }
    }

    // Active Timed Buff Pills (Fever, Spicy Chili, Time Freeze, Shield)
    const buffRow = document.getElementById('hud-buffs');
    if (buffRow) {
      const buffs = [];
      if (GAME.feverTimer > 0) buffs.push(`<span class="buff-pill" style="border-color:#63F5FF; color:#9CF8FF;">🌈 ${t('狂热', 'Fever')} ${GAME.feverTimer.toFixed(1)}s</span>`);
      if (GAME.spicyTimer > 0) buffs.push(`<span class="buff-pill" style="border-color:#FF5263; color:#FFB3BC;">🌶️ ${t('喷火', 'Spicy')} ${GAME.spicyTimer.toFixed(1)}s</span>`);
      if (GAME.freezeTimer > 0) buffs.push(`<span class="buff-pill" style="border-color:#7CE8FF; color:#D4F8FF;">❄️ ${t('时停', 'Freeze')} ${GAME.freezeTimer.toFixed(1)}s</span>`);
      if (p.invulnTimer > 0.65) buffs.push(`<span class="buff-pill" style="border-color:#47FF9C; color:#A8FFD2;">🛡️ ${t('金身', 'Shield')} ${p.invulnTimer.toFixed(1)}s</span>`);
      const html = buffs.join('');
      if (buffRow._lastHtml !== html) {
        buffRow._lastHtml = html;
        buffRow.innerHTML = html;
      }
    }

    if (rebuildSlots) {
      const hero = HEROES.find((h) => h.id === p.heroId);
      document.getElementById('hud-avatar').src = SPRITES.heroes[p.heroId].portraitUrl;
      document.getElementById('hud-hero-name').textContent = L(hero, 'name');

      const wRow = document.getElementById('hud-weapons');
      wRow.innerHTML = '';
      for (let i = 0; i < GAME_META.maxWeapons; i++) {
        const w = GAME.weapons[i];
        const div = document.createElement('div');
        div.className = `item-slot ${w && w.evolved ? 'evo' : ''}`;
        if (w) {
          const wDef = WEAPONS[w.id];
          const iconKey = w.evolved ? wDef.evoId : w.id;
          div.title = w.evolved ? `★ ${L(wDef, 'evoName')}` : `${L(wDef, 'name')} Lv.${w.level}`;
          div.innerHTML = `<img src="${SPRITES.iconUrls[iconKey]}" alt="" /><span class="slot-lv">${w.evolved ? '★' : 'L' + w.level}</span>`;
        }
        wRow.appendChild(div);
      }

      const pRow = document.getElementById('hud-passives');
      pRow.innerHTML = '';
      for (let i = 0; i < GAME_META.maxPassives; i++) {
        const pas = GAME.passives[i];
        const div = document.createElement('div');
        div.className = 'item-slot';
        if (pas) {
          const pDef = PASSIVES[pas.id];
          div.title = `${L(pDef, 'name')} Lv.${pas.level}`;
          div.innerHTML = `<img src="${SPRITES.iconUrls[pas.id]}" alt="" /><span class="slot-lv">L${pas.level}</span>`;
        }
        pRow.appendChild(div);
      }
    }
  }

  // ============================================================================
  // Smart Level-Up Upgrade Draft (Synergy Hints + Weapon Guarantee + Banish!)
  // ============================================================================
  openLevelUpModal() {
    this.levelModalOpen = true;
    this.banishMode = false;
    GAME.paused = true;
    document.getElementById('modal-levelup').classList.remove('hidden');
    this._populateLevelUpCards();
  }

  closeLevelUpModal() {
    this.levelModalOpen = false;
    this.banishMode = false;
    document.getElementById('modal-levelup').classList.add('hidden');
    this.updateHUD(true);
    if (GAME.pendingLevelUps > 0) {
      GAME.pendingLevelUps--;
      this.openLevelUpModal();
    } else {
      GAME.paused = false;
    }
  }

  _buildUpgradeCandidates() {
    const pool = [];
    const ownedWMap = new Map(GAME.weapons.map((w) => [w.id, w]));
    const ownedPMap = new Map(GAME.passives.map((p) => [p.id, p]));

    // Weapons (respecting Banished IDs)
    for (const wDef of Object.values(WEAPONS)) {
      if (GAME.banishedIds.has(wDef.id)) continue;
      const owned = ownedWMap.get(wDef.id);
      const pDef = PASSIVES[wDef.pairPassive];
      const hasPair = ownedPMap.has(wDef.pairPassive);

      if (owned) {
        if (!owned.evolved && owned.level < 5) {
          const nextLv = owned.level + 1;
          const descArr = isEn() && wDef.levelDescsEn ? wDef.levelDescsEn : wDef.levelDescs;
          pool.push({
            kind: 'weapon',
            id: wDef.id,
            nextLv,
            name: L(wDef, 'name'),
            icon: SPRITES.iconUrls[wDef.id],
            tag: nextLv === 5
              ? t('🔥 满级可进化!', '🔥 MAX · EVO READY!')
              : t(`武器 Lv.${owned.level} ➜ Lv.${nextLv}`, `Weapon Lv.${owned.level} ➜ Lv.${nextLv}`),
            isNew: false,
            isMax: nextLv === 5,
            desc: descArr[nextLv - 1],
            synergyText: t(
              `⚡ 超武配方：搭配【${pDef.name}】${hasPair ? '✅已集齐' : ''}`,
              `⚡ Evo Pair: [${pDef.nameEn}] ${hasPair ? '✅ Owned' : ''}`
            ),
            synergyReady: hasPair,
            weight: hasPair ? 20 : 15
          });
        }
      } else if (GAME.weapons.length < GAME_META.maxWeapons) {
        pool.push({
          kind: 'weapon',
          id: wDef.id,
          nextLv: 1,
          name: L(wDef, 'name'),
          icon: SPRITES.iconUrls[wDef.id],
          tag: t('✨ 新武器解锁', '✨ NEW WEAPON'),
          isNew: true,
          isMax: false,
          desc: L(wDef, 'desc'),
          synergyText: t(
            `⚡ 超武配方：搭配【${pDef.name}】${hasPair ? '✅已持有' : ''}`,
            `⚡ Evo Pair: [${pDef.nameEn}] ${hasPair ? '✅ Owned' : ''}`
          ),
          synergyReady: hasPair,
          weight: hasPair ? 16 : 11
        });
      }
    }

    // Passives (respecting Banished IDs)
    for (const pDef of Object.values(PASSIVES)) {
      if (GAME.banishedIds.has(pDef.id)) continue;
      const owned = ownedPMap.get(pDef.id);
      const pairW = WEAPONS[pDef.pairWeapon];
      const hasWeapon = ownedWMap.has(pDef.pairWeapon);

      if (owned) {
        if (owned.level < pDef.maxLevel) {
          const nextLv = owned.level + 1;
          pool.push({
            kind: 'passive',
            id: pDef.id,
            nextLv,
            name: L(pDef, 'name'),
            icon: SPRITES.iconUrls[pDef.id],
            tag: t(`宝物 Lv.${owned.level} ➜ Lv.${nextLv}`, `Relic Lv.${owned.level} ➜ Lv.${nextLv}`),
            isNew: false,
            isMax: nextLv === pDef.maxLevel,
            desc: `${L(pDef, 'desc')} (${pDef.statDesc(nextLv)})`,
            synergyText: t(
              `⚡ 觉醒组件：【${pairW.name} ➜ ★${pairW.evoName}】${hasWeapon ? '✅已配对' : ''}`,
              `⚡ Awakens: [${pairW.nameEn} ➜ ★ ${pairW.evoNameEn}] ${hasWeapon ? '✅ Paired' : ''}`
            ),
            synergyReady: hasWeapon,
            weight: hasWeapon ? 15 : 10
          });
        }
      } else if (GAME.passives.length < GAME_META.maxPassives) {
        pool.push({
          kind: 'passive',
          id: pDef.id,
          nextLv: 1,
          name: L(pDef, 'name'),
          icon: SPRITES.iconUrls[pDef.id],
          tag: t('✨ 新被动宝物', '✨ NEW RELIC'),
          isNew: true,
          isMax: false,
          desc: L(pDef, 'desc'),
          synergyText: t(
            `⚡ 觉醒组件：【${pairW.name} ➜ ★${pairW.evoName}】${hasWeapon ? '✅可配对!' : ''}`,
            `⚡ Awakens: [${pairW.nameEn} ➜ ★ ${pairW.evoNameEn}] ${hasWeapon ? '✅ Pair!' : ''}`
          ),
          synergyReady: hasWeapon,
          weight: hasWeapon ? 16 : 8
        });
      }
    }

    return pool;
  }

  _buildFallbackChoices() {
    return [
      {
        kind: 'bonus_might',
        name: t('呆毛极限突破', 'Ahoge Limit Break'),
        icon: SPRITES.iconUrls.spinach,
        tag: t('♾️ 巅峰强化', '♾️ LIMITLESS'),
        desc: t('本局所有武器伤害额外永久提升 +8%！', 'Permanently boosts ALL Weapon Damage by +8% for this run!'),
        synergyText: t('⚡ 无上限巅峰突破', '⚡ Infinite Mastery Scaling')
      },
      {
        kind: 'bonus_heal',
        name: t('豪华至尊烤全鸡', 'Supreme Roast Feast'),
        icon: SPRITES.props.chicken_leg.toDataURL(),
        tag: t('🍗 满汉全席', '🍗 ROYAL FEAST'),
        desc: t('立即恢复 65 点生命值，并提升 +10 最大生命！', 'Restores 65 HP immediately and grants +10 Max HP!'),
        synergyText: t('⚡ 活着才有DPS！', '⚡ Survival = More DPS!')
      },
      {
        kind: 'bonus_gold',
        name: t('老板的私房红包', 'Boss’s Secret Bonus'),
        icon: SPRITES.iconUrls.lucky_cat,
        tag: t('💰 暴富奖励', '💰 BONUS GOLD'),
        desc: t('立即塞进腰包 +55 金币！', 'Pockets +55 Gold immediately!'),
        synergyText: t('⚡ 可在摸鱼小卖部永久升阶', '⚡ Spend in Tuck Shop for permanent stats')
      }
    ];
  }

  _rehydrateChoiceLocale(c) {
    if (c.id) {
      const fresh = this._buildUpgradeCandidates().find((x) => x.id === c.id && x.kind === c.kind);
      if (fresh) return fresh;
    }
    const fb = this._buildFallbackChoices().find((x) => x.kind === c.kind);
    return fb || c;
  }

  _pickWeighted(list) {
    let totalW = 0;
    for (const c of list) totalW += c.weight;
    let r = Math.random() * totalW;
    for (let i = 0; i < list.length; i++) {
      r -= list[i].weight;
      if (r <= 0) return i;
    }
    return 0;
  }

  _populateLevelUpCards() {
    const candidates = this._buildUpgradeCandidates();
    const chosen = [];

    // Guarantee at least 1 Weapon option whenever eligible weapon upgrades/slots exist!
    const weaponPool = candidates.filter((c) => c.kind === 'weapon');
    if (weaponPool.length > 0) {
      const wPick = weaponPool[this._pickWeighted(weaponPool)];
      chosen.push(wPick);
      const idxInAll = candidates.indexOf(wPick);
      if (idxInAll >= 0) candidates.splice(idxInAll, 1);
    }

    while (chosen.length < 3 && candidates.length > 0) {
      const pickedIdx = this._pickWeighted(candidates);
      chosen.push(candidates[pickedIdx]);
      candidates.splice(pickedIdx, 1);
    }

    // Shuffle chosen order so the guaranteed weapon isn't always slot [1]
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = chosen[i];
      chosen[i] = chosen[j];
      chosen[j] = tmp;
    }

    // Fallback limitless upgrades when build is 100% maxed out!
    const fallbacks = this._buildFallbackChoices();
    let fIdx = 0;
    while (chosen.length < 3) {
      chosen.push(fallbacks[fIdx++ % fallbacks.length]);
    }

    this.currentDraftChoices = chosen;
    this._renderDraftCards();
  }

  _renderDraftCards() {
    const container = document.getElementById('levelup-cards');
    const banishBanner = document.getElementById('banish-mode-banner');
    if (banishBanner) banishBanner.classList.toggle('hidden', !this.banishMode);

    container.innerHTML = '';
    this.currentDraftChoices.forEach((c, idx) => {
      const canBanishCard = this.banishMode && !!c.id;
      const card = document.createElement('div');
      card.className = `upgrade-card ${c.isNew ? 'is-new' : ''} ${c.isMax ? 'is-max' : ''} ${canBanishCard ? 'banish-target' : ''}`;
      card.innerHTML = `
        <div style="position:absolute; top:10px; right:12px; font-size:12px; font-weight:900; color:${canBanishCard ? 'var(--coral)' : 'var(--muted)'};">
          ${canBanishCard ? t('🚫 封印', '🚫 BANISH') : `[${idx + 1}]`}
        </div>
        <div class="upg-top">
          <img src="${c.icon}" alt="${c.name}" />
          <div>
            <span class="upg-tag">${c.tag}</span>
            <h3 class="upg-name">${c.name}</h3>
          </div>
        </div>
        <div class="upg-desc">${c.desc}</div>
        <div class="upg-synergy ${c.synergyReady ? 'ready' : ''}">${c.synergyText}</div>
      `;
      card.addEventListener('click', () => this.pickUpgradeByIndex(idx));
      container.appendChild(card);
    });

    const rerollBtn = document.getElementById('btn-reroll');
    rerollBtn.textContent = t(
      `🎲 甲方改需求（刷新: ${GAME.rerollsLeft}）`,
      `🎲 Reroll (${GAME.rerollsLeft} left)`
    );
    rerollBtn.disabled = GAME.rerollsLeft <= 0;
    rerollBtn.style.opacity = GAME.rerollsLeft <= 0 ? '0.45' : '1';

    const banishBtn = document.getElementById('btn-banish');
    if (banishBtn) {
      banishBtn.classList.toggle('btn-coral', this.banishMode);
      banishBtn.textContent = this.banishMode
        ? t('✖ 取消封印模式', '✖ Cancel Banish')
        : t(`🚫 封印排除（剩余: ${GAME.banishesLeft}）`, `🚫 Banish (${GAME.banishesLeft} left)`);
      banishBtn.disabled = GAME.banishesLeft <= 0 && !this.banishMode;
      banishBtn.style.opacity = GAME.banishesLeft <= 0 && !this.banishMode ? '0.45' : '1';
    }
  }

  pickUpgradeByIndex(idx) {
    if (!this.levelModalOpen || !this.currentDraftChoices[idx]) return;
    const c = this.currentDraftChoices[idx];

    // Handle Banish Mode!
    if (this.banishMode) {
      if (!c.id) {
        this.banishMode = false;
        this._renderDraftCards();
        return;
      }
      GAME.banishedIds.add(c.id);
      GAME.banishesLeft = Math.max(0, GAME.banishesLeft - 1);
      this.banishMode = false;
      SFX.play('hurt');
      this.showToastBanner(
        t(`🚫 已永久封印【${c.name}】，本局不再出现！`, `🚫 Banished [${c.name}] for the rest of this run!`),
        '#FF5768'
      );

      // Replace just the banished card with a fresh unbanished option for free!
      const existingIds = new Set(this.currentDraftChoices.map((x) => x.id).filter(Boolean));
      const freshPool = this._buildUpgradeCandidates().filter((x) => !existingIds.has(x.id));
      if (freshPool.length > 0) {
        this.currentDraftChoices[idx] = freshPool[this._pickWeighted(freshPool)];
      } else {
        this.currentDraftChoices[idx] = this._buildFallbackChoices()[0];
      }
      this._renderDraftCards();
      return;
    }

    SFX.play('click');
    if (c.kind === 'weapon') GAME.addWeapon(c.id);
    else if (c.kind === 'passive') GAME.addPassive(c.id);
    else if (c.kind === 'bonus_might') GAME.stats.might *= 1.08;
    else if (c.kind === 'bonus_heal') {
      GAME.stats.maxHp += 10;
      GAME.player.hp = Math.min(GAME.stats.maxHp, GAME.player.hp + 65);
    } else if (c.kind === 'bonus_gold') {
      GAME.goldEarned += 55;
      this.addGold(55);
    }

    this.closeLevelUpModal();
  }

  // ============================================================================
  // Exciting Boss Treasure Chest Roulette Modal!
  // ============================================================================
  openChestModal() {
    this.chestModalOpen = true;
    GAME.paused = true;
    SFX.play('evo');

    const modal = document.getElementById('modal-chest');
    const title = document.getElementById('chest-title');
    const sub = document.getElementById('chest-subtitle');
    const area = document.getElementById('chest-rewards-area');
    modal.classList.remove('hidden');
    area.innerHTML = '';

    // Check for ★ Super Weapon Evolution first!
    const evolvable = GAME.getEvolvableWeapons();
    const rewards = [];

    if (evolvable.length > 0) {
      const w = evolvable[0];
      const wDef = WEAPONS[w.id];
      GAME.evolveWeapon(w);
      title.textContent = t('🌟 传说超武觉醒！！ 🌟', '🌟 SUPER WEAPON AWAKENED!! 🌟');
      sub.textContent = t(
        `【${wDef.name}】吸收宝物之力，进化为毁天灭地的★超级武器！`,
        `[${wDef.nameEn}] fused with its synergy relic into an unstoppable ★ Super Weapon!`
      );
      rewards.push({
        icon: SPRITES.iconUrls[wDef.evoId],
        title: `★ ${L(wDef, 'evoName')}`,
        desc: L(wDef, 'evoDesc'),
        highlight: true
      });
      const bonusGold = Math.round(45 * GAME.stats.goldMult);
      GAME.goldEarned += bonusGold;
      this.addGold(bonusGold);
      rewards.push({
        icon: SPRITES.iconUrls.lucky_cat,
        title: t(`附赠暴富金币 +${bonusGold} 💰`, `Bonus Jackpot Gold +${bonusGold} 💰`),
        desc: t('老板含泪发出的加班补贴！', 'Overtime hazard pay reluctantly approved by management!'),
        highlight: false
      });
    } else {
      // Roll 1x, 3x, or 5x Jackpot!
      const roll = Math.random() * GAME.stats.luck;
      const count = roll > 1.22 ? 5 : roll > 0.72 ? 3 : 1;
      title.textContent = count === 5
        ? t('🎰 五连绝世欧皇宝箱！！', '🎰 5x GODLIKE JACKPOT CHEST!!')
        : count === 3
        ? t('🎉 三连惊喜黄金宝箱！', '🎉 3x TRIPLE LUCKY CHEST!')
        : t('🎁 离谱黄金宝箱开启！', '🎁 GOLDEN TREASURE CHEST!');
      sub.textContent = t(
        `获得了 ${count} 项战力强化与大袋金币！`,
        `Unboxed ${count} power upgrade${count > 1 ? 's' : ''} plus a fat pouch of gold!`
      );

      for (let i = 0; i < count; i++) {
        const pool = this._buildUpgradeCandidates().filter((x) => !x.isNew);
        const targetPool = pool.length > 0 ? pool : this._buildUpgradeCandidates();
        if (targetPool.length > 0) {
          const item = pick(targetPool);
          if (item.kind === 'weapon') GAME.addWeapon(item.id);
          else if (item.kind === 'passive') GAME.addPassive(item.id);
          rewards.push({
            icon: item.icon,
            title: `${item.name} (${item.tag})`,
            desc: item.desc,
            highlight: item.isMax
          });
        }
      }

      const bonusGold = Math.round((28 + count * 16) * GAME.stats.goldMult);
      GAME.goldEarned += bonusGold;
      this.addGold(bonusGold);
      rewards.push({
        icon: SPRITES.iconUrls.lucky_cat,
        title: t(`宝箱金币 +${bonusGold} 💰`, `Treasure Gold +${bonusGold} 💰`),
        desc: t('已自动存入摸鱼小卖部账户！', 'Automatically deposited into your Tuck Shop vault!'),
        highlight: false
      });
    }

    for (const r of rewards) {
      const row = document.createElement('div');
      row.className = 'shop-item';
      if (r.highlight) row.style.borderColor = 'var(--gold)';
      row.style.flexDirection = 'row';
      row.style.alignItems = 'center';
      row.style.textAlign = 'left';
      row.innerHTML = `
        <img src="${r.icon}" style="width:52px; height:52px; border-radius:12px; border:2.5px solid var(--ink);" alt="" />
        <div>
          <div style="font-size:17px; font-weight:900; color:${r.highlight ? 'var(--gold)' : '#FFF'};">${r.title}</div>
          <div style="font-size:13px; color:var(--muted); margin-top:2px;">${r.desc}</div>
        </div>
      `;
      area.appendChild(row);
    }
  }

  // ============================================================================
  // Shop, Codex, Achievements, Pause & End Summary Modals
  // ============================================================================
  renderShop() {
    this.syncGoldDisplays();
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    for (const tal of SHOP_TALENTS) {
      const lv = this.saveData.talents[tal.id] || 0;
      const isMax = lv >= tal.max;
      const cost = tal.baseCost + lv * tal.costStep;
      const canAfford = (this.saveData.gold || 0) >= cost;

      const card = document.createElement('div');
      card.className = 'shop-item';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="font-weight:900; font-size:15.5px; color:var(--gold);">${L(tal, 'name')}</span>
          <span style="font-size:12px; font-weight:900; color:var(--cyan); white-space:nowrap;">Lv.${lv}/${tal.max} (${tal.bonusText(lv)})</span>
        </div>
        <div style="font-size:12.5px; color:var(--muted); flex-grow:1;">${L(tal, 'desc')}</div>
        <button class="btn btn-sm ${isMax ? '' : canAfford ? 'btn-gold' : ''}" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? t('✨ 已满级', '✨ MAXED') : t(`💰 ${cost} 升级`, `💰 ${cost} Upgrade`)}
        </button>
      `;

      const btn = card.querySelector('button');
      if (isMax || !canAfford) btn.style.opacity = '0.5';
      btn.addEventListener('click', () => {
        if (isMax || this.saveData.gold < cost) return;
        this.saveData.gold -= cost;
        this.saveData.talents[tal.id] = lv + 1;
        SFX.play('coin');
        this.persist();
        this.renderShop();
      });

      grid.appendChild(card);
    }
  }

  renderCodex() {
    const evoGrid = document.getElementById('codex-evo-grid');
    evoGrid.innerHTML = '';

    for (const w of Object.values(WEAPONS)) {
      const p = PASSIVES[w.pairPassive];
      const div = document.createElement('div');
      div.className = 'codex-item';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${SPRITES.iconUrls[w.id]}" style="width:40px;height:40px;border-radius:10px;border:2px solid var(--ink);" />
          <span style="font-weight:900;">➕</span>
          <img src="${SPRITES.iconUrls[p.id]}" style="width:40px;height:40px;border-radius:10px;border:2px solid var(--ink);" />
          <span style="font-weight:900; color:var(--gold);">➜</span>
          <img src="${SPRITES.iconUrls[w.evoId]}" style="width:44px;height:44px;border-radius:10px;border:2.5px solid var(--gold);" />
        </div>
        <div style="font-size:14px; font-weight:900; color:var(--gold);">★ ${L(w, 'evoName')}</div>
        <div style="font-size:12px; color:var(--cyan);">${t('配方：', 'Recipe: ')}${L(w, 'name')} (Lv.5) + ${L(p, 'name')}</div>
        <div style="font-size:12px; color:var(--muted);">${L(w, 'evoDesc')}</div>
      `;
      evoGrid.appendChild(div);
    }

    const enemyGrid = document.getElementById('codex-enemy-grid');
    enemyGrid.innerHTML = '';

    for (const b of BOSSES) {
      const imgUrl = SPRITES.bosses[b.id].frames[0].toDataURL();
      const div = document.createElement('div');
      div.className = 'codex-item';
      div.style.borderColor = 'var(--coral)';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${imgUrl}" style="width:54px;height:54px;object-fit:contain;" />
          <div>
            <div style="font-size:14px; font-weight:900; color:#FF7082;">💀 ${L(b, 'name')}</div>
            <div style="font-size:11px; color:var(--gold);">${t('降临时间：', 'ETA: ')}${formatTime(b.spawnTime)}</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--muted);">${L(b, 'quote')}</div>
      `;
      enemyGrid.appendChild(div);
    }

    for (const e of Object.values(ENEMY_TYPES)) {
      const imgUrl = SPRITES.enemies[e.id].frames[0].toDataURL();
      const div = document.createElement('div');
      div.className = 'codex-item';
      div.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${imgUrl}" style="width:46px;height:46px;object-fit:contain;" />
          <div>
            <div style="font-size:14px; font-weight:900;">${L(e, 'name')}</div>
            <div style="font-size:11px; color:var(--mint);">HP: ${e.hp} · ${t('移速', 'SPD')}: ${e.speed}</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--muted);">${L(e, 'desc')}</div>
      `;
      enemyGrid.appendChild(div);
    }
  }

  renderAchievements() {
    const grid = document.getElementById('ach-grid');
    grid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const done = !!this.saveData.achievements[a.id];
      const div = document.createElement('div');
      div.className = 'codex-item';
      if (done) div.style.borderColor = 'var(--gold)';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:900; font-size:15px; color:${done ? 'var(--gold)' : '#FFF'};">${done ? '🏆' : '🔒'} ${L(a, 'name')}</span>
          <span style="font-size:12px; font-weight:900; color:var(--mint);">+${a.reward}💰</span>
        </div>
        <div style="font-size:12.5px; color:var(--muted);">${L(a, 'desc')}</div>
      `;
      grid.appendChild(div);
    }
  }

  unlockAchievement(id) {
    if (this.saveData.achievements[id]) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    this.saveData.achievements[id] = true;
    this.saveData.gold = (this.saveData.gold || 0) + def.reward;
    this.persist();
    this.showToastBanner(
      t(
        `🏆 解锁成就【${def.name}】！奖励 +${def.reward}💰`,
        `🏆 Trophy Unlocked: [${def.nameEn}]! +${def.reward}💰`
      ),
      '#FFD84D'
    );
  }

  togglePause() {
    if (!GAME.running || GAME.gameOver) return;
    const modal = document.getElementById('modal-pause');
    if (modal.classList.contains('hidden')) {
      GAME.paused = true;
      this._renderDpsChart('pause-dps-list');
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
      GAME.paused = false;
    }
  }

  _renderDpsChart(containerId) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    const sorted = [...GAME.weapons].sort((a, b) => b.totalDmg - a.totalDmg);
    const maxDmg = Math.max(1, sorted[0] ? sorted[0].totalDmg : 1);

    for (const w of sorted) {
      const def = WEAPONS[w.id];
      const name = w.evolved ? `★ ${L(def, 'evoName')}` : `${L(def, 'name')} Lv.${w.level}`;
      const icon = SPRITES.iconUrls[w.evolved ? def.evoId : w.id];
      const pct = Math.round((w.totalDmg / maxDmg) * 100);

      const row = document.createElement('div');
      row.className = 'dps-row';
      row.innerHTML = `
        <img src="${icon}" alt="" />
        <div style="width:185px; font-size:13px; font-weight:900; color:${w.evolved ? 'var(--gold)' : '#FFF'};">${name}</div>
        <div class="dps-bar-bg"><div class="dps-bar-fill" style="width:${pct}%"></div></div>
        <div style="width:78px; text-align:right; font-size:13px; font-weight:900;">${Math.round(w.totalDmg).toLocaleString()}</div>
      `;
      el.appendChild(row);
    }
  }

  openEndModal(isVictory) {
    const modal = document.getElementById('modal-end');
    const title = document.getElementById('end-title');
    const sub = document.getElementById('end-subtitle');
    const endlessBtn = document.getElementById('btn-end-endless');

    if (isVictory) {
      SFX.play('evo');
      title.textContent = t('🎉 讨伐大捷！星期一被你打哭了！', '🎉 VICTORY! ARCH-DEMON MONDAY CRUSHED!');
      title.style.color = 'var(--gold)';
      sub.textContent = t(
        '恭喜通关！已发放 200 金币凯旋奖金，你还可以继续挑战无尽狂欢模式！',
        'Congratulations! +200 Victory Gold awarded — or dive straight into Endless Carnival!'
      );
      GAME.goldEarned += 200;
      this.addGold(200);
      endlessBtn.classList.remove('hidden');
    } else {
      title.textContent = t('💀 摸鱼翻车 · 被抓去加班了！', '💀 BUSTED · DRAGGED BACK TO OVERTIME!');
      title.style.color = 'var(--coral)';
      sub.textContent = t(
        '别灰心！去【摸鱼小卖部】用刚才赚到的金币升波属性，回来乱杀！',
        'No sweat! Spend your freshly earned gold in the Slack Shop and come back stronger!'
      );
      endlessBtn.classList.add('hidden');
    }

    if (GAME.runTime > (this.saveData.bestTime || 0)) {
      this.saveData.bestTime = GAME.runTime;
      this.persist();
    }

    document.getElementById('end-time').textContent = formatTime(GAME.runTime);
    document.getElementById('end-lv').textContent = `Lv.${GAME.player.level}`;
    document.getElementById('end-kills').textContent = GAME.kills.toLocaleString();
    document.getElementById('end-gold').textContent = `+${GAME.goldEarned.toLocaleString()} 💰`;

    this._renderDpsChart('end-dps-list');
    modal.classList.remove('hidden');
  }

  showToastBanner(text, color = '#FFD84D') {
    const stack = document.getElementById('toast-stack');
    const item = document.createElement('div');
    item.className = 'toast-item';
    item.style.borderColor = color;
    item.style.color = color;
    item.textContent = text;
    stack.appendChild(item);

    while (stack.children.length > 4) {
      stack.removeChild(stack.firstChild);
    }
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 3600);
  }

  showBossAlert(boss) {
    const banner = document.getElementById('boss-alert-banner');
    document.getElementById('boss-alert-name').textContent = L(boss, 'name');
    document.getElementById('boss-alert-quote').textContent = L(boss, 'quote');
    banner.classList.remove('hidden');
    if (this._bossAlertTimer) clearTimeout(this._bossAlertTimer);
    this._bossAlertTimer = setTimeout(() => {
      banner.classList.add('hidden');
    }, 3800);
  }
}

// ============================================================================
// Bootstrapping & Main High-Refresh Animation Loop
// ============================================================================
let UI = null;
let GAME = null;

function bootGame() {
  bakeAllSprites();
  UI = new UIManager();
  GAME = new GameEngine(document.getElementById('game-canvas'));
  UI.init();

  let lastTs = performance.now();
  function frame(now) {
    const dt = Math.max(0.001, (now - lastTs) * 0.001);
    lastTs = now;
    GAME.update(dt);
    GAME.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', bootGame);
