import { useEffect, useRef, useState } from 'react';
import { CLASSES, SKILLS, TOP_FLOOR, enemyFor, heroImg, isBoss, monImg, nextBossFloor, rewardFor, skillImg } from '../game/data';
import { STATUS_LABEL, createBattle, runRound, type Battle } from '../game/engine';
import type { Beat, Fx, Snapshot, Status, StatusId } from '../game/types';
import { useGame } from '../store';
import { Coin, Frame } from './common';

const BEAT_MS = 820;
const IMPACT_MS = 200;
const GOOD: StatusId[] = ['shield', 'guard', 'atkUp', 'defUp', 'counter', 'regen', 'undying', 'evade', 'lifesteal'];

// Where floating numbers appear inside the arena.
const ANCHOR = { player: { x: 265, y: 230 }, enemy: { x: 650, y: 110 } };

interface Floater extends Fx {
  key: number;
  delay: number;
  order: number;
}

export default function BattleScreen() {
  const { floor } = useGame();
  const [run, setRun] = useState(0);
  return <Fight key={`${floor}-${run}`} onRetry={() => setRun((r) => r + 1)} />;
}

function snap(b: Battle): Snapshot {
  return {
    player: { hp: b.player.hp, maxHp: b.player.maxHp, statuses: [] },
    enemy: { hp: b.enemy.hp, maxHp: b.enemy.maxHp, statuses: [] },
    cooldowns: {},
  };
}

