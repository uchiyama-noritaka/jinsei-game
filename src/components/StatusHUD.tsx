import type { Stats } from "../types";

const ITEMS: { key: keyof Stats; label: string }[] = [
  { key: "money", label: "お金" },
  { key: "energy", label: "気力" },
  { key: "bondMother", label: "母との関係" },
  { key: "bondSibling", label: "きょうだい" },
  { key: "knowledge", label: "知識" },
];

export function StatusHUD({ stats }: { stats: Stats }) {
  return (
    <div className="hud">
      {ITEMS.map((item) => (
        <div className="hud-stat" key={item.key}>
          <div className="n">{stats[item.key]}</div>
          <div className="l">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
