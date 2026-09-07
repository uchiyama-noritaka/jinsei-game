import type { CSSProperties } from "react";
import type { StatDelta, Stats } from "../types";
import { STAT_LABELS, STAT_ORDER } from "../data/stats";

// 0〜9 を2周ぶん並べた帯。1周まわしてから目的の数字で止めるので、
// 変化が小さくても「回った」と分かる。
const REEL_DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);

// 選んだ結果として数字が動いたときだけ使う、スロット風の表示。
// 桁ごとに帯を持ち、左の桁から順に止まる。
function StatReel({ value, from }: { value: number; from: number }) {
  const to = String(value);
  // 桁数が変わるとき（9→10 など）に桁を対応づけるため、右詰めでそろえる
  const fromDigits = String(from).padStart(to.length, "0");

  return (
    <span className="reel-row">
      {to.split("").map((digit, i) => (
        <span className="reel" key={i}>
          <span
            className="reel-strip"
            style={
              {
                "--from": fromDigits[i] ?? "0",
                "--to": 10 + Number(digit),
                "--delay": `${i * 80}ms`,
              } as CSSProperties
            }
          >
            {REEL_DIGITS.map((d, j) => (
              <span key={j}>{d}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export function StatusHUD({
  stats,
  lastDelta,
  changeId,
}: {
  stats: Stats;
  lastDelta: StatDelta | null;
  changeId: number;
}) {
  return (
    <div className="hud">
      {STAT_ORDER.map((key) => {
        const delta = lastDelta?.[key] ?? 0;
        return (
          <div className="hud-stat" key={key}>
            <div className="n">
              {delta === 0 ? (
                <span className="reel-row">{stats[key]}</span>
              ) : (
                // key に changeId を渡して、選ぶたびにアニメーションをやり直す。
                // 同じ親の中でキーが重複すると React が古い要素を消し損ねるので、
                // 差分バッジとは別の名前空間にしておく。
                <StatReel key={`reel-${changeId}`} value={stats[key]} from={stats[key] - delta} />
              )}
              {delta !== 0 && (
                <span key={`delta-${changeId}`} className={`hud-delta ${delta > 0 ? "up" : "down"}`}>
                  {delta > 0 ? "+" : "−"}
                  {Math.abs(delta)}
                </span>
              )}
            </div>
            <div className="l">{STAT_LABELS[key]}</div>
          </div>
        );
      })}
    </div>
  );
}
