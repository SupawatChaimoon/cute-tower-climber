import type { ClassDef, ClassId, EnemyDef, Passive, SkillDef, StatKey } from './types';

export const MAX_LEVEL = 100;
export const TOP_FLOOR = 100;
export const START_GOLD = 100;
export const SLOTS = 4;

const pct = (n: number) => `${Math.round(n * 100)}%`;
const grow = (base: number, perLevel: number, cap: number, level: number) => Math.min(cap, base + perLevel * (level - 1));

const basePassive: Passive = {
  reflect: 0,
  hpToDamage: 0,
  lifesteal: 0,
  critChance: 0.05,
  critDamage: 1.5,
  debuffChance: 0,
  healBonus: 0,
};

export const CLASSES: Record<ClassId, ClassDef> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    base: { hp: 150, atk: 12, def: 10 },
    growth: { hp: 20, atk: 3, def: 2 },
    starter: ['heavy-slash', 'shield-bash', 'divine-strike', 'counter-stance'],
    passive: (lv) => ({ ...basePassive, reflect: grow(0.15, 0.002, 0.35, lv), hpToDamage: grow(0.05, 0.0005, 0.1, lv) }),
    passiveText: (lv) => {
      const p = CLASSES.knight.passive(lv);
      return `สะท้อนดาเมจ ${pct(p.reflect)} และพลังทุบเพิ่มตาม ${pct(p.hpToDamage)} Max HP`;
    },
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    base: { hp: 120, atk: 16, def: 6 },
    growth: { hp: 16, atk: 4, def: 1 },
    starter: ['double-axe', 'blood-feast', 'frenzy', 'savage-cleave'],
    passive: (lv) => ({ ...basePassive, lifesteal: grow(0.15, 0.002, 0.35, lv) }),
    passiveText: (lv) => `ดูดเลือด ${pct(CLASSES.berserker.passive(lv).lifesteal)} ของดาเมจที่ทำได้ทุกครั้ง`,
  },
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    base: { hp: 110, atk: 15, def: 5 },
    growth: { hp: 14, atk: 4, def: 1 },
    starter: ['double-slash', 'backstab', 'poison-dagger', 'critical-strike'],
    passive: (lv) => ({ ...basePassive, critChance: grow(0.25, 0.0025, 0.5, lv), critDamage: grow(1.8, 0.005, 2.3, lv) }),
    passiveText: (lv) => {
      const p = CLASSES.assassin.passive(lv);
      return `โอกาสคริติคอล ${pct(p.critChance)} และคริติคอลแรง ${pct(p.critDamage)}`;
    },
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    base: { hp: 100, atk: 17, def: 4 },
    growth: { hp: 15, atk: 4, def: 1 },
    starter: ['fireball', 'ice-lance', 'weakening-curse', 'burning-curse'],
    passive: (lv) => ({ ...basePassive, debuffChance: grow(0.25, 0.0025, 0.5, lv) }),
    passiveText: (lv) =>
      `โอกาส ${pct(CLASSES.mage.passive(lv).debuffChance)} ที่การโจมตีจะติดดีบัฟสุ่ม (เผาไหม้ / อ่อนแรง / เกราะแตก)`,
  },
  priest: {
    id: 'priest',
    name: 'Priest',
    base: { hp: 140, atk: 10, def: 8 },
    growth: { hp: 22, atk: 3, def: 1 },
    starter: ['holy-light', 'heal', 'divine-protection', 'divine-punishment'],
    passive: (lv) => ({ ...basePassive, healBonus: grow(0.2, 0.003, 0.5, lv), hpToDamage: grow(0.08, 0.0006, 0.14, lv) }),
    passiveText: (lv) => {
      const p = CLASSES.priest.passive(lv);
      return `การรักษาแรงขึ้น ${pct(p.healBonus)} และพลังโจมตีเพิ่มตาม ${pct(p.hpToDamage)} Max HP`;
    },
  },
};

export const CLASS_ORDER: ClassId[] = ['knight', 'berserker', 'assassin', 'mage', 'priest'];

export const heroImg = (id: ClassId, back = false) => {
  const file = { knight: 'knight', berserker: 'berserk', assassin: 'assassin', mage: 'mage', priest: 'priest' }[id];
  const backFile = id === 'assassin' ? 'ass-back' : `${file}-back`;
  return `/assets/hero/${back ? backFile : file}.webp`;
};

