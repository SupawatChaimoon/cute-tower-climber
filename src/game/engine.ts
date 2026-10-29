import { CLASSES, SKILLS, enemyFor, enemyStats, isBoss } from './data';
import type { Beat, BuffId, ClassId, DebuffId, EnemyDef, Fighter, Fx, Passive, SkillApi, Snapshot, Stats, Status, StatusId } from './types';

export interface Battle {
  floor: number;
  boss: boolean;
  classId: ClassId;
  passive: Passive;
  player: Fighter;
  enemy: Fighter & { def_: EnemyDef; turn: number };
  equipped: string[];
  cooldowns: Record<string, number>;
  result: 'win' | 'lose' | null;
}

export const STATUS_LABEL: Record<StatusId, string> = {
  shield: 'Shield',
  guard: 'Guard',
  atkUp: 'ATK up',
  defUp: 'DEF up',
  counter: 'Counter',
  regen: 'Regen',
  undying: 'Undying',
  evade: 'Evade',
  lifesteal: 'Lifesteal',
  burn: 'Burn',
  poison: 'Poison',
  stun: 'Stunned',
  weaken: 'Weakened',
  armorBreak: 'Armor break',
  mark: 'Marked',
};

const DEBUFF_IDS: DebuffId[] = ['burn', 'poison', 'stun', 'weaken', 'armorBreak', 'mark'];

export function createBattle(classId: ClassId, level: number, stats: Stats, equipped: string[], floor: number): Battle {
  const es = enemyStats(floor);
  const def = enemyFor(floor);
  return {
    floor,
    boss: isBoss(floor),
    classId,
    passive: CLASSES[classId].passive(level),
    player: { name: CLASSES[classId].name, hp: stats.hp, maxHp: stats.hp, atk: stats.atk, def: stats.def, statuses: [] },
    enemy: { name: def.name, hp: es.hp, maxHp: es.hp, atk: es.atk, def: es.def, statuses: [], def_: def, turn: 0 },
    equipped: equipped.filter(Boolean),
    cooldowns: {},
    result: null,
  };
}

const val = (f: Fighter, id: StatusId) => f.statuses.find((s) => s.id === id)?.value ?? 0;
const has = (f: Fighter, id: StatusId) => f.statuses.some((s) => s.id === id);

function addStatus(f: Fighter, id: StatusId, turns: number, value: number) {
  const cur = f.statuses.find((s) => s.id === id);
  if (cur) {
    cur.turns = Math.max(cur.turns, turns);
    cur.value = id === 'shield' ? cur.value + value : Math.max(cur.value, value);
  } else {
    f.statuses.push({ id, turns, value });
  }
}

function snapshot(b: Battle): Snapshot {
  const copy = (s: Status[]) => s.map((x) => ({ ...x }));
  return {
    player: { hp: b.player.hp, maxHp: b.player.maxHp, statuses: copy(b.player.statuses) },
    enemy: { hp: b.enemy.hp, maxHp: b.enemy.maxHp, statuses: copy(b.enemy.statuses) },
    cooldowns: { ...b.cooldowns },
  };
}

const jitter = () => 0.92 + Math.random() * 0.16;
const mitigate = (dmg: number, def: number) => (dmg * 60) / (60 + Math.max(0, def));
const fmt = (n: number) => Math.max(0, Math.round(n)).toString();

