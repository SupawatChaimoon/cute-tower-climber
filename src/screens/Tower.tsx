import { useEffect, useRef } from 'react';
import { TOP_FLOOR, enemyFor, enemyStats, isBoss, monImg, rewardFor } from '../game/data';
import { useGame } from '../store';
import { Coin, Frame, Hud } from './common';

const floors = Array.from({ length: TOP_FLOOR }, (_, i) => i + 1);

export default function Tower() {
  const g = useGame();
  const scroller = useRef<HTMLDivElement>(null);
  const unlocked = Math.min(TOP_FLOOR, g.highest + 1);
  const floor = Math.min(g.floor, unlocked);
  const enemy = enemyFor(floor);
  const stats = enemyStats(floor);
  const boss = isBoss(floor);

  // Open on the selected floor, centred in the column.
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-floor="${floor}"]`);
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
  }, []);

  return (
    <div className="screen tower">
      <img className="bg" src="/assets/ui/bg-sky.webp" alt="" />
      <img className="cloud c1" src="/assets/ui/cloud.webp" alt="" />
      <img className="cloud c2" src="/assets/ui/cloud.webp" alt="" />
      <button className="btn small back" onClick={() => g.go('home')}>
        Back To Menu
      </button>
      <Hud />

      <div className="tower-scroll" ref={scroller} aria-label="Tower floors">
        <div className="tower-stack">
          {floors.map((f) => {
            const locked = f > unlocked;
            const cls = ['floor-tile', isBoss(f) && 'boss', locked && 'locked', f <= g.highest && 'cleared', f === floor && 'selected'].filter(Boolean).join(' ');
            return (
              <button
                key={f}
                data-floor={f}
                className={cls}
                disabled={locked}
                aria-pressed={f === floor}
                aria-label={`Floor ${f}${isBoss(f) ? ', boss' : ''}${locked ? ', locked' : ''}`}
                onClick={() => g.selectFloor(f)}
                onDoubleClick={() => !locked && g.startBattle(f)}
              >
                <img src="/assets/ui/tower-floor.webp" alt="" loading={f > 14 ? 'lazy' : undefined} />
                <span className="n">{locked ? '🔒' : f}</span>
                {isBoss(f) && <span className="boss-flag">Boss</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Frame kind="small" className="floor-info">
        <div className="ttl">
          <span>Floor : {floor}</span>
          {boss && <span className="boss-chip">Boss</span>}
        </div>
        <div className="row">
          <div className="ename">
            {boss ? 'Boss' : 'Enemy'}
            <small>{enemy.name}</small>
            <small>
              ATK {stats.atk}, DEF {stats.def}
            </small>
          </div>
          <img className="mon" src={monImg(enemy.id)} alt={enemy.name} />
        </div>
        <div className="bottom">
          <span>HP {stats.hp}</span>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Reward {rewardFor(floor)} <Coin />
          </span>
        </div>
      </Frame>
      <p className="hint">
        {floor <= g.highest
          ? 'Cleared floors can be replayed for more gold.'
          : floor === TOP_FLOOR
            ? 'The top of the tower. Good luck.'
            : 'Clear this floor to unlock the next one.'}
      </p>

      <button className="btn loadout-btn" onClick={() => g.go('loadout')}>
        Loadout
      </button>
      <button className="btn cta start" onClick={() => g.startBattle(floor)}>
        Start Play
      </button>
    </div>
  );
}