export function statsFor(classId: ClassId, upgrades: Record<StatKey, number>) {
  const c = CLASSES[classId];
  return {
    hp: c.base.hp + c.growth.hp * upgrades.hp,
    atk: c.base.atk + c.growth.atk * upgrades.atk,
    def: c.base.def + c.growth.def * upgrades.def,
  };
}

export const upgradeCost = (level: number) => 50 + 10 * (level - 1);

type SkillSeed = Omit<SkillDef, 'classId' | 'melee'> & { melee?: boolean };

const knight: SkillSeed[] = [
  { id: 'heavy-slash', name: 'Heavy Slash', category: 'offense', cooldown: 2, price: 0, damage: '150% ATK', effect: '-', melee: true, run: (a) => void a.hit(1.5) },
  { id: 'shield-bash', name: 'Shield Bash', category: 'offense', cooldown: 3, price: 0, damage: '120% ATK', effect: 'โอกาส 40% ทำให้ศัตรูมึนงง ข้ามเทิร์นถัดไป', melee: true,
    run: (a) => { a.hit(1.2); if (a.chance(0.4)) a.debuff('stun', 1, 1); } },
  { id: 'divine-strike', name: 'Divine Strike', category: 'offense', cooldown: 4, price: 0, damage: '220% ATK', effect: '-', melee: true, run: (a) => void a.hit(2.2) },
  { id: 'counter-stance', name: 'Counter Stance', category: 'defense', cooldown: 3, price: 0, damage: '-', effect: 'สะท้อนดาเมจเพิ่ม 60% และรับดาเมจลดลง 20% เป็นเวลา 2 เทิร์น',
    run: (a) => { a.buff('counter', 2, 0.6); a.buff('guard', 2, 0.2); } },
  { id: 'iron-guard', name: 'Iron Guard', category: 'defense', cooldown: 3, price: 120, damage: '-', effect: 'สร้างโล่ 25% Max HP อยู่ 3 เทิร์น', run: (a) => a.buff('shield', 3, a.maxHp() * 0.25) },
  { id: 'last-stand', name: 'Last Stand', category: 'defense', cooldown: 2, price: 180, damage: '-', effect: 'ฟื้นฟู 12% Max HP หาก HP ต่ำกว่า 40% ฟื้นฟู 28% แทน',
    run: (a) => a.heal(a.playerHpPct() < 0.4 ? 0.28 : 0.12) },
  { id: 'fortress', name: 'Fortress', category: 'defense', cooldown: 5, price: 300, damage: '-', effect: 'รับดาเมจลดลง 55% เป็นเวลา 2 เทิร์น', run: (a) => a.buff('guard', 2, 0.55) },
  { id: 'reinforcement', name: 'Reinforcement', category: 'defense', cooldown: 5, price: 420, damage: '-', effect: 'DEF +60% และ ATK +25% เป็นเวลา 3 เทิร์น',
    run: (a) => { a.buff('defUp', 3, 0.6); a.buff('atkUp', 3, 0.25); } },
];

const berserker: SkillSeed[] = [
  { id: 'double-axe', name: 'Double Axe', category: 'offense', cooldown: 2, price: 0, damage: '2 × 85% ATK', effect: 'ฟาดสองครั้งติด', melee: true, run: (a) => void a.hit(0.85, { hits: 2 }) },
  { id: 'blood-feast', name: 'Blood Feast', category: 'offense', cooldown: 3, price: 0, damage: '160% ATK', effect: 'ดูดเลือดเพิ่ม 50% ของดาเมจที่ทำ', melee: true,
    run: (a) => void a.hit(1.6, { lifesteal: 0.5 }) },
  { id: 'frenzy', name: 'Frenzy', category: 'offense', cooldown: 4, price: 0, damage: '-', effect: 'ATK +40% เป็นเวลา 3 เทิร์น', run: (a) => a.buff('atkUp', 3, 0.4) },
  { id: 'savage-cleave', name: 'Savage Cleave', category: 'debuff', cooldown: 3, price: 0, damage: '180% ATK', effect: 'ทำให้เกราะศัตรูแตก DEF -30% เป็นเวลา 2 เทิร์น', melee: true,
    run: (a) => { a.hit(1.8); a.debuff('armorBreak', 2, 0.3); } },
  { id: 'blood-rush', name: 'Blood Rush', category: 'offense', cooldown: 3, price: 150, damage: '260% ATK', effect: 'เสีย HP 8% Max HP ก่อนโจมตี', melee: true,
    run: (a) => { a.hurtSelf(0.08); a.hit(2.6); } },
  { id: 'executioner', name: 'Executioner', category: 'offense', cooldown: 4, price: 260, damage: '180% ATK', effect: 'ดาเมจ ×2 หากศัตรูมี HP ต่ำกว่า 35%', melee: true,
    run: (a) => void a.hit(a.enemyHpPct() < 0.35 ? 3.6 : 1.8) },
  { id: 'blood-sacrifice', name: 'Blood Sacrifice', category: 'offense', cooldown: 5, price: 360, damage: '-', effect: 'เสีย HP 15% Max HP แลกกับ ATK +75% เป็นเวลา 3 เทิร์น',
    run: (a) => { a.hurtSelf(0.15); a.buff('atkUp', 3, 0.75); } },
  { id: 'undying-rage', name: 'Undying Rage', category: 'defense', cooldown: 6, price: 480, damage: '-', effect: 'HP ไม่ลดต่ำกว่า 1 และดูดเลือดเพิ่ม 30% เป็นเวลา 2 เทิร์น',
    run: (a) => { a.buff('undying', 2, 1); a.buff('lifesteal', 2, 0.3); } },
];

