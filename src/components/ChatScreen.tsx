import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore, meetsCondition, speakerOf } from "../store/gameStore";
import { chapterById, chapterNumber, chapters } from "../data/chapters";
import { STAT_LABELS } from "../data/stats";
import type { Choice, Speaker, Stats } from "../types";
import { MessageBubble } from "./MessageBubble";
import { StatusHUD } from "./StatusHUD";

const REVEAL_DELAY_MS = 650;
const MY_REPLY_DELAY_MS = 150;
// 相手が変わるときは、前の画面を読み終える間を置いてから切り替える
const SWITCH_DELAY_MS = 950;

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

type Talk = { speaker: Speaker; start: number; end: number }; // end は含まない

// 同じ相手との連続したやり取りを、ひとつのトーク画面とみなして切り分ける。
// 相手が変わったら新しい画面が立ち上がり、前の画面の内容は持ち越さない。
// 同じ人に戻ってきたときも、まっさらな画面から始まる（過去ログは追わない設計）。
function splitIntoTalks(
  timeline: { speaker?: Speaker }[],
  fallback: Speaker,
): Talk[] {
  const talks: Talk[] = [];
  timeline.forEach((entry, i) => {
    const speaker = entry.speaker ?? fallback;
    const last = talks[talks.length - 1];
    if (last && last.speaker.name === speaker.name) last.end = i + 1;
    else talks.push({ speaker, start: i, end: i + 1 });
  });
  return talks;
}

export function ChatScreen() {
  const stats = useGameStore((s) => s.stats);
  const lastDelta = useGameStore((s) => s.lastDelta);
  const changeId = useGameStore((s) => s.changeId);
  const flags = useGameStore((s) => s.flags);
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
  // セーブから戻したぶんの件数。ここまでは「もう読んだ」扱いにして、
  // 1通ずつの再生も地の文の表示もしない。
  const [resumedCount, setResumedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // セーブがあれば、再生し直さずに最後の状態から続ける
    if (hydrate()) {
      const restored = useGameStore.getState().timeline.length;
      setRevealCount(restored);
      setResumedCount(restored);
    }
    // 初回マウント時のみセーブを読み込む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapter = chapterById(chapterId) ?? chapters[0];
  const node = chapter.nodes[currentNodeId];
  const talks = useMemo(
    () => splitIntoTalks(timeline, speakerOf(chapter, node)),
    // node は相手が未設定の古いセーブ向けの控えなので、依存は timeline と章だけでよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeline, chapter],
  );

  // いま開いている画面は、最後に表示したメッセージが属するトーク。
  const talkIndex = Math.max(
    0,
    talks.findIndex((t) => revealCount - 1 >= t.start && revealCount - 1 < t.end),
  );
  const talk = talks[talkIndex];
  const speaker = talk?.speaker ?? speakerOf(chapter, node);

  // タイムラインが伸びたら、まだ見せていない分を1通ずつ表示する
  useEffect(() => {
    if (revealCount > timeline.length) {
      setRevealCount(timeline.length);
      return;
    }
    if (revealCount === timeline.length) return;
    const opensNewTalk = !!talk && revealCount >= talk.end;
    const isIncoming = timeline[revealCount]?.from !== "me";
    const delay = opensNewTalk ? SWITCH_DELAY_MS : isIncoming ? REVEAL_DELAY_MS : MY_REPLY_DELAY_MS;
    const t = setTimeout(() => setRevealCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [timeline, revealCount, talk]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [revealCount]);

  // いま開いているトークのうち、表示済みのぶん
  const shown = useMemo(() => {
    if (!talk) return [];
    const rows: { index: number; from: "me" | "them" | "system"; text: string }[] = [];
    for (let i = talk.start; i < Math.min(revealCount, talk.end); i++) {
      const entry = timeline[i];
      // 復帰したぶんの地の文は出さない（場面の前置きを読み直させない）
      if (i < resumedCount && entry.from === "system") continue;
      rows.push({ index: i, from: entry.from, text: entry.text });
    }
    // 地の文だけのトークを空にしてしまわないよう、念のため
    if (!rows.length) {
      for (let i = talk.start; i < Math.min(revealCount, talk.end); i++) {
        const entry = timeline[i];
        rows.push({ index: i, from: entry.from, text: entry.text });
      }
    }
    return rows;
  }, [talk, timeline, revealCount, resumedCount]);

  const allRevealed = revealCount >= timeline.length;
  const showChoices = allRevealed && !isEnded && !!node?.choices?.length;
  // 次が別の相手なら、いまの画面で入力中を出さない（別の人が打っているように見えるため）
  const showTyping =
    !allRevealed && !!talk && revealCount < talk.end && timeline[revealCount]?.from !== "me";

  const ending = endingId ? chapter.endings.find((e) => e.id === endingId) : undefined;
  const hasNextChapter = !!chapter.nextChapterId;

  // タップでの早送りは、いま開いている画面の中だけにとどめる
  function handleSkip() {
    if (talk) setRevealCount(Math.min(timeline.length, talk.end));
  }

  function handleAdvance(e: React.MouseEvent) {
    e.stopPropagation();
    advanceChapter();
    setRevealCount(0);
    setResumedCount(0);
  }

  function handleRestart(e: React.MouseEvent) {
    e.stopPropagation();
    restart();
    setRevealCount(0);
    setResumedCount(0);
  }

  return (
    <div
      className={`phone${speaker.tone ? ` tone-${speaker.tone}` : ""}`}
      onClick={!allRevealed ? handleSkip : undefined}
    >
      <div className="phone-head">
        <div className="phone-avatar" key={`avatar-${talkIndex}`}>
          {speaker.avatar}
        </div>
        <div className="phone-head-text" key={`name-${talkIndex}`}>
          <div className="phone-name">{speaker.name}</div>
          <div className="phone-status">{chapter.subtitle}</div>
        </div>
        <div className="phone-chapter">
          {chapterNumber(chapter.id)} / {chapters.length}
        </div>
      </div>

      <div className="phone-body" ref={scrollRef}>
        {/* 相手が変わるたびに作り直して、新しい画面が立ち上がるように見せる */}
        <div className="talk" key={talkIndex}>
          {shown.map((m) => (
            <MessageBubble key={m.index} from={m.from} text={m.text} />
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
                  <span className="chapter-end-soon">{chapter.nextTeaser ?? "続きは執筆中です"}</span>
                  <button className="restart-btn" onClick={handleRestart}>
                    最初からやり直す
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showChoices && (
        <div className="choice-stack" onClick={(e) => e.stopPropagation()}>
          {node.choices!.map((c, i) => {
            const unlocked = meetsCondition(stats, c.requires, flags);
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
