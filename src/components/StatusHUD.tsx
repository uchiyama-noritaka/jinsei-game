import type { Stats } from "../types";
import { STAT_LABELS, STAT_ORDER } from "../data/stats";

export function StatusHUD({ stats }: { stats: Stats }) {
  return (
    <div className="hud">
      {STAT_ORDER.map((key) => (
        <div className="hud-stat" key={key}>
          <div className="n">{stats[key]}</div>
          <div className="l">{STAT_LABELS[key]}</div>
        </div>
      ))}
    </div>
  );
}
