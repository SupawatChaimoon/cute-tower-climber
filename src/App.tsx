import { useEffect, useLayoutEffect, useState } from 'react';
import { useGame } from './store';
import Home from './screens/Home';
import Loadout from './screens/Loadout';
import SkillEditor from './screens/SkillEditor';
import Tower from './screens/Tower';
import BattleScreen from './screens/Battle';

const W = 1280;
const H = 720;

function useStageScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

const PRELOAD = ['bg-meadow', 'bg-sky', 'bg-battle', 'tower-floor', 'ui-panel-medium', 'ui-panel-small', 'ui-panel-tall', 'ui-skillbar', 'ui-namebar'];

export default function App() {
  const { screen } = useGame();
  const scale = useStageScale();

  useEffect(() => {
    PRELOAD.forEach((n) => (new Image().src = `/assets/ui/${n}.webp`));
  }, []);

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {screen === 'home' && <Home />}
        {screen === 'loadout' && <Loadout />}
        {screen === 'skills' && <SkillEditor />}
        {screen === 'tower' && <Tower />}
        {screen === 'battle' && <BattleScreen />}
      </div>
      <div className="rotate-hint">Turn your phone sideways for a bigger view</div>
    </div>
  );
}
