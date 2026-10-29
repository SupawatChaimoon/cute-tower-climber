import { CLASSES, CLASS_ORDER, MAX_LEVEL, heroImg, skillImg, SKILLS } from '../game/data';
import type { StatKey } from '../game/types';
import { useGame } from '../store';
import { Frame, Hud } from './common';

const STAT_ROWS: { key: StatKey; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'ATK' },
  { key: 'def', label: 'DEF' },
];

export default function Loadout() {
  const g = useGame();
  const cls = CLASSES[g.classId];
  const maxed = g.level >= MAX_LEVEL;
  const lastUndo = g.undo[g.undo.length - 1];

  return (
    <div className="screen loadout">
      <img className="bg" src="/assets/ui/bg-meadow.webp" alt="" />
      <button className="btn small back" onClick={() => g.go('home')}>
        Back To Menu
      </button>
      <Hud />

      <Frame kind="tall" className="class-list">
        {CLASS_ORDER.map((id) => (
          <button key={id} className="class-btn" aria-pressed={g.classId === id} onClick={() => g.pickClass(id)}>
            {CLASSES[id].name}
          </button>
        ))}
      </Frame>

      <h1 className="class-name">{cls.name}</h1>
      <img className="platform" src="/assets/ui/ui-platform.webp" alt="" />
      <div className="hero">
        <img className="hero-idle" key={g.classId} src={heroImg(g.classId)} alt={cls.name} />
      </div>
      <p className="passive-box">
        <b>Passive :</b> {cls.passiveText(g.level)}
      </p>

      <Frame kind="medium" className="stats-panel">
        <div className="lv-row">
          <span>LV. {g.level}</span>
          <small>MAX : {MAX_LEVEL}</small>
        </div>
        <div className="next">{maxed ? 'Max level reached' : `Next upgrade : ${g.cost} G`}</div>
        <hr className="rule" />
        {STAT_ROWS.map(({ key, label }) => (
          <div className="stat-row" key={key}>
            <span>{label} :</span>
            <span className="num">{g.stats[key]}</span>
            <button
              className="btn plus"
              disabled={!g.canUpgrade}
              onClick={() => g.upgrade(key)}
              aria-label={`Upgrade ${label} by ${cls.growth[key]} for ${g.cost} gold`}
              title={`+${cls.growth[key]} ${label}`}
            >
              +
            </button>
          </div>
        ))}
        <div className="undo-row">
          <span>{!maxed && g.gold < g.cost ? `Need ${g.cost - g.gold} G more` : `Each + raises your level by 1`}</span>
          <button className="btn ghost small" disabled={!lastUndo} onClick={g.undoUpgrade} title={lastUndo ? `Refund ${lastUndo.cost} G` : undefined}>
            ↺ Undo{lastUndo ? ` (+${lastUndo.cost} G)` : ''}
          </button>
        </div>
        <hr className="rule" />
        <div className="skill-head">
          <span>Skill</span>
          <button className="btn ghost small" onClick={() => g.go('skills')}>
            Edit skills
          </button>
        </div>
        <div className="skill-row">
          {g.equipped[g.classId].map((id, i) =>
            id ? (
              <button key={i} className="skill-tile" title={SKILLS[id].name} onClick={() => g.go('skills')}>
                <img src={skillImg(id)} alt={SKILLS[id].name} />
              </button>
            ) : (
              <button key={i} className="skill-tile empty" onClick={() => g.go('skills')}>
                Empty
              </button>
            ),
          )}
        </div>
      </Frame>

      <button className="btn cta start" onClick={() => g.go('tower')}>
        Start Play
      </button>
    </div>
  );
}
