import type { ReactNode } from 'react';
import { useGame } from '../store';

export const coin = '/assets/ui/coin.webp';

export function Coin() {
  return <img className="coin-img" src={coin} alt="" />;
}

export function Hud() {
  const { highest, gold } = useGame();
  return (
    <div className="hud">
      <span>Highest floor : {highest}</span>
      <span className="coin">
        <Coin /> Money : {gold}
      </span>
    </div>
  );
}

export function Frame({ kind, className = '', children }: { kind: 'medium' | 'small' | 'tall' | 'bar'; className?: string; children?: ReactNode }) {
  return <section className={`frame ${kind} ${className}`}>{children}</section>;
}
