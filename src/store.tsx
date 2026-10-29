import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { CLASSES, CLASS_ORDER, MAX_LEVEL, SKILLS, SLOTS, START_GOLD, TOP_FLOOR, rewardFor, statsFor, upgradeCost } from './game/data';
import type { ClassId, StatKey } from './game/types';

export type Screen = 'home' | 'loadout' | 'skills' | 'tower' | 'battle';

interface State {
  screen: Screen;
  classId: ClassId;
  upgrades: Record<StatKey, number>;
  undo: { stat: StatKey; cost: number }[];
  gold: number;
  /** Highest floor cleared so far (0 = none). */
  highest: number;
  floor: number;
  owned: string[];
  equipped: Record<ClassId, string[]>;
}

// Everything lives in memory: closing or refreshing the tab starts a new game.
const initial: State = {
  screen: 'home',
  classId: 'knight',
  upgrades: { hp: 0, atk: 0, def: 0 },
  undo: [],
  gold: START_GOLD,
  highest: 0,
  floor: 1,
  owned: CLASS_ORDER.flatMap((c) => CLASSES[c].starter),
  equipped: Object.fromEntries(CLASS_ORDER.map((c) => [c, [...CLASSES[c].starter]])) as Record<ClassId, string[]>,
};

function useGameState() {
  const [s, set] = useState<State>(initial);

  return useMemo(() => {
    const level = 1 + s.upgrades.hp + s.upgrades.atk + s.upgrades.def;
    const cost = upgradeCost(level);
    return {
      ...s,
      level,
      cost,
      stats: statsFor(s.classId, s.upgrades),
      canUpgrade: level < MAX_LEVEL && s.gold >= cost,
      go: (screen: Screen) => set((p) => ({ ...p, screen })),
      pickClass: (classId: ClassId) => set((p) => ({ ...p, classId })),
      upgrade: (stat: StatKey) =>
        set((p) => {
          const lv = 1 + p.upgrades.hp + p.upgrades.atk + p.upgrades.def;
          const c = upgradeCost(lv);
          if (lv >= MAX_LEVEL || p.gold < c) return p;
          return { ...p, gold: p.gold - c, upgrades: { ...p.upgrades, [stat]: p.upgrades[stat] + 1 }, undo: [...p.undo, { stat, cost: c }] };
        }),
      undoUpgrade: () =>
        set((p) => {
          const last = p.undo[p.undo.length - 1];
          if (!last) return p;
          return { ...p, gold: p.gold + last.cost, upgrades: { ...p.upgrades, [last.stat]: p.upgrades[last.stat] - 1 }, undo: p.undo.slice(0, -1) };
        }),
      learn: (id: string) =>
        set((p) => {
          const price = SKILLS[id].price;
          if (p.owned.includes(id) || p.gold < price) return p;
          return { ...p, gold: p.gold - price, owned: [...p.owned, id] };
        }),
      equip: (id: string, slot: number) =>
        set((p) => {
          const cls = SKILLS[id].classId;
          const list = [...p.equipped[cls]];
          const existing = list.indexOf(id);
          if (existing >= 0) list[existing] = list[slot];
          list[slot] = id;
          return { ...p, equipped: { ...p.equipped, [cls]: list.slice(0, SLOTS) } };
        }),
      selectFloor: (floor: number) => set((p) => ({ ...p, floor: Math.max(1, Math.min(floor, p.highest + 1, TOP_FLOOR)) })),
      startBattle: (floor?: number) => set((p) => ({ ...p, floor: floor ?? p.floor, screen: 'battle' })),
      cheat: (gold: number, highest?: number) => set((p) => ({ ...p, gold: p.gold + gold, highest: highest ?? p.highest })),
      winFloor: (floor: number) => set((p) => ({ ...p, gold: p.gold + rewardFor(floor), highest: Math.max(p.highest, floor) })),
    };
  }, [s]);
}

export type Game = ReturnType<typeof useGameState>;
const Ctx = createContext<Game | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameState();
  // Dev-only handle for poking at state from the console; stripped from production builds.
  if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = game;
  return <Ctx.Provider value={game}>{children}</Ctx.Provider>;
}

export function useGame() {
  const g = useContext(Ctx);
  if (!g) throw new Error('useGame must be used inside GameProvider');
  return g;
}
