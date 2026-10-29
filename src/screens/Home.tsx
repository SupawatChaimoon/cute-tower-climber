import { CLASSES, heroImg } from '../game/data';
import { useGame } from '../store';

export default function Home() {
  const { classId, level, highest, go } = useGame();
  return (
    <div className="screen home">
      <img className="bg" src="/assets/ui/bg-meadow.webp" alt="" />
      <img className="logo" src="/assets/ui/logo.webp" alt="Cute Tower Climber" />
      <div className="hero">
        <span className="ground-shadow" />
        <img className="hero-idle" src={heroImg(classId)} alt={CLASSES[classId].name} />
      </div>
      <div className="meta">
        Level {level} {CLASSES[classId].name}
        {highest > 0 && <>, best floor {highest}</>}
      </div>
      <button className="btn to-loadout" onClick={() => go('loadout')}>
        Loadout
      </button>
      <button className="btn to-tower" onClick={() => go('tower')}>
        Climb Tower
      </button>
    </div>
  );
}
