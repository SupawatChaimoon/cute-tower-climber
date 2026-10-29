export type ClassId = 'knight' | 'berserker' | 'assassin' | 'mage' | 'priest';
export type StatKey = 'hp' | 'atk' | 'def';
export type Category = 'offense' | 'defense' | 'debuff';

/** Statuses that sit on the player. */
export type BuffId = 'shield' | 'guard' | 'atkUp' | 'defUp' | 'counter' | 'regen' | 'undying' | 'evade' | 'lifesteal';
/** Statuses that sit on the enemy. */
export type DebuffId = 'burn' | 'poison' | 'stun' | 'weaken' | 'armorBreak' | 'mark';
export type StatusId = BuffId | DebuffId;

export interface Status {
  id: StatusId;
  turns: number;
  value: number;
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
}

export interface Passive {
  reflect: number;
  hpToDamage: number;
  lifesteal: number;
  critChance: number;
  critDamage: number;
  debuffChance: number;
  healBonus: number;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  base: Stats;
  growth: Stats;
  starter: string[];
  passive: (level: number) => Passive;
  passiveText: (level: number) => string;
}

/** What a skill can do during a battle. The engine supplies the implementation. */
export interface SkillApi {
  hit(mult: number, opts?: { hits?: number; critBonus?: number; forceCrit?: boolean; flatMaxHp?: number; lifesteal?: number }): number;
  heal(pctMaxHp: number): void;
  buff(id: BuffId, turns: number, value: number): void;
  debuff(id: DebuffId, turns: number, value: number): void;
  hurtSelf(pctMaxHp: number): void;
  playerHpPct(): number;
  enemyHpPct(): number;
  enemyDebuffs(): number;
  maxHp(): number;
  atk(): number;
  chance(p: number): boolean;
}

export interface SkillDef {
  id: string;
  name: string;
  classId: ClassId;
  category: Category;
  cooldown: number;
  price: number;
  /** Short line in lists, e.g. "150% ATK" or "-". */
  damage: string;
  /** Thai effect description shown in the skill detail. */
  effect: string;
  /** Whether the hero lunges at the enemy when using it. */
  melee: boolean;
  run: (api: SkillApi) => void;
}

export interface EnemyDef {
  id: string;
  name: string;
  special?: string;
}

export interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  statuses: Status[];
}

export type Side = 'player' | 'enemy';

export interface Fx {
  side: Side;
  kind: 'dmg' | 'crit' | 'heal' | 'shield' | 'miss' | 'status' | 'dot';
  text: string;
}

export interface Snapshot {
  player: { hp: number; maxHp: number; statuses: Status[] };
  enemy: { hp: number; maxHp: number; statuses: Status[] };
  cooldowns: Record<string, number>;
}

export interface Beat {
  text: string;
  anim: 'player' | 'cast' | 'enemy' | null;
  fx: Fx[];
  snap: Snapshot;
}