const assassin: SkillSeed[] = [
  { id: 'double-slash', name: 'Double Slash', category: 'offense', cooldown: 2, price: 0, damage: '2 × 80% ATK', effect: 'ฟันสองครั้ง แต่ละครั้งคริติคอลแยกกัน', melee: true,
    run: (a) => void a.hit(0.8, { hits: 2 }) },
  { id: 'backstab', name: 'Backstab', category: 'offense', cooldown: 3, price: 0, damage: '200% ATK', effect: 'โอกาสคริติคอลเพิ่ม 30%', melee: true,
    run: (a) => void a.hit(2, { critBonus: 0.3 }) },
  { id: 'poison-dagger', name: 'Poison Dagger', category: 'debuff', cooldown: 3, price: 0, damage: '100% ATK', effect: 'ติดพิษ 30% ATK ต่อเทิร์น เป็นเวลา 3 เทิร์น', melee: true,
    run: (a) => { a.hit(1); a.debuff('poison', 3, a.atk() * 0.3); } },
  { id: 'critical-strike', name: 'Critical Strike', category: 'offense', cooldown: 4, price: 0, damage: '160% ATK', effect: 'คริติคอลแน่นอน', melee: true,
    run: (a) => void a.hit(1.6, { forceCrit: true }) },
  { id: 'expose-weakness', name: 'Expose Weakness', category: 'debuff', cooldown: 4, price: 140, damage: '-', effect: 'ศัตรู DEF -40% และรับดาเมจเพิ่ม 20% เป็นเวลา 3 เทิร์น',
    run: (a) => { a.debuff('armorBreak', 3, 0.4); a.debuff('mark', 3, 0.2); } },
  { id: 'shadow-assault', name: 'Shadow Assault', category: 'offense', cooldown: 4, price: 280, damage: '3 × 70% ATK', effect: 'ฟันสามครั้ง แล้วหลบการโจมตีครั้งถัดไป 60%', melee: true,
    run: (a) => { a.hit(0.7, { hits: 3 }); a.buff('evade', 1, 0.6); } },
  { id: 'finishing-blow', name: 'Finishing Blow', category: 'offense', cooldown: 4, price: 420, damage: '150% ATK', effect: 'ยิ่งศัตรูเลือดน้อย ยิ่งแรง สูงสุด ×2.5', melee: true,
    run: (a) => void a.hit(1.5 * (1 + (1 - a.enemyHpPct()) * 1.5)) },
];

