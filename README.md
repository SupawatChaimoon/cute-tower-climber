# Cute Tower Climber

A turn-based chibi RPG for the web. Pick one of five classes, upgrade HP / ATK / DEF with gold, equip four skills, and climb a 100-floor tower with a boss every ten floors.

There is no database or save file: everything lives in memory, so closing or refreshing the tab starts a new game.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The output goes to `dist/`. Deploying to Vercel needs no extra settings: import the repo and Vercel picks up Vite from `vercel.json`.

## Project layout

- `src/game/data.ts` holds classes, passives, the 40 skills, enemies, the stat curve and rewards. Balance tweaks go here.
- `src/game/engine.ts` resolves one battle round (player action, enemy reply, damage over time, cooldowns) and returns beats for the UI to animate.
- `src/store.tsx` holds the in-memory game state (gold, level, upgrades with undo, owned and equipped skills, highest floor).
- `src/screens/` has one file per screen: Home, Loadout, Skill editor, Tower, Battle.
- `public/assets/` has the web-sized art. It is generated from the original files in `asset/` by `python scripts/optimize_assets.py` (needs Pillow). `asset/` is git-ignored because it is about 135 MB.

## How to play

- **Loadout**: pick a class, spend gold on `+` to upgrade stats (each upgrade raises your level by 1), and use Undo to get the gold back.
- **Edit skills**: learn new skills with gold and equip up to four.
- **Tower**: pick any unlocked floor. Cleared floors can be replayed for more gold.
- **Battle**: Attack or use a skill (keys 1 to 5). Skills have cooldowns; statuses like Burn, Shield and Stunned show under each HP bar.