/** Resolves one full round (player action, enemy reply, end-of-turn ticks) and returns the beats to animate. */
export function runRound(b: Battle, action: 'attack' | string): Beat[] {
  const beats: Beat[] = [];
  let fx: Fx[] = [];
  let text = '';
  let anim: Beat['anim'] = null;
  const begin = (t: string, a: Beat['anim']) => {
    text = t;
    anim = a;
    fx = [];
  };
  const flush = () => beats.push({ text, anim, fx, snap: snapshot(b) });

  const P = b.player;
  const E = b.enemy;
  const pv = b.passive;

  const effAtk = () => P.atk * (1 + val(P, 'atkUp'));
  const healPlayer = (amount: number) => {
    const real = Math.min(P.maxHp - P.hp, Math.round(amount));
    if (real > 0) {
      P.hp += real;
      fx.push({ side: 'player', kind: 'heal', text: `+${real}` });
    }
  };
  const damageEnemy = (amount: number, kind: Fx['kind']) => {
    const d = Math.max(1, Math.round(amount));
    E.hp = Math.max(0, E.hp - d);
    fx.push({ side: 'enemy', kind, text: kind === 'crit' ? `${d}!` : `-${d}` });
    return d;
  };

  const api: SkillApi = {
    hit(mult, opts = {}) {
      const hits = opts.hits ?? 1;
      let total = 0;
      for (let i = 0; i < hits && E.hp > 0; i++) {
        const base = effAtk() * mult + P.maxHp * (pv.hpToDamage + (opts.flatMaxHp ?? 0));
        const crit = opts.forceCrit || Math.random() < pv.critChance + (opts.critBonus ?? 0);
        const def = E.def * (1 - val(E, 'armorBreak'));
        const dmg = mitigate(base * (crit ? pv.critDamage : 1), def) * (1 + val(E, 'mark')) * jitter();
        total += damageEnemy(dmg, crit ? 'crit' : 'dmg');
      }
      const steal = pv.lifesteal + val(P, 'lifesteal') + (opts.lifesteal ?? 0);
      if (steal > 0 && total > 0) healPlayer(total * steal);
      if (pv.debuffChance > 0 && total > 0 && E.hp > 0 && Math.random() < pv.debuffChance) {
        const roll = Math.floor(Math.random() * 3);
        if (roll === 0) api.debuff('burn', 3, effAtk() * 0.25);
        else if (roll === 1) api.debuff('weaken', 2, 0.2);
        else api.debuff('armorBreak', 2, 0.25);
      }
      return total;
    },
    heal(pctMaxHp) {
      healPlayer(P.maxHp * pctMaxHp * (1 + pv.healBonus));
    },
    buff(id: BuffId, turns, value) {
      addStatus(P, id, turns, value);
      fx.push({ side: 'player', kind: id === 'shield' ? 'shield' : 'status', text: id === 'shield' ? `+${fmt(value)} shield` : STATUS_LABEL[id] });
    },
    debuff(id: DebuffId, turns, value) {
      addStatus(E, id, turns, value);
      fx.push({ side: 'enemy', kind: 'status', text: STATUS_LABEL[id] });
    },
    hurtSelf(pctMaxHp) {
      const d = Math.min(P.hp - 1, Math.round(P.maxHp * pctMaxHp));
      if (d > 0) {
        P.hp -= d;
        fx.push({ side: 'player', kind: 'dmg', text: `-${d}` });
      }
    },
    playerHpPct: () => P.hp / P.maxHp,
    enemyHpPct: () => E.hp / E.maxHp,
    enemyDebuffs: () => E.statuses.filter((s) => (DEBUFF_IDS as StatusId[]).includes(s.id)).length,
    maxHp: () => P.maxHp,
    atk: effAtk,
    chance: (p) => Math.random() < p,
  };

  // 1. Player acts
  const used = new Set<string>();
  if (action === 'attack') {
    begin(`${P.name} attacks.`, 'player');
    api.hit(1);
  } else {
    const skill = SKILLS[action];
    begin(`${P.name} uses ${skill.name}.`, skill.melee ? 'player' : 'cast');
    skill.run(api);
    b.cooldowns[skill.id] = skill.cooldown;
    used.add(skill.id);
  }
  flush();
  if (E.hp <= 0) return finish(b, beats, 'win');

  // 2. Enemy acts
  E.turn += 1;
  if (has(E, 'stun')) {
    begin(`${E.name} can't move this turn.`, null);
    E.statuses = E.statuses.filter((s) => s.id !== 'stun');
    fx.push({ side: 'enemy', kind: 'status', text: 'Skip' });
  } else {
    const special = b.boss ? E.turn % 3 === 0 : Math.random() < 0.18;
    const moveName = b.boss ? E.def_.special! : 'Strong Hit';
    begin(special ? `${E.name} uses ${moveName}!` : `${E.name} attacks.`, 'enemy');
    const evade = val(P, 'evade');
    if (evade > 0 && Math.random() < evade) {
      P.statuses = P.statuses.filter((s) => s.id !== 'evade');
      fx.push({ side: 'player', kind: 'miss', text: 'Dodged' });
    } else {
      const mult = special ? (b.boss ? 1.6 : 1.35) : 1;
      const raw = E.atk * (1 - val(E, 'weaken')) * mult;
      let dmg = mitigate(raw, P.def * (1 + val(P, 'defUp'))) * (1 - val(P, 'guard')) * jitter();
      dmg = Math.max(1, Math.round(dmg));
      const dealt = dmg;
      const shield = P.statuses.find((s) => s.id === 'shield');
      if (shield) {
        const absorbed = Math.min(shield.value, dmg);
        shield.value -= absorbed;
        dmg -= absorbed;
        if (shield.value <= 0) P.statuses = P.statuses.filter((s) => s !== shield);
        if (absorbed > 0) fx.push({ side: 'player', kind: 'shield', text: `${absorbed} blocked` });
      }
      if (dmg > 0) {
        const floor = has(P, 'undying') ? 1 : 0;
        P.hp = Math.max(floor, P.hp - dmg);
        fx.push({ side: 'player', kind: 'dmg', text: `-${dmg}` });
      }
      const reflect = pv.reflect + val(P, 'counter');
      if (reflect > 0) damageEnemy(dealt * reflect, 'dmg');
    }
  }
  flush();
  if (E.hp <= 0) return finish(b, beats, 'win');
  if (P.hp <= 0) return finish(b, beats, 'lose');

  // 3. End of round: damage over time, regeneration
  begin('', null);
  const burn = val(E, 'burn');
  const poison = val(E, 'poison');
  if (burn > 0) damageEnemy(burn, 'dot');
  if (poison > 0) damageEnemy(poison, 'dot');
  const regen = val(P, 'regen');
  if (regen > 0) healPlayer(P.maxHp * regen * (1 + pv.healBonus));
  if (fx.length) {
    text = burn || poison ? `${E.name} takes damage over time.` : `${P.name} recovers.`;
    flush();
  }
  if (E.hp <= 0) return finish(b, beats, 'win');

  // 4. Tick durations and cooldowns
  for (const f of [P, E]) {
    f.statuses.forEach((s) => (s.turns -= 1));
    f.statuses = f.statuses.filter((s) => s.turns > 0);
  }
  for (const id of Object.keys(b.cooldowns)) {
    if (!used.has(id)) b.cooldowns[id] = Math.max(0, b.cooldowns[id] - 1);
  }
  beats[beats.length - 1].snap = snapshot(b);
  return beats;
}

function finish(b: Battle, beats: Beat[], result: 'win' | 'lose') {
  b.result = result;
  beats.push({
    text: result === 'win' ? `${b.enemy.name} is defeated!` : `${b.player.name} is knocked out.`,
    anim: null,
    fx: [],
    snap: snapshot(b),
  });
  return beats;
}