function Fight({ onRetry }: { onRetry: () => void }) {
  const g = useGame();
  const floor = g.floor;
  const [battle] = useState(() => createBattle(g.classId, g.level, g.stats, g.equipped[g.classId], floor));
  const [view, setView] = useState<Snapshot>(() => snap(battle));
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState(`Floor ${floor}: ${battle.enemy.name} appears!`);
  const [anim, setAnim] = useState<{ player: string; enemy: string }>({ player: '', enemy: '' });
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const timers = useRef<number[]>([]);
  const fxKey = useRef(0);
  const enemy = enemyFor(floor);
  const boss = isBoss(floor);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const showBeat = (beat: Beat) => {
    if (beat.text) setLog(beat.text);
    const hitsEnemy = beat.fx.some((f) => f.side === 'enemy' && (f.kind === 'dmg' || f.kind === 'crit' || f.kind === 'dot'));
    const hitsPlayer = beat.fx.some((f) => f.side === 'player' && f.kind === 'dmg');
    setAnim({
      player: beat.anim === 'player' ? 'lunge-player' : beat.anim === 'cast' ? 'cast' : '',
      enemy: beat.anim === 'enemy' ? 'lunge-enemy' : '',
    });
    later(beat.anim ? IMPACT_MS : 0, () => {
      setView(beat.snap);
      if (hitsEnemy || hitsPlayer)
        setAnim((a) => ({ player: hitsPlayer ? 'hurt' : a.player, enemy: hitsEnemy ? 'hurt' : a.enemy }));
      const count = { player: 0, enemy: 0 };
      const fresh = beat.fx.map((f) => ({ ...f, key: ++fxKey.current, order: count[f.side], delay: count[f.side]++ * 130 }));
      setFloaters((cur) => [...cur, ...fresh]);
      later(1700, () => setFloaters((cur) => cur.filter((x) => !fresh.includes(x))));
    });
  };

  const act = (action: string) => {
    if (busy || result) return;
    if (action !== 'attack' && (battle.cooldowns[action] ?? 0) > 0) return;
    setBusy(true);
    const beats = runRound(battle, action);
    beats.forEach((beat, i) => later(i * BEAT_MS, () => showBeat(beat)));
    const end = beats.length * BEAT_MS;
    later(end - BEAT_MS / 2, () => {
      if (battle.result) {
        if (battle.result === 'win') g.winFloor(floor);
        setAnim(battle.result === 'win' ? { player: '', enemy: 'dead' } : { player: 'dead', enemy: '' });
        later(700, () => setResult(battle.result));
      } else {
        setAnim({ player: '', enemy: '' });
        setBusy(false);
      }
    });
  };

  // Keyboard: 1 = attack, 2–5 = skills
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n === 1) act('attack');
      else if (n >= 2 && n <= 5 && battle.equipped[n - 2]) act(battle.equipped[n - 2]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pPct = view.player.hp / view.player.maxHp;
  const ePct = view.enemy.hp / view.enemy.maxHp;
  const reward = rewardFor(floor);
  const bossFloor = nextBossFloor(floor);

  return (
    <div className="screen battle">
      <div className="arena">
        <img className="bg" src="/assets/ui/bg-battle.webp" alt="" />
        <button className="btn small back" onClick={() => g.go('home')}>
          Back To Menu
        </button>
        <div className="battle-log" aria-live="polite">
          {log}
        </div>

        <div className="hpbox enemy">
          <div className="line">
            <span>Name : {battle.enemy.name}</span>
            <span>
              HP : {view.enemy.hp} / {view.enemy.maxHp}
            </span>
          </div>
          <div className={`hpbar ${ePct < 0.3 ? 'low' : ''}`}>
            <i style={{ width: `${ePct * 100}%` }} />
          </div>
          <Chips list={view.enemy.statuses} />
        </div>

        <div className={`fighter enemy ${boss ? 'big' : ''} ${anim.enemy}`}>
          <span className="shadow" />
          <img src={monImg(enemy.id)} alt={enemy.name} />
        </div>
        <div className={`fighter player ${anim.player}`}>
          <span className="shadow" />
          <img src={heroImg(g.classId, true)} alt={CLASSES[g.classId].name} />
        </div>

        <div className="hpbox player">
          <div className="line">
            <span>
              Player : {view.player.hp} / {view.player.maxHp}
            </span>
            <span>HP</span>
          </div>
          <div className={`hpbar ${pPct < 0.3 ? 'low' : ''}`}>
            <i style={{ width: `${pPct * 100}%` }} />
          </div>
          <Chips list={view.player.statuses} />
        </div>

        {floaters.map((f) => (
          <span
            key={f.key}
            className={`floater ${f.kind}`}
            style={{
              left: ANCHOR[f.side].x + (f.order % 2 ? 36 : -20),
              top: ANCHOR[f.side].y - f.order * 30,
              animationDelay: `${f.delay}ms`,
            }}
          >
            {f.text}
          </span>
        ))}

        <div className={`turn-banner ${busy ? 'enemy' : ''}`}>{result ? '' : busy ? 'Wait…' : 'Your turn'}</div>
      </div>

      <div className={`action-bar ${busy ? 'waiting' : ''}`}>
        <button className="attack-btn" disabled={busy || !!result} onClick={() => act('attack')} aria-keyshortcuts="1">
          <img src="/assets/ui/attack.webp" alt="" />
          ATTACK
        </button>
        {battle.equipped.map((id, i) => {
          const s = SKILLS[id];
          const cd = view.cooldowns[id] ?? 0;
          return (
            <button
              key={id}
              className="skill-btn"
              disabled={busy || cd > 0 || !!result}
              onClick={() => act(id)}
              aria-label={`${s.name}${cd ? `, ready in ${cd} turns` : ''}`}
              aria-keyshortcuts={String(i + 2)}
            >
              <img src={skillImg(id)} alt="" />
              {cd > 0 && <span className="cd">{cd}</span>}
              <span className="tip" role="tooltip">
                <b>{s.name}</b>
                {s.damage !== '-' && <>{s.damage}<br /></>}
                {s.effect !== '-' && <>{s.effect}<br /></>}
                Cooldown {s.cooldown} turns
              </span>
            </button>
          );
        })}
      </div>

      <aside className="tracker">
        <h2>Tower Tracker</h2>
        <div className="body">
          <div className="gauge" aria-label={`Floor ${floor} of ${TOP_FLOOR}`}>
            <div className="rail">
              <div className="fill" style={{ height: `${(g.highest / TOP_FLOOR) * 100}%` }} />
            </div>
            {[1, 50, 100].map((t) => (
              <span key={t} className="tick" style={{ bottom: `calc(10px + ${((t - 1) / (TOP_FLOOR - 1)) * 100}% - ${((t - 1) / (TOP_FLOOR - 1)) * 20}px)` }}>
                {t}
              </span>
            ))}
            <span className="you" style={{ bottom: `calc(10px + ${((floor - 1) / (TOP_FLOOR - 1)) * 100}% - ${((floor - 1) / (TOP_FLOOR - 1)) * 20}px)` }} />
          </div>
          <div className="track-card">
            <div className="fl">Floor : {floor}</div>
            <div className="lbl">Current enemy</div>
            <img src={monImg(enemy.id)} alt="" />
            <div className="lbl">{bossFloor === floor ? 'Boss floor' : 'Next boss'}</div>
            <img src={monImg(enemyFor(bossFloor).id)} alt="" />
            <div>Floor {bossFloor}</div>
          </div>
        </div>
        <div className="reward">
          Reward <span>{reward}</span> <Coin />
        </div>
      </aside>

      {result && (
        <div className="modal-scrim">
          <Frame kind="small" className="modal">
            {result === 'win' ? (
              <>
                <h2>{floor === TOP_FLOOR ? 'Tower conquered!' : `Floor ${floor} cleared`}</h2>
                <p>{battle.enemy.name} is defeated.</p>
                <span className="gain">
                  +{reward} <Coin />
                </span>
                <div className="row">
                  <button className="btn" onClick={() => g.go('tower')}>
                    Tower
                  </button>
                  {floor < TOP_FLOOR && (
                    <button className="btn cta" onClick={() => g.startBattle(floor + 1)}>
                      Next floor
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>Defeated</h2>
                <p>
                  {battle.enemy.name} was too strong this time. Spend gold on upgrades or try other skills in Loadout, then come back.
                </p>
                <div className="row">
                  <button className="btn" onClick={() => g.go('loadout')}>
                    Loadout
                  </button>
                  <button className="btn cta" onClick={onRetry}>
                    Retry
                  </button>
                </div>
              </>
            )}
          </Frame>
        </div>
      )}
    </div>
  );
}

function Chips({ list }: { list: Status[] }) {
  return (
    <div className="chips">
      {list.map((s) => (
        <span key={s.id} className={`chip ${GOOD.includes(s.id) ? 'good' : 'bad'}`}>
          {STATUS_LABEL[s.id]}
          {s.id === 'shield' ? ` ${Math.round(s.value)}` : ''} ({s.turns})
        </span>
      ))}
    </div>
  );
}