const mage: SkillSeed[] = [
  { id: 'fireball', name: 'Fireball', category: 'offense', cooldown: 2, price: 0, damage: '170% ATK', effect: 'เผาไหม้ 20% ATK ต่อเทิร์น เป็นเวลา 2 เทิร์น',
    run: (a) => { a.hit(1.7); a.debuff('burn', 2, a.atk() * 0.2); } },
  { id: 'ice-lance', name: 'Ice Lance', category: 'offense', cooldown: 3, price: 0, damage: '150% ATK', effect: 'โอกาส 40% แช่แข็งศัตรู ข้ามเทิร์นถัดไป',
    run: (a) => { a.hit(1.5); if (a.chance(0.4)) a.debuff('stun', 1, 1); } },
  { id: 'weakening-curse', name: 'Weakening Curse', category: 'debuff', cooldown: 4, price: 0, damage: '-', effect: 'ศัตรู ATK -30% เป็นเวลา 3 เทิร์น', run: (a) => a.debuff('weaken', 3, 0.3) },
  { id: 'burning-curse', name: 'Burning Curse', category: 'debuff', cooldown: 4, price: 0, damage: '-', effect: 'เผาไหม้ 45% ATK ต่อเทิร์น เป็นเวลา 4 เทิร์น', run: (a) => a.debuff('burn', 4, a.atk() * 0.45) },
  { id: 'frostbite', name: 'Frostbite', category: 'debuff', cooldown: 3, price: 130, damage: '120% ATK', effect: 'ศัตรู ATK -20% 2 เทิร์น และโอกาส 25% แช่แข็ง',
    run: (a) => { a.hit(1.2); a.debuff('weaken', 2, 0.2); if (a.chance(0.25)) a.debuff('stun', 1, 1); } },
  { id: 'corrosion', name: 'Corrosion', category: 'debuff', cooldown: 4, price: 220, damage: '80% ATK', effect: 'กัดกร่อนเกราะ DEF -50% เป็นเวลา 3 เทิร์น',
    run: (a) => { a.hit(0.8); a.debuff('armorBreak', 3, 0.5); } },
  { id: 'arcane-burst', name: 'Arcane Burst', category: 'offense', cooldown: 4, price: 340, damage: '120% ATK', effect: 'ดาเมจเพิ่ม 60% ATK ต่อดีบัฟที่ศัตรูมี',
    run: (a) => void a.hit(1.2 + 0.6 * a.enemyDebuffs()) },
  { id: 'doom-mark', name: 'Doom Mark', category: 'debuff', cooldown: 5, price: 460, damage: '-', effect: 'ประทับตรา ศัตรูรับดาเมจเพิ่ม 35% เป็นเวลา 3 เทิร์น', run: (a) => a.debuff('mark', 3, 0.35) },
];

const priest: SkillSeed[] = [
  { id: 'holy-light', name: 'Holy Light', category: 'offense', cooldown: 2, price: 0, damage: '140% ATK', effect: 'ฟื้นฟู 8% Max HP', run: (a) => { a.hit(1.4); a.heal(0.08); } },
  { id: 'heal', name: 'Heal', category: 'defense', cooldown: 3, price: 0, damage: '-', effect: 'ฟื้นฟู 25% Max HP', run: (a) => a.heal(0.25) },
  { id: 'divine-protection', name: 'Divine Protection', category: 'defense', cooldown: 4, price: 0, damage: '-', effect: 'สร้างโล่ 30% Max HP อยู่ 3 เทิร์น', run: (a) => a.buff('shield', 3, a.maxHp() * 0.3) },
  { id: 'divine-punishment', name: 'Divine Punishment', category: 'offense', cooldown: 3, price: 0, damage: '100% ATK + 15% Max HP', effect: '-',
    run: (a) => void a.hit(1, { flatMaxHp: 0.15 }) },
  { id: 'holy-lance', name: 'Holy Lance', category: 'offense', cooldown: 3, price: 140, damage: '180% ATK + 10% Max HP', effect: '-', run: (a) => void a.hit(1.8, { flatMaxHp: 0.1 }) },
  { id: 'regeneration', name: 'Regeneration', category: 'defense', cooldown: 5, price: 220, damage: '-', effect: 'ฟื้นฟู 9% Max HP ทุกเทิร์น เป็นเวลา 4 เทิร์น', run: (a) => a.buff('regen', 4, 0.09) },
  { id: 'greater-heal', name: 'Greater Heal', category: 'defense', cooldown: 5, price: 300, damage: '-', effect: 'ฟื้นฟู 45% Max HP', run: (a) => a.heal(0.45) },
  { id: 'blessing-of-life', name: 'Blessing of Life', category: 'defense', cooldown: 5, price: 380, damage: '-', effect: 'DEF +40% และฟื้นฟู 5% Max HP ทุกเทิร์น เป็นเวลา 3 เทิร์น',
    run: (a) => { a.buff('defUp', 3, 0.4); a.buff('regen', 3, 0.05); } },
  { id: 'divine-judgment', name: 'Divine Judgment', category: 'offense', cooldown: 6, price: 520, damage: '120% ATK + 30% Max HP', effect: '-', run: (a) => void a.hit(1.2, { flatMaxHp: 0.3 }) },
];

