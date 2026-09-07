import { useEffect, useRef, useState } from "react";
import { useGameStore, meetsCondition, speakerOf } from "../store/gameStore";
import { chapterById, chapterNumber, chapters } from "../data/chapters";
import { STAT_LABELS } from "../data/stats";
import type { Choice, Stats } from "../types";
import { MessageBubble } from "./MessageBubble";
import { StatusHUD } from "./StatusHUD";

const REVEAL_DELAY_MS = 650;
const MY_REPLY_DELAY_MS = 150;

// 「知識 5 以上」のような、選べない理由の一文をつくる
function requirementHint(choice: Choice): string {
  const min = choice.requires?.min ?? {};
  const max = choice.requires?.max ?? {};
  const parts = [
    ...(Object.keys(min) as (keyof Stats)[]).map((k) => `${STAT_LABELS[k]} ${min[k]} 以上`),
    ...(Object.keys(max) as (keyof Stats)[]).map((k) => `${STAT_LABELS[k]} ${max[k]} 以下`),
  ];
  return `${parts.join(" / ")} で選べる`;
}

export function ChatScreen() {
  const stats = useGameStore((s) => s.stats);
  const lastDelta = useGameStore((s) => s.lastDelta);
  const changeId = useGameStore((s) => s.changeId);
  const chapterId = useGameStore((s) => s.chapterId);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const timeline = useGameStore((s) => s.timeline);
  const isEnded = useGameStore((s) => s.isEnded);
  const endingId = useGameStore((s) => s.endingId);
  const choose = useGameStore((s) => s.choose);
  const advanceChapter = useGameStore((s) => s.advanceChapter);
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

  const chapter = chapterById(chapterId) ?? chapters[0];
  const node = chapter.nodes[currentNodeId];
  // 表示済みの最後のメッセージに合わせる。まだ1通も出ていないあいだだけ、
  // 現在ノードの相手を使う（章の頭とセーブ読み込み直後）。
  const speaker = timeline[revealCount - 1]?.speaker ?? speakerOf(chapter, node);
  const ending = endingId ? chapter.endings.find((e) => e.id === endingId) : undefined;
  const hasNextChapter = !!chapter.nextChapterId;

  const allRevealed = revealCount >= timeline.length;
  const showChoices = allRevealed && !isEnded && !!node?.choices?.length;
  const showTyping = !allRevealed && timeline[revealCount]?.from !== "me";

  function handleSkip() {
    setRevealCount(timeline.length);
  }

  function handleAdvance(e: React.MouseEvent) {
    e.stopPropagation();
    advanceChapter();
    setRevealCount(0);
  }

  function handleRestart(e: React.MouseEvent) {
    e.stopPropagation();
    restart();
    setRevealCount(0);
  }

  return (
    <div
      className={`phone${speaker.tone ? ` tone-${speaker.tone}` : ""}`}
      onClick={!allRevealed ? handleSkip : undefined}
    >
      <div className="phone-head">
        <div className="phone-avatar">{speaker.avatar}</div>
        <div className="phone-head-text">
          <div className="phone-name">{speaker.name}</div>
          <div className="phone-status">{chapter.subtitle}</div>
        </div>
        <div className="phone-chapter">
          {chapterNumber(chapter.id)} / {chapters.length}
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
            <div className="chapter-end-title">── {chapter.title} 完 ──</div>
            {ending && <div className="chapter-end-ending">{ending.title}</div>}
            <p>{ending?.note}</p>
            {hasNextChapter ? (
              <div className="chapter-end-actions">
                <button className="next-btn" onClick={handleAdvance}>
                  次の章へ進む
                </button>
                <button className="restart-btn ghost" onClick={handleRestart}>
                  最初からやり直す
                </button>
              </div>
            ) : (
              <div className="chapter-end-actions">
                <span className="chapter-end-soon">第3章「決断編」は執筆中です</span>
                <button className="restart-btn" onClick={handleRestart}>
                  最初からやり直す
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showChoices && (
        <div className="choice-stack" onClick={(e) => e.stopPropagation()}>
          {node.choices!.map((c, i) => {
            const unlocked = meetsCondition(stats, c.requires);
            return (
              <button
                key={i}
                className={`choice-btn${unlocked ? "" : " locked"}`}
                onClick={() => choose(i)}
                disabled={!unlocked}
                title={unlocked ? undefined : requirementHint(c)}
              >
                {c.label}
                {!unlocked && <span className="choice-lock">{requirementHint(c)}</span>}
              </button>
            );
          })}
        </div>
      )}

      <StatusHUD stats={stats} lastDelta={lastDelta} changeId={changeId} />
    </div>
  );
}
