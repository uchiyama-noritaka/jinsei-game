import { useEffect, useRef, useState } from "react";
import { useGameStore, chapter1 } from "../store/gameStore";
import { MessageBubble } from "./MessageBubble";
import { StatusHUD } from "./StatusHUD";

const REVEAL_DELAY_MS = 650;
const MY_REPLY_DELAY_MS = 150;

export function ChatScreen() {
  const stats = useGameStore((s) => s.stats);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const timeline = useGameStore((s) => s.timeline);
  const isEnded = useGameStore((s) => s.isEnded);
  const choose = useGameStore((s) => s.choose);
  const restart = useGameStore((s) => s.restart);
  const hydrate = useGameStore((s) => s.hydrate);

  const [revealCount, setRevealCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
    // 初回マウント時のみセーブを読み込む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タイムラインが伸びたら、まだ見せていない分を1通ずつ表示する
  useEffect(() => {
    if (revealCount > timeline.length) {
      setRevealCount(timeline.length);
      return;
    }
    if (revealCount === timeline.length) return;
    const isIncoming = timeline[revealCount]?.from !== "me";
    const delay = isIncoming ? REVEAL_DELAY_MS : MY_REPLY_DELAY_MS;
    const t = setTimeout(() => setRevealCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [timeline, revealCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [revealCount]);

  const node = chapter1.nodes[currentNodeId];
  const allRevealed = revealCount >= timeline.length;
  const showChoices = allRevealed && !isEnded && !!node?.choices?.length;
  const showTyping = !allRevealed && timeline[revealCount]?.from !== "me";

  function handleSkip() {
    setRevealCount(timeline.length);
  }

  function handleRestart(e: React.MouseEvent) {
    e.stopPropagation();
    restart();
    setRevealCount(0);
  }

  return (
    <div className="phone" onClick={!allRevealed ? handleSkip : undefined}>
      <div className="phone-head">
        <div className="phone-avatar">{chapter1.npcAvatar}</div>
        <div className="phone-head-text">
          <div className="phone-name">{chapter1.npcName}</div>
          <div className="phone-status">{chapter1.subtitle}</div>
        </div>
      </div>

      <div className="phone-body" ref={scrollRef}>
        {timeline.slice(0, revealCount).map((m, i) => (
          <MessageBubble key={i} from={m.from} text={m.text} />
        ))}

        {showTyping && (
          <div className="bubble-row them">
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {isEnded && allRevealed && (
          <div className="chapter-end-card" onClick={(e) => e.stopPropagation()}>
            <div className="chapter-end-title">── 第1章 完 ──</div>
            <p>
              第2章「予兆編」は開発中です。ここまでの返し方が、母との関係にどう響いたかは、
              上のやり取りとステータスに表れています。
            </p>
            <button className="restart-btn" onClick={handleRestart}>
              最初からやり直す
            </button>
          </div>
        )}
      </div>

      {showChoices && (
        <div className="choice-stack" onClick={(e) => e.stopPropagation()}>
          {node.choices!.map((c, i) => (
            <button key={i} className="choice-btn" onClick={() => choose(i)}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      <StatusHUD stats={stats} />
    </div>
  );
}