const seeds: Record<ClassId, SkillSeed[]> = { knight, berserker, assassin, mage, priest };

export const SKILLS: Record<string, SkillDef> = {};
for (const classId of CLASS_ORDER) {
  for (const s of seeds[classId]) SKILLS[s.id] = { ...s, classId, melee: s.melee ?? false };
}
export const skillsOf = (classId: ClassId) => seeds[classId].map((s) => SKILLS[s.id]);
export const skillImg = (id: string) => `/assets/skill/${id}.webp`;

export const CATEGORY_LABEL: Record<SkillDef['category'], { en: string; th: string }> = {
  offense: { en: 'Offense', th: 'สายโจมตี' },
  defense: { en: 'Defense', th: 'สายป้องกัน' },
  debuff: { en: 'Debuff', th: 'สายดีบัฟ' },
};

// ---------- Enemies ----------

const mon = (id: string, name: string, special?: string): EnemyDef => ({ id, name, special });

const BANDS: EnemyDef[][] = [
  [mon('bunny', 'Bunny'), mon('slime', 'Slime'), mon('bird', 'Bluebird')],
  [mon('butterfly', 'Moth Puff'), mon('snail', 'Coral Snail'), mon('frog', 'Mushroom Toad')],
  [mon('fish', 'Sky Koi'), mon('crab', 'Bubble Crab'), mon('pig', 'Moss Boar')],
  [mon('fox', 'Frost Fox'), mon('leaf', 'Leaf Sprite'), mon('jelly', 'Moon Jelly')],
  [mon('bat', 'Ember Bat'), mon('fur', 'Fluffball'), mon('owl', 'Clockwork Owl')],
  [mon('water', 'Water Spirit'), mon('insect', 'Crystal Mite'), mon('ghost', 'Hooded Ghost')],
  [mon('mob', 'Tower Guard'), mon('golem', 'Stone Golem'), mon('lava', 'Lava Rock')],
  [mon('robot-insect', 'Brass Beetle'), mon('ghost', 'Hooded Ghost'), mon('bat', 'Ember Bat')],
  [mon('lava', 'Lava Rock'), mon('owl', 'Clockwork Owl'), mon('insect', 'Crystal Mite')],
  [mon('robot-insect', 'Brass Beetle'), mon('golem', 'Stone Golem'), mon('mob', 'Tower Guard')],
];

const BOSSES: Record<number, EnemyDef> = {
  10: mon('boss', 'Bishop Bonk', 'Holy Smack'),
  20: mon('tree', 'Elder Treant', 'Root Slam'),
  30: mon('turtle', 'Castle Turtle', 'Shell Quake'),
  40: mon('yeti', 'Snow Yeti', 'Blizzard Hug'),
  50: mon('lizzard', 'Ember Lizard', 'Tail Crash'),
  60: mon('big-golem', 'Mossy Colossus', 'Boulder Drop'),
  70: mon('buffalo', 'Magma Ram', 'Molten Charge'),
  80: mon('chest', 'Mimic Chest', 'Greedy Chomp'),
  90: mon('dragon', 'Night Dragon', 'Starfall Breath'),
  100: mon('last-boss', 'Tower Witch', 'Grand Hex'),
};

export const isBoss = (floor: number) => floor % 10 === 0;
export const enemyFor = (floor: number) => (isBoss(floor) ? BOSSES[floor] : BANDS[Math.floor((floor - 1) / 10)][((floor - 1) % 10) % 3]);
export const monImg = (id: string) => `/assets/mon/${id}.webp`;
export const nextBossFloor = (floor: number) => Math.min(TOP_FLOOR, Math.ceil(floor / 10) * 10);

export function enemyStats(floor: number) {
  const f = floor;
  const boss = isBoss(f);
  const hp = Math.round((106 + 8.5 * f + 0.01 * f * f) * (boss ? 1.8 : 1));
  const atk = Math.round((8.7 + 1.3 * f) * (boss ? 1.1 : 1));
  const def = Math.round((3 + 0.45 * f) * (boss ? 1.15 : 1));
  return { hp, atk, def };
}

export const rewardFor = (floor: number) => Math.round((25 + 10 * (floor - 1)) * (isBoss(floor) ? 3 : 1));
