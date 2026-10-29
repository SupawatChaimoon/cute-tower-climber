import { useState } from 'react';
import { CATEGORY_LABEL, CLASSES, SKILLS, heroImg, skillImg, skillsOf } from '../game/data';
import type { Category } from '../game/types';
import { useGame } from '../store';
import { Coin, Frame, Hud } from './common';

type Filter = 'all' | Category;
const FILTERS: Filter[] = ['all', 'offense', 'defense', 'debuff'];

export default function SkillEditor() {
  const g = useGame();
  const cls = CLASSES[g.classId];
  const equipped = g.equipped[g.classId];
  const [slot, setSlot] = useState(0);
  const [selected, setSelected] = useState(equipped[0]);
  const [filter, setFilter] = useState<Filter>('all');

  const skill = SKILLS[selected];
  const owned = g.owned.includes(selected);
  const inSlot = equipped.indexOf(selected);
  const list = skillsOf(g.classId).filter((s) => filter === 'all' || s.category === filter);

  return (
    <div className="screen skills">
      <img className="bg" src="/assets/ui/bg-meadow.webp" alt="" />
      <button className="btn small back" onClick={() => g.go('loadout')}>
        ‹ Back
      </button>
      <Hud />

      <img className="platform" src="/assets/ui/ui-platform.webp" alt="" />
      <div className="hero">
        <img className="hero-idle" src={heroImg(g.classId)} alt="" />
      </div>
      <div className="namebar">{cls.name}</div>
      <Frame kind="medium" className="sheet">
        <p>Level : {g.level}</p>
        <p>HP : {g.stats.hp}</p>
        <p>ATK : {g.stats.atk}</p>
        <p>DEF : {g.stats.def}</p>
        <p className="passive">Passive : {cls.passiveText(g.level)}</p>
      </Frame>

      <Frame kind="small" className="equipped-panel">
        <h2 className="panel-title">Equipped skill</h2>
        <div className="slots">
          {equipped.map((id, i) => (
            <div className="slot" key={i}>
              <span className="slot-no">{i + 1}</span>
              <button
                className="skill-tile"
                aria-pressed={slot === i}
                aria-label={`Slot ${i + 1}: ${SKILLS[id].name}`}
                onClick={() => {
                  setSlot(i);
                  setSelected(id);
                }}
              >
                <img src={skillImg(id)} alt="" />
              </button>
            </div>
          ))}
        </div>
      </Frame>

      <Frame kind="medium" className="detail">
        <div className="head">
          <img src={skillImg(skill.id)} alt="" />
          <div>
            <h2>{skill.name}</h2>
            <div className="kind">
              {CATEGORY_LABEL[skill.category].th} ({CATEGORY_LABEL[skill.category].en})
            </div>
          </div>
        </div>
        <dl>
          <dt>Damage :</dt>
          <dd>{skill.damage}</dd>
          <dt>Effect :</dt>
          <dd>{skill.effect}</dd>
          <dt>Cooldown :</dt>
          <dd>{skill.cooldown} Turns</dd>
        </dl>
        <div className="actions">
          {!owned ? (
            <>
              <span className="note">{g.gold < skill.price ? `Need ${skill.price - g.gold} G more` : 'Not learned yet'}</span>
              <button className="btn small" disabled={g.gold < skill.price} onClick={() => g.learn(skill.id)}>
                Learn for {skill.price} G
              </button>
            </>
          ) : inSlot === slot ? (
            <span className="note">Equipped in slot {slot + 1}. Pick a skill from the library to swap it.</span>
          ) : (
            <>
              {inSlot >= 0 && <span className="note">Swaps with slot {inSlot + 1}</span>}
              <button className="btn small" onClick={() => g.equip(skill.id, slot)}>
                Equip to Slot {slot + 1}
              </button>
            </>
          )}
        </div>
      </Frame>

      <Frame kind="tall" className="library">
        <h2 className="panel-title">Skill library</h2>
        <div className="tabs" role="group" aria-label="Filter skills">
          {FILTERS.map((f) => (
            <button key={f} className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : CATEGORY_LABEL[f].en}
            </button>
          ))}
        </div>
        <div className="lib-list">
          {list.map((s) => {
            const has = g.owned.includes(s.id);
            const at = equipped.indexOf(s.id);
            return (
              <button key={s.id} className={`lib-item ${has ? '' : 'locked'}`} aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}>
                <img src={skillImg(s.id)} alt="" />
                <span>
                  <span className="nm">{s.name}</span>
                  <br />
                  <span className="sub">
                    {s.damage} | {s.cooldown} Turns
                  </span>
                </span>
                {at >= 0 ? (
                  <span className="tag on">Slot {at + 1}</span>
                ) : has ? (
                  <span className="tag">›</span>
                ) : (
                  <span className="tag price">
                    <Coin /> {s.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Frame>
    </div>
  );
}
