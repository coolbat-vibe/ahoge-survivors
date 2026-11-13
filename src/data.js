// ============================================================================
// 《呆毛幸存者：离谱地下城》 | AHOGE SURVIVORS: Absurdia
// Bilingual Localization (ZH / EN) + Balanced Static Game Data (v1.2)
// ============================================================================

let LANG = (function detectInitialLang() {
  try {
    const saved = localStorage.getItem('ahoge_survivors_lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'zh';
  return /^zh/i.test(nav) ? 'zh' : 'zh'; // Default Chinese per creator, 1-click toggle to EN anytime!
})();

const isEn = () => LANG === 'en';
const t = (zh, en) => (LANG === 'en' ? en : zh);
const L = (obj, field) => {
  if (!obj) return '';
  if (LANG === 'en' && obj[field + 'En'] !== undefined) return obj[field + 'En'];
  return obj[field];
};

function setGameLang(nextLang) {
  LANG = nextLang === 'en' ? 'en' : 'zh';
  try {
    localStorage.setItem('ahoge_survivors_lang', LANG);
  } catch (_) {}
}

const GAME_META = {
  title: '呆毛幸存者：离谱地下城',
  titleEn: 'AHOGE SURVIVORS: Absurdia',
  subtitle: 'AHOGE SURVIVORS · ABSURDIA',
  tagline: '“只要我走位够骚，星期一就永远追不上我！”',
  taglineEn: '"If my footwork is fancy enough, MONDAY can never catch me!"',
  version: 'v1.2.0 · Bilingual Director\'s Cut',
  saveKey: 'ahoge_survivors_save_v1',
  maxWeapons: 6,
  maxPassives: 6
};

const COMIC_CALLOUTS = {
  crit: {
    zh: ['暴击!', '痛痛痛!', '啪!!', '绝杀!', 'BONK!', '给力!', '芜湖!', '破防!'],
    en: ['CRIT!', 'BONK!!', 'SMACK!', 'OUCH!', 'SAVAGE!', 'BOOM!', 'EMOTIONAL DMG!']
  },
  slap: {
    zh: ['啪!', 'pia!', '翻身!', '吃我一鱼!'],
    en: ['SLAP!', 'WHACK!', 'FISHY!', 'EAT SALT!']
  },
  honk: {
    zh: ['嘎!!', 'HONK!', '让开!', '铁锅炖!'],
    en: ['HONK!!', 'PEACE WAS NEVER AN OPTION!', 'OUTTA MY WAY!', 'BONK!']
  },
  zap: {
    zh: ['退!', '退退退!', '急急如律令!'],
    en: ['BEGONE!', 'ZAP!', '404 DEMON!']
  },
  levelUp: {
    zh: ['摸鱼升级!', '悟了!', '战力狂飙!', '呆毛竖起!'],
    en: ['LEVEL UP!', 'BIG BRAIN!', 'POWER SURGE!', 'AHOGE ERECT!']
  },
  killBoss: {
    zh: ['大魔王讨伐成功!!', '带薪休假批准!!', '经费爆炸!!'],
    en: ['BOSS OBLITERATED!!', 'PTO APPROVED!!', 'BUDGET UNLEASHED!!']
  },
  hurt: {
    zh: ['哎哟!', '痛!', '扣工资啦!', '别打脸!'],
    en: ['OOF!', 'OW!', 'MY PAYCHECK!', 'NOT THE FACE!']
  }
};

function callout(category) {
  const entry = COMIC_CALLOUTS[category];
  if (!entry) return '!';
  return pick(LANG === 'en' ? entry.en : entry.zh);
}

const HEROES = [
  {
    id: 'knight',
    name: '咸鱼骑士·阿呆',
    nameEn: 'Sir Salted-Fish',
    title: '咸鱼剑圣',
    titleEn: 'Salted Blademaster',
    starterWeapon: 'fish_sword',
    color: '#FF6B5B',
    accent: '#FFD84D',
    unlockedByDefault: true,
    cost: 0,
    stats: {
      maxHp: 145,
      speed: 212,
      armor: 2,
      might: 1.12,
      crit: 0.09,
      critDmg: 1.85,
      cdr: 1.0,
      area: 1.08,
      projSpeed: 1.0,
      duration: 1.0,
      amount: 0,
      pierce: 0,
      magnet: 122,
      regen: 0.5,
      luck: 1.0,
      knockback: 1.25
    },
    dash: {
      name: '翻身咸鱼震',
      nameEn: 'Salted Belly-Slam',
      cd: 3.6,
      desc: '无敌翻滚冲刺，落地拍出黄金咸鱼震荡波，击飞并眩晕周围魔物！',
      descEn: 'Invincible tumble roll! Slams a golden fish shockwave on landing that launches & stuns foes!'
    },
    passiveDesc: '生命上限 +45 · 护甲 +2 · 击退力度 +25%',
    passiveDescEn: 'Max HP +45 · Armor +2 · Knockback +25%',
    quote: '“人没有梦想跟咸鱼有什么区别？——报告，我连大剑都是咸鱼！”',
    quoteEn: '“Without dreams, are we no different from salted fish? — Sir, my greatsword IS a salted fish!”'
  },
  {
    id: 'witch',
    name: '熬夜魔女·黑眼圈喵',
    nameEn: 'Nyx the Insomniac',
    title: '八倍冰美式大法师',
    titleEn: '8-Shot Espresso Mage',
    starterWeapon: 'espresso_wand',
    color: '#A66BFF',
    accent: '#63F5FF',
    unlockedByDefault: true,
    cost: 0,
    stats: {
      maxHp: 112,
      speed: 224,
      armor: 0,
      might: 1.08,
      crit: 0.14,
      critDmg: 1.95,
      cdr: 0.82,
      area: 1.0,
      projSpeed: 1.15,
      duration: 1.0,
      amount: 0,
      pierce: 0,
      magnet: 152,
      regen: 0.3,
      luck: 1.1,
      knockback: 1.0
    },
    dash: {
      name: '浓缩拉花闪现',
      nameEn: 'Latte-Art Blink',
      cd: 3.3,
      desc: '瞬间魔力闪烁，在原地留下爆裂拉花法阵，造成大范围奥术轰炸！',
      descEn: 'Instant arcane teleport leaving an exploding latte-art rune circle behind!'
    },
    passiveDesc: '冷却缩减 -18% · 拾取磁力 +35% · 暴击率 +6%',
    passiveDescEn: 'Cooldown -18% · Magnet +35% · Crit Rate +6%',
    quote: '“第八杯冰美式下肚，死神来了都得先帮我把PPT改完。”',
    quoteEn: '“Eight iced Americanos deep. Even the Grim Reaper has to help me finish my slides first.”'
  },
  {
    id: 'goose',
    name: '暴躁鹅厨·铁锅大鹅',
    nameEn: 'Chef Honkers',
    title: '厨房恶霸',
    titleEn: 'Kitchen Menace',
    starterWeapon: 'iron_wok',
    color: '#FF9F2E',
    accent: '#FFF4D6',
    unlockedByDefault: true,
    cost: 0,
    stats: {
      maxHp: 130,
      speed: 218,
      armor: 1,
      might: 1.14,
      crit: 0.16,
      critDmg: 2.0,
      cdr: 0.94,
      area: 1.20,
      projSpeed: 1.12,
      duration: 1.05,
      amount: 0,
      pierce: 1,
      magnet: 125,
      regen: 0.35,
      luck: 1.05,
      knockback: 1.35
    },
    dash: {
      name: '霸王鹅步嘎嘎冲',
      nameEn: 'Honk Stampede',
      cd: 3.5,
      desc: '发出震耳欲聋的“嘎——！”声波狂奔，撞飞沿途一切魔物并必定暴击！',
      descEn: 'Unleashes an ear-splitting HONK! sonic wave while charging, critting & bowling over foes!'
    },
    passiveDesc: '攻击范围 +20% · 暴击率 +16% · 穿透 +1',
    passiveDescEn: 'Attack Area +20% · Crit Rate +16% · Pierce +1',
    quote: '“嘎！！（翻译：今天在座的所有怪，全都要进我的大铁锅！）”',
    quoteEn: '“HONK!! (Translation: Every single monster in this dungeon is going into my wok!)”'
  },
  {
    id: 'shiba',
    name: '赛博道士·旺财',
    nameEn: 'Cyber-Taoist Doge',
    title: 'RGB扫地机真君',
    titleEn: 'RGB Roomba Sage',
    starterWeapon: 'talisman',
    color: '#2EE6A6',
    accent: '#FFE44D',
    unlockedByDefault: true,
    cost: 0,
    stats: {
      maxHp: 120,
      speed: 246,
      armor: 1,
      might: 1.05,
      crit: 0.12,
      critDmg: 1.9,
      cdr: 0.90,
      area: 1.0,
      projSpeed: 1.2,
      duration: 1.1,
      amount: 1,
      pierce: 0,
      magnet: 138,
      regen: 0.3,
      luck: 1.15,
      knockback: 1.0
    },
    dash: {
      name: '扫地机氮气漂移',
      nameEn: 'Roomba Nitro Drift',
      cd: 3.2,
      desc: '脚下RGB扫地机开启氮气加速，拖出持续电击魔物的赛博雷电尾迹！',
      descEn: 'Overclocks the RGB Roomba with nitro boost, leaving a shocking cyber-lightning trail!'
    },
    passiveDesc: '额外投射物 +1 · 移速 +20% · 冷却 -10%',
    passiveDescEn: 'Projectiles +1 · Move Speed +20% · Cooldown -10%',
    quote: '“贫道掐爪一算，施主五行缺电——急急如律令，退退退！”',
    quoteEn: '“By my paws I foresee: thou lackest voltage — Exorcism Protocol, BEGONE!”'
  }
];

const WEAPONS = {
  fish_sword: {
    id: 'fish_sword',
    name: '尚方咸鱼斩',
    nameEn: 'Salted Fish Cleaver',
    tag: '近战挥砍',
    tagEn: 'Melee Cleave',
    color: '#5CE1E6',
    accent: '#FFD84D',
    pairPassive: 'spinach',
    evoId: 'evo_fish_sword',
    evoName: '黄金暴龙咸鱼王',
    evoNameEn: 'Golden Rex Megafish',
    evoDesc: '360°双连黄金巨鱼剑气斩裂全屏，附带金色震荡波与巨额击退！',
    evoDescEn: '360° colossal golden fish-blades cleave the screen with golden shockwaves & massive knockback!',
    desc: '挥舞腌入味的至尊咸鱼大剑，拍飞成群魔物并爆出金鳞剑气。',
    descEn: 'Swings a well-seasoned supreme salted fish greatsword, slapping hordes away in wide arcs.',
    baseCd: 0.90,
    baseDmg: 32,
    baseArea: 1.12,
    levelDescs: [
      '挥出咸鱼弧光斩，拍飞前方敌人',
      '伤害 +32%，挥砍弧度与半径扩大 20%',
      '前后双向连斩（剑气数量 +1），冷却 -10%',
      '伤害 +35%，击退翻倍并附带碎甲飞沫',
      '满级：三连咸鱼大剑气，伤害 +40%，范围 +25%！'
    ],
    levelDescsEn: [
      'Cleaves foes in a wide salted-fish arc',
      'Damage +32%, slash arc & radius +20%',
      'Front & back dual slashes (+1 slash), Cooldown -10%',
      'Damage +35%, double knockback & armor-cracking spray',
      'MAX: Triple megafish waves, Damage +40%, Area +25%!'
    ]
  },
  espresso_wand: {
    id: 'espresso_wand',
    name: '冰美式魔弹',
    nameEn: 'Iced Espresso Wand',
    tag: '自动索敌',
    tagEn: 'Auto-Homing',
    color: '#B978FF',
    accent: '#63F5FF',
    pairPassive: 'coffee_bean',
    evoId: 'evo_espresso_wand',
    evoName: '零点死神加特林',
    evoNameEn: 'Deadline Reaper Gatling',
    evoDesc: '咖啡因彻底暴走！化身超高速彩虹星弹机枪，命中自动连锁弹射4次！',
    evoDescEn: 'Caffeine overload! Fires hyper-speed rainbow starlight streams that chain-ricochet 4 times!',
    desc: '自动锁定最近的魔物发射高浓度咖啡因奥术星弹，命中可弹射一次。',
    descEn: 'Auto-targets nearest monsters with caffeinated arcane star-bolts that ricochet on hit.',
    baseCd: 0.66,
    baseDmg: 21,
    baseArea: 1.0,
    levelDescs: [
      '自动向最近敌人发射追踪奥术星弹',
      '投射物数量 +1，弹道速度 +20%',
      '伤害 +30%，命中后可连锁弹射 +1 次',
      '投射物数量 +1，冷却时间 -15%',
      '满级：齐射4发高能星弹，伤害 +35%，弹射 +2 次！'
    ],
    levelDescsEn: [
      'Fires homing arcane star-bolts at nearest foes',
      'Projectiles +1, Projectile Speed +20%',
      'Damage +30%, Ricochet Bounces +1',
      'Projectiles +1, Cooldown -15%',
      'MAX: 4-bolt barrage, Damage +35%, Ricochet +2!'
    ]
  },
  iron_wok: {
    id: 'iron_wok',
    name: '夺命平底锅',
    nameEn: 'Boomerang Iron Wok',
    tag: '回旋穿透',
    tagEn: 'Boomerang',
    color: '#FF9F2E',
    accent: '#FFE8A3',
    pairPassive: 'dumbbell',
    evoId: 'evo_iron_wok',
    evoName: '乾坤颠勺风火轮',
    evoNameEn: 'Cosmic Flaming Wok',
    evoDesc: '投掷烈焰巨型中华铁锅回旋清场，沿途洒下爆燃红油火海！',
    evoDescEn: 'Hurls giant blazing woks that pierce everything and leave scorching chili-oil fire trails!',
    desc: '大力甩出旋转大铁锅，“哐当！”穿透敌群后沿弧线飞回手中。',
    descEn: 'Flings spinning cast-iron woks that CLANG! through crowds and curve back like boomerangs.',
    baseCd: 1.38,
    baseDmg: 29,
    baseArea: 1.06,
    levelDescs: [
      '掷出无限穿透的回旋平底锅',
      '铁锅体积 +25%，伤害 +25%',
      '同时掷出 2 口大铁锅，飞行速度 +20%',
      '冷却 -18%，每次“哐当”暴击率额外 +12%',
      '满级：三口重型霸王铁锅齐飞，伤害 +40%！'
    ],
    levelDescsEn: [
      'Throws an infinitely piercing boomerang wok',
      'Wok Size +25%, Damage +25%',
      'Throws 2 iron woks at once, Flight Speed +20%',
      'Cooldown -18%, +12% bonus Crit Rate on every CLANG!',
      'MAX: 3 heavy master woks at once, Damage +40%!'
    ]
  },
  talisman: {
    id: 'talisman',
    name: '退退退符箓',
    nameEn: 'Begone! Talismans',
    tag: '散射雷符',
    tagEn: 'Radial Burst',
    color: '#FFE14D',
    accent: '#4DFFF3',
    pairPassive: 'copier',
    evoId: 'evo_talisman',
    evoName: '九天玄雷八卦阵',
    evoNameEn: 'Nine-Heaven Thunder Array',
    evoDesc: '周身环绕高速八卦符阵，自动发射贯穿全屏的青雷电弧并引爆雷暴！',
    evoDescEn: 'Surrounds you with a spinning Bagua seal while striking foes directly with cyan sky-lightning!',
    desc: '向四周螺旋散射“退！”字灵符，命中魔物贴符引爆小范围雷光。',
    descEn: 'Fires spiraling exorcism talismans in all directions that detonate in static thunder bursts.',
    baseCd: 0.88,
    baseDmg: 19,
    baseArea: 1.0,
    levelDescs: [
      '向四周发射 3 张雷电退魔符',
      '符箓数量 +1，爆炸范围 +20%',
      '伤害 +30%，冷却时间 -12%',
      '符箓数量 +2，附带感电减速效果',
      '满级：八方天师符阵齐发，伤害 +35%，雷爆扩大！'
    ],
    levelDescsEn: [
      'Fires 3 thunder exorcism talismans radially',
      'Talismans +1, Blast Radius +20%',
      'Damage +30%, Cooldown -12%',
      'Talismans +2, shocks & slows hit foes',
      'MAX: 8-way celestial talisman burst, Damage +35%!'
    ]
  },
  pigeon: {
    id: 'pigeon',
    name: '护体咕咕鸽',
    nameEn: 'Coo-Coo Guard Pigeons',
    tag: '环绕护卫',
    tagEn: 'Orbital Shield',
    color: '#8CE8FF',
    accent: '#FFFFFF',
    pairPassive: 'mini_fan',
    evoId: 'evo_pigeon',
    evoName: '圣光鸽王羽刃风暴',
    evoNameEn: 'Holy Pigeon Hurricane',
    evoDesc: '永不消散的黄金墨镜鸽王高速环绕，并不断向外激射圣光羽刃！',
    evoDescEn: '8 golden sunglasses pigeons spin at Mach speed, firing piercing holy feather-blades outward!',
    desc: '召唤戴墨镜的胖白鸽环绕周身，撞飞靠近的魔物并抵消敌方弹幕。',
    descEn: 'Summons chubby sunglasses pigeons that orbit you, blocking enemy shots and smacking monsters.',
    baseCd: 3.0,
    baseDmg: 24,
    baseArea: 1.08,
    levelDescs: [
      '召唤 2 只墨镜胖鸽环绕护体并格挡弹幕',
      '咕咕鸽数量 +1，旋转速度 +25%',
      '伤害 +35%，环绕半径与撞击范围扩大',
      '咕咕鸽数量 +1，旋转速度再 +20%',
      '满级：6 只狂飙铁头鸽常驻护体，伤害 +40%！'
    ],
    levelDescsEn: [
      'Summons 2 sunglasses pigeons that orbit & block projectiles',
      'Pigeons +1, Orbit Speed +25%',
      'Damage +35%, wider orbit & larger impact size',
      'Pigeons +1, Orbit Speed +20%',
      'MAX: 6 turbo iron-headed pigeons on duty, Damage +40%!'
    ]
  },
  durian_aura: {
    id: 'durian_aura',
    name: '大蒜榴莲光环',
    nameEn: 'Garlic Durian Aura',
    tag: '近身领域',
    tagEn: 'Stink Domain',
    color: '#A8FF3E',
    accent: '#FFF066',
    pairPassive: 'thermos',
    evoId: 'evo_durian_aura',
    evoName: '生化螺蛳粉领域',
    evoNameEn: 'Bio-Hazard Noodle Domain',
    evoDesc: '令人闻风丧胆的紫绿生化领域！超大范围高频腐蚀魔物并按命中汲取生命！',
    evoDescEn: 'Colossal neon bio-stink zone that rapidly melts armor, slows hordes, and leeches HP on pulse!',
    desc: '散发浓郁的大蒜榴莲混合真气，持续熏晕、减速并削弱周围所有魔物。',
    descEn: 'Radiates pungent garlic-durian waves that damage, slow, and weaken nearby monsters.',
    baseCd: 0.42,
    baseDmg: 14,
    baseArea: 1.05,
    levelDescs: [
      '生成榴莲真气圈，持续伤害周围敌人',
      '光环半径 +25%，伤害 +28%',
      '受熏敌人移速 -28%，所受伤害与击退显著增加',
      '光环半径 +25%，触发频率加快 20%',
      '满级：巨型真香领域，伤害 +45% 并附带破甲！'
    ],
    levelDescsEn: [
      'Generates a pungent aura damaging all nearby foes',
      'Aura Radius +25%, Damage +28%',
      'Slows foes by 28% and amplifies damage/knockback taken',
      'Aura Radius +25%, Pulse Rate +20%',
      'MAX: Giant pungent domain, Damage +45% & armor melt!'
    ]
  },
  keyboard_rain: {
    id: 'keyboard_rain',
    name: '天降机械键盘',
    nameEn: 'Skyfall RGB Keyboard',
    tag: '天降轰炸',
    tagEn: 'Sky Artillery',
    color: '#FF5CA8',
    accent: '#5CFFE1',
    pairPassive: 'lucky_cat',
    evoId: 'evo_keyboard_rain',
    evoName: '删库跑路巨型回车',
    evoNameEn: 'rm -rf Giant ENTER Key',
    evoDesc: '从天砸下毁天灭地的黄金 ENTER 键，炸裂成满地弹跳的RGB键帽集束炸弹！',
    evoDescEn: 'Drops apocalyptic golden ENTER keys from orbit that fracture into bouncing RGB cluster bombs!',
    desc: '在魔物密集处召唤从天而降的RGB青轴键帽，落地产生清脆冲击波！',
    descEn: 'Calls down giant RGB mechanical keycaps onto monster clusters with clicky shockwaves!',
    baseCd: 2.05,
    baseDmg: 27,
    baseArea: 1.0,
    levelDescs: [
      '随机轰炸怪群，砸下巨型机械键帽',
      '轰炸次数 +1，爆炸半径 +18%',
      '伤害 +30%，冷却时间 -14%',
      '轰炸次数 +1，留下RGB眩光震荡圈',
      '满级：四连青轴雷霆轰炸，伤害 +38%！'
    ],
    levelDescsEn: [
      'Drops giant clicky mechanical keycaps onto enemy crowds',
      'Strikes +1, Blast Radius +18%',
      'Damage +30%, Cooldown -14%',
      'Strikes +1, RGB shockwave expansion',
      'MAX: Quad blue-switch orbital barrage, Damage +38%!'
    ]
  },
  rubber_chicken: {
    id: 'rubber_chicken',
    name: '尖叫惨叫鸡',
    nameEn: 'Screaming Rubber Chicken',
    tag: '声波陷阱',
    tagEn: 'Sonic Mine',
    color: '#FFE033',
    accent: '#FF5733',
    pairPassive: 'magnet_core',
    evoId: 'evo_rubber_chicken',
    evoName: '毁灭交响惨叫鸡群',
    evoNameEn: 'Symphony of Doom Chickens',
    evoDesc: '惨叫鸡长腿狂奔自动追击魔物！连环引爆三重高分贝灵魂声波！',
    evoDescEn: 'Rubber chickens sprout turbo legs, sprint at monsters, and detonate in triple sonic booms!',
    desc: '向场上抛投黄色惨叫鸡，魔物踩中或超时后鼓胀发出灵魂尖叫大爆炸！',
    descEn: 'Tosses yellow rubber chickens that inflate and erupt in harmonic sonic explosions when stepped on!',
    baseCd: 1.48,
    baseDmg: 36,
    baseArea: 1.05,
    levelDescs: [
      '抛投惨叫鸡地雷，触发高分贝声波爆炸',
      '每次抛投 +1 只，声波范围 +22%',
      '伤害 +35%，惨叫震晕敌人 0.65 秒',
      '每次抛投 +1 只，冷却时间 -16%',
      '满级：漫天惨叫鸡交响曲，伤害 +45%！'
    ],
    levelDescsEn: [
      'Tosses rubber chicken mines that explode in sonic waves',
      'Chickens +1 per toss, Blast Radius +22%',
      'Damage +35%, stuns blasted foes for 0.65s',
      'Chickens +1 per toss, Cooldown -16%',
      'MAX: Full rubber-chicken orchestra, Damage +45%!'
    ]
  },
  boba_gun: {
    id: 'boba_gun',
    name: '波霸奶茶水枪',
    nameEn: 'Boba Pearl Blaster',
    tag: '连射减速',
    tagEn: 'Rapid Slow',
    color: '#D98236',
    accent: '#FFF3E0',
    pairPassive: 'gummy_bear',
    evoId: 'evo_boba_gun',
    evoName: '全糖去冰黑洞波霸',
    evoNameEn: 'Full-Sugar Blackhole Boba',
    evoDesc: '发射巨型黑糖引力波霸球，将周围大群魔物强行吸聚一团后轰然爆浆！',
    evoDescEn: 'Fires gravity-warping boba spheres that vacuum hordes together before erupting in a pearl nova!',
    desc: '朝准星方向高速连射Q弹黑糖珍珠，爆开留下黏糊糊的减速奶茶滩。',
    descEn: 'Rapidly fires chewy tapioca pearls that splatter sticky brown-sugar slow puddles on hit.',
    baseCd: 1.05,
    baseDmg: 12,
    baseArea: 1.0,
    levelDescs: [
      '连射 3 颗Q弹黑糖波霸，溅射减速奶茶滩',
      '连射珠数 +1，伤害 +25%',
      '黑糖奶茶滩范围 +28% 且持续灼烧卡路里',
      '连射珠数 +2，冷却 -14%',
      '满级：7连发高压波霸风暴，伤害 +32%！'
    ],
    levelDescsEn: [
      'Bursts 3 chewy boba pearls that splash slow puddles',
      'Burst Pearls +1, Damage +25%',
      'Milk-tea puddle size +28% & burns calories over time',
      'Burst Pearls +2, Cooldown -14%',
      'MAX: 7-round high-pressure boba storm, Damage +32%!'
    ]
  },
  laser_cat: {
    id: 'laser_cat',
    name: '暴走激光逗猫棒',
    nameEn: 'Cat-Teaser Laser Beam',
    tag: '横扫死光',
    tagEn: 'Piercing Beam',
    color: '#FF3864',
    accent: '#FF9EBB',
    pairPassive: 'battery',
    evoId: 'evo_laser_cat',
    evoName: '轨道棱镜彩虹死光',
    evoNameEn: 'Orbital Prism Death-Ray',
    evoDesc: '召唤四道棱镜彩虹死光锁定强敌交叉轰击，命中引发连环晶爆冲击！',
    evoDescEn: 'Fires 4 orbital prism rainbow beams that lock onto crowds and trigger chain crystal blasts!',
    desc: '发射高能红宝石逗猫激光瞬间贯穿直线上所有魔物，并灼烧地面！',
    descEn: 'Slices across the battlefield with a ruby cat-teaser laser that pierces all foes in a line!',
    baseCd: 1.85,
    baseDmg: 36,
    baseArea: 1.05,
    levelDescs: [
      '发射高能激光束瞬间贯穿路径上的全部魔物',
      '激光宽度 +30%，射程扩大，伤害 +28%',
      '同时发射 2 道交叉激光，冷却 -15%',
      '伤害 +35%，激光扫过地面留下灼热余烬',
      '满级：三道宽幅高能死光齐发，伤害 +45%！'
    ],
    levelDescsEn: [
      'Fires a ruby laser piercing every monster in its line',
      'Beam Width +30%, Range +15%, Damage +28%',
      'Fires 2 intersecting beams, Cooldown -15%',
      'Damage +35%, leaves scorching ember pods along the beam',
      'MAX: Triple wide-bore ruby death-rays, Damage +45%!'
    ]
  }
};

const PASSIVES = {
  spinach: {
    id: 'spinach',
    name: '大力菠菜罐头',
    nameEn: 'Popeye Spinach Can',
    color: '#5CE67E',
    pairWeapon: 'fish_sword',
    maxLevel: 5,
    desc: '每级提升 +14% 所有武器伤害',
    descEn: '+14% All Weapon Damage per level',
    statDesc: (lv) => t(`全伤害 +${lv * 14}%`, `Damage +${lv * 14}%`)
  },
  coffee_bean: {
    id: 'coffee_bean',
    name: '特浓咖啡豆',
    nameEn: 'Dark Espresso Beans',
    color: '#C78BFF',
    pairWeapon: 'espresso_wand',
    maxLevel: 5,
    desc: '每级缩减 -8% 武器攻击冷却时间',
    descEn: '-8% Weapon Cooldown per level',
    statDesc: (lv) => t(`冷却时间 -${lv * 8}%`, `Cooldown -${lv * 8}%`)
  },
  dumbbell: {
    id: 'dumbbell',
    name: '猛男小哑铃',
    nameEn: 'pink Heavy Dumbbell',
    color: '#FFA63B',
    pairWeapon: 'iron_wok',
    maxLevel: 5,
    desc: '每级扩大 +14% 攻击范围与弹体体积',
    descEn: '+14% Attack Area & Projectile Size per level',
    statDesc: (lv) => t(`攻击范围 +${lv * 14}%`, `Area +${lv * 14}%`)
  },
  copier: {
    id: 'copier',
    name: '摸鱼复印机',
    nameEn: 'Office Copy Machine',
    color: '#4DEEEA',
    pairWeapon: 'talisman',
    maxLevel: 5,
    desc: 'Lv.1/3/5 额外 +1 投射物数量，每级 +6% 伤害',
    descEn: '+1 Projectile at Lv.1/3/5, plus +6% Damage per level',
    statDesc: (lv) => {
      const amt = lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
      return t(`投射物 +${amt} · 伤害 +${lv * 6}%`, `Amount +${amt} · Dmg +${lv * 6}%`);
    }
  },
  mini_fan: {
    id: 'mini_fan',
    name: '桌面小风扇',
    nameEn: 'USB Desk Fan',
    color: '#80D8FF',
    pairWeapon: 'pigeon',
    maxLevel: 5,
    desc: '每级提升 +15% 弹道速度与持续时间',
    descEn: '+15% Projectile Speed & Duration per level',
    statDesc: (lv) => t(`弹速/持续 +${lv * 15}%`, `Speed/Dur +${lv * 15}%`)
  },
  thermos: {
    id: 'thermos',
    name: '枸杞保温杯',
    nameEn: 'Goji Berry Thermos',
    color: '#FF667A',
    pairWeapon: 'durian_aura',
    maxLevel: 5,
    desc: '每级 +22 最大生命值，每秒恢复 +1.2 生命',
    descEn: '+22 Max HP & +1.2 HP/s Regen per level',
    statDesc: (lv) => t(`生命 +${lv * 22} · 回血 +${(lv * 1.2).toFixed(1)}/s`, `HP +${lv * 22} · +${(lv * 1.2).toFixed(1)}/s`)
  },
  lucky_cat: {
    id: 'lucky_cat',
    name: '暴富招财猫',
    nameEn: 'Golden Lucky Cat',
    color: '#FFE047',
    pairWeapon: 'keyboard_rain',
    maxLevel: 5,
    desc: '每级 +7% 暴击率，+15% 金币获取与幸运',
    descEn: '+7% Crit Rate & +15% Gold/Luck per level',
    statDesc: (lv) => t(`暴击 +${lv * 7}% · 暴富 +${lv * 15}%`, `Crit +${lv * 7}% · Gold +${lv * 15}%`)
  },
  magnet_core: {
    id: 'magnet_core',
    name: '吸星大磁铁',
    nameEn: 'Super Magnet Core',
    color: '#FF5C93',
    pairWeapon: 'rubber_chicken',
    maxLevel: 5,
    desc: '每级扩大 +30% 经验宝石与道具拾取半径',
    descEn: '+30% XP Gem & Loot Pickup Radius per level',
    statDesc: (lv) => t(`拾取范围 +${lv * 30}%`, `Magnet +${lv * 30}%`)
  },
  gummy_bear: {
    id: 'gummy_bear',
    name: '弹力QQ糖',
    nameEn: 'Bouncy Gummy Bear',
    color: '#FF9CEE',
    pairWeapon: 'boba_gun',
    maxLevel: 5,
    desc: '每级 +1 弹体穿透次数，+12% 击退力度',
    descEn: '+1 Projectile Pierce & +12% Knockback per level',
    statDesc: (lv) => t(`穿透 +${lv} · 击退 +${lv * 12}%`, `Pierce +${lv} · Knock +${lv * 12}%`)
  },
  battery: {
    id: 'battery',
    name: '超频核电池',
    nameEn: 'Overclocked Battery',
    color: '#6BFFB8',
    pairWeapon: 'laser_cat',
    maxLevel: 5,
    desc: '每级 +18% 暴击伤害，+8% 角色移动速度',
    descEn: '+18% Crit Damage & +8% Move Speed per level',
    statDesc: (lv) => t(`暴伤 +${lv * 18}% · 移速 +${lv * 8}%`, `CritDmg +${lv * 18}% · Spd +${lv * 8}%`)
  }
};

// Fix minor capitalization in English display name of dumbbell
PASSIVES.dumbbell.nameEn = 'Heavy Pink Dumbbell';

const ENEMY_TYPES = {
  slime: {
    id: 'slime',
    name: '柠檬精史莱姆',
    nameEn: 'Sour Lemon Slime',
    desc: '酸溜溜的果冻怪，最爱扎堆凑热闹。',
    descEn: 'Jealous little sour-jelly blob that loves swarming in packs.',
    hp: 25,
    speed: 78,
    dmg: 8,
    radius: 17,
    xp: 2,
    color: '#C8F53B',
    behavior: 'chase'
  },
  bat: {
    id: 'bat',
    name: '狂飙外卖蝠',
    nameEn: 'Express Delivery Bat',
    desc: '戴黄头盔赶超时的蝙蝠小哥，成群斜线冲刺！',
    descEn: 'Yellow-helmeted courier bat rushing late orders in fast diagonal flocks!',
    hp: 18,
    speed: 132,
    dmg: 7,
    radius: 15,
    xp: 2,
    color: '#B56BFF',
    behavior: 'swarm'
  },
  broccoli: {
    id: 'broccoli',
    name: '暴躁西兰花',
    nameEn: 'Roided Broccoli Boxer',
    desc: '浑身肌肉的健康蔬菜拳手，抗击退较强。',
    descEn: 'Buff green veggie pugilist wearing red boxing gloves. Resists knockback.',
    hp: 56,
    speed: 74,
    dmg: 11,
    radius: 21,
    xp: 4,
    color: '#3ED66E',
    knockResist: 0.35,
    behavior: 'chase'
  },
  ghost: {
    id: 'ghost',
    name: '加班幽灵打工人',
    nameEn: 'Overtime Salary-Ghost',
    desc: '系着歪领带飘荡的怨念打工人，忽快忽慢。',
    descEn: 'Spooky office ghost in a crooked red tie, drifting in eerie sine waves.',
    hp: 40,
    speed: 96,
    dmg: 10,
    radius: 18,
    xp: 3,
    color: '#8FF7FF',
    behavior: 'waver'
  },
  shroom: {
    id: 'shroom',
    name: '社恐毒伞菇',
    nameEn: 'Shy Spore Shroom',
    desc: '害羞的红点蘑菇，被击败时会噗地喷出小毒雾。',
    descEn: 'Introverted polka-dot mushroom that puffs a comic ring when defeated.',
    hp: 70,
    speed: 70,
    dmg: 12,
    radius: 19,
    xp: 5,
    color: '#FF5E7E',
    behavior: 'chase'
  },
  egg_knight: {
    id: 'egg_knight',
    name: '铁头咸鸭蛋兵',
    nameEn: 'Bucket-Helm Egg Grunt',
    desc: '顶着铁桶头盔的硬壳鸭蛋卫兵，皮糙肉厚！',
    descEn: 'Hard-boiled warrior wearing an iron bucket helmet. Extra tanky!',
    hp: 130,
    speed: 66,
    dmg: 14,
    radius: 22,
    xp: 7,
    color: '#FFE8C2',
    knockResist: 0.65,
    behavior: 'chase'
  },
  puffer: {
    id: 'puffer',
    name: '炸毛河豚球',
    nameEn: 'Puff-Bomb Fugu',
    desc: '脾气火爆的刺球河豚，靠近时会红温鼓胀自爆（也会炸飞同伴）！',
    descEn: 'Short-tempered spiky fugu that inflates and explodes — blasting other monsters too!',
    hp: 62,
    speed: 102,
    dmg: 19,
    radius: 20,
    xp: 6,
    color: '#FFB84D',
    behavior: 'bomber'
  },
  octo_mage: {
    id: 'octo_mage',
    name: '摸鱼章鱼法师',
    nameEn: 'Boba Octopus Mage',
    desc: '一边喝奶茶一边远程吐出紫色墨水弹的坏家伙。',
    descEn: 'Pink wizard octopus keeping distance while spitting purple ink orbs.',
    hp: 92,
    speed: 72,
    dmg: 13,
    radius: 21,
    xp: 8,
    color: '#FF7AD9',
    behavior: 'ranged'
  },
  clock_knight: {
    id: 'clock_knight',
    name: '内卷发条骑士',
    nameEn: 'Clockwork Hustler Knight',
    desc: '背后插着金发条的重甲卷王，会锁定方向发起红线冲锋！',
    descEn: 'Wind-up armor knight that telegraphs red dash lanes and charges fiercely!',
    hp: 185,
    speed: 82,
    dmg: 17,
    radius: 24,
    xp: 11,
    color: '#63B8FF',
    knockResist: 0.72,
    behavior: 'charger'
  },
  mimic_pig: {
    id: 'mimic_pig',
    name: '黄金暴富存钱猪',
    nameEn: 'Golden Jackpot Piggy',
    desc: '戴墨镜的稀有黄金小猪！到处撒金币逃跑，打爆必掉大红包！',
    descEn: 'Rare sunglasses piggy bank! Drops coins while fleeing — smash it for a jackpot!',
    hp: 155,
    speed: 116,
    dmg: 5,
    radius: 22,
    xp: 20,
    color: '#FFD700',
    knockResist: 0.4,
    behavior: 'treasure'
  }
};

const BOSSES = [
  {
    id: 'boss_jelly',
    spawnTime: 90,
    name: '果冻陛下·暴食史莱姆王',
    nameEn: 'King Jelly Wobbleton',
    subtitle: '第一幕首领 · 弹力超标',
    subtitleEn: 'Act I Boss · Maximum Bounce',
    hp: 2500,
    speed: 86,
    dmg: 20,
    radius: 48,
    color: '#7CFF5B',
    accent: '#FFD84D',
    quote: '“朕乃Q弹果冻王，把你们统统压成柠檬汁！”',
    quoteEn: '“Bow before the Royal Bounce! I shall flatten thee into lemonade!”'
  },
  {
    id: 'boss_ppt',
    spawnTime: 220,
    name: '死线催命魔·第18版PPT',
    nameEn: 'Lord PPT: Final_v18.pptx',
    subtitle: '第二幕首领 · 需求变更',
    subtitleEn: 'Act II Boss · Scope Creep',
    hp: 5800,
    speed: 92,
    dmg: 24,
    radius: 50,
    color: '#FF5263',
    accent: '#63F5FF',
    quote: '“还是觉得第一版比较好，今晚十二点前交出来！”',
    quoteEn: '“Actually, let’s go back to Version 1. Need it on my desk by midnight!”'
  },
  {
    id: 'boss_pie',
    spawnTime: 360,
    name: '暗黑料理霸主·仰望星空派',
    nameEn: 'Stargazy Pie Titan',
    subtitle: '第三幕首领 · 视觉冲击',
    subtitleEn: 'Act III Boss · Culinary Eldritch',
    hp: 11800,
    speed: 90,
    dmg: 28,
    radius: 54,
    color: '#B56BFF',
    accent: '#FFE066',
    quote: '“凝视深渊吧！我派里的咸鱼都在死死盯着你！”',
    quoteEn: '“Gaze into the crust! Even the baked fish heads are judging your footwork!”'
  },
  {
    id: 'boss_monday',
    spawnTime: 510,
    name: '宇宙摸鱼终结者·星期一大魔王',
    nameEn: 'Arch-Demon MONDAY',
    subtitle: '终幕大魔王 · 闹钟响了',
    subtitleEn: 'Final Boss · The Alarm Rings',
    hp: 22500,
    speed: 100,
    dmg: 32,
    radius: 58,
    color: '#FF2E7E',
    accent: '#FFE44D',
    isFinal: true,
    quote: '“周末已经结束了！在星期一的镰刀下颤抖吧！！”',
    quoteEn: '“THE WEEKEND IS OVER! Tremble before the Scythe of 9:00 AM!!”'
  }
];

const SHOP_TALENTS = [
  { id: 'might', name: '祖传秘制辣酱', nameEn: 'Secret Chili Sauce', desc: '永久提升 +6% 初始全伤害', descEn: 'Permanently grants +6% All Damage per rank', max: 8, baseCost: 60, costStep: 55, bonusText: (lv) => `+${lv * 6}%` },
  { id: 'maxHp', name: '加厚秋裤护体', nameEn: 'Thermal Long-Johns', desc: '永久提升 +15 最大生命值', descEn: 'Permanently grants +15 Max HP per rank', max: 8, baseCost: 50, costStep: 45, bonusText: (lv) => `+${lv * 15}` },
  { id: 'speed', name: '洞洞鞋风火轮', nameEn: 'Sport-Mode Crocs', desc: '永久提升 +4% 移动速度', descEn: 'Permanently grants +4% Move Speed per rank', max: 6, baseCost: 65, costStep: 55, bonusText: (lv) => `+${lv * 4}%` },
  { id: 'cdr', name: '带薪摸鱼秘籍', nameEn: 'Art of Paid Slacking', desc: '永久缩减 -3.5% 武器冷却时间', descEn: 'Permanently reduces Weapon Cooldowns by -3.5% per rank', max: 6, baseCost: 90, costStep: 80, bonusText: (lv) => `-${(lv * 3.5).toFixed(1)}%` },
  { id: 'crit', name: '欧皇开光呆毛', nameEn: 'Blessed Lucky Ahoge', desc: '永久提升 +3% 暴击率', descEn: 'Permanently grants +3% Crit Rate per rank', max: 6, baseCost: 80, costStep: 70, bonusText: (lv) => `+${lv * 3}%` },
  { id: 'magnet', name: '强力吸金磁铁', nameEn: 'Loot Vacuum Magnet', desc: '永久提升 +12% 经验与金币拾取半径', descEn: 'Permanently grants +12% Pickup Radius per rank', max: 6, baseCost: 55, costStep: 45, bonusText: (lv) => `+${lv * 12}%` },
  { id: 'growth', name: '五年高考模拟', nameEn: 'Cram-School Workbook', desc: '永久提升 +8% 经验值获取效率', descEn: 'Permanently grants +8% XP Gain per rank', max: 6, baseCost: 75, costStep: 65, bonusText: (lv) => `+${lv * 8}%` },
  { id: 'greed', name: '年终奖翻倍卡', nameEn: 'Year-End Bonus Card', desc: '永久提升 +12% 金币掉落收益', descEn: 'Permanently grants +12% Gold Gain per rank', max: 6, baseCost: 70, costStep: 60, bonusText: (lv) => `+${lv * 12}%` },
  { id: 'reroll', name: '甲方改需求券', nameEn: 'Reroll Vouchers', desc: '每局额外获得 +1 次升级刷新与封印机会', descEn: 'Grants +1 extra Reroll & Banish charge each run', max: 4, baseCost: 110, costStep: 120, bonusText: (lv) => t(`+${lv}次`, `+${lv}`) },
  { id: 'revive', name: '仰卧起坐复活币', nameEn: 'Sit-Up Revival Token', desc: '每局阵亡时原地满状态复活并震飞全屏魔物', descEn: 'Revive at 100% HP upon defeat and blast nearby foes away', max: 2, baseCost: 280, costStep: 450, bonusText: (lv) => t(`+${lv}命`, `+${lv}`) }
];

const ACHIEVEMENTS = [
  { id: 'first_blood', name: '初入离谱城', nameEn: 'Welcome to Absurdia', desc: '累计击败 100 只魔物', descEn: 'Defeat 100 monsters across runs', reward: 80 },
  { id: 'slayer_1000', name: '无双割草机', nameEn: 'Lawnmower Supreme', desc: '单局击败 1,000 只魔物', descEn: 'Defeat 1,000 monsters in a single run', reward: 180 },
  { id: 'first_evo', name: '超武觉醒！', nameEn: 'Ultimate Evolution!', desc: '首次合成任意一把★超级武器', descEn: 'Evolve any Lv.5 weapon into a ★ Super Weapon', reward: 220 },
  { id: 'first_boss', name: '果冻粉碎机', nameEn: 'Jelly Crusher', desc: '击败第一幕首领【果冻陛下】', descEn: 'Defeat Act I Boss: King Jelly Wobbleton', reward: 150 },
  { id: 'rich_pig', name: '打爆存钱罐', nameEn: 'Break the Bank', desc: '抓住并击败一只稀有黄金存钱猪', descEn: 'Catch and smash a Golden Jackpot Piggy', reward: 160 },
  { id: 'level_25', name: '呆毛冲天', nameEn: 'Sky-Piercing Ahoge', desc: '单局角色等级达到 Lv.25', descEn: 'Reach Hero Lv.25 in a single run', reward: 200 },
  { id: 'beat_monday', name: '痛扁星期一！', nameEn: 'Monday Crushed!', desc: '击败终幕大魔王【星期一大魔王】赢得胜利', descEn: 'Defeat Arch-Demon MONDAY and claim Victory', reward: 500 }
];
