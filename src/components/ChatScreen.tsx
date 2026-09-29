import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore, meetsCondition, speakerOf, wouldExhaust } from "../store/gameStore";
import { chapterById, chapterNumber, chapters } from "../data/chapters";
import { FLAG_LABELS, STAT_LABELS } from "../data/stats";
import { BREAKDOWN_ENDINGS } from "../data/breakdown";
import type { Choice, Speaker, Stats } from "../types";
import { MessageBubble } from "./MessageBubble";
import { StatusHUD } from "./StatusHUD";

const REVEAL_DELAY_MS = 650; // 相手からのメッセージ
const MY_REPLY_DELAY_MS = 150; // 自分の発言
const NARRATION_DELAY_MS = 850; // 地の文どうしの間
// 地の文のあと、最初のメッセージが来るまでの間。
// 場面の前提を読む時間をとるために、ここだけ長くしている
//（待っているあいだは入力中のアニメーションが出続ける）。
const AFTER_NARRATION_DELAY_MS = 1600;

// 「知識 5 以上なら選べる」のような、選べない理由の一文をつくる。
// ステータスの条件も、これまでの選択（フラグ）の条件も同じ形にそろえている。
function requirementHint(choice: Choice): string {
  const min = choice.requires?.min ?? {};
  const max = choice.requires?.max ?? {};
  const parts = [
    ...(Object.keys(min) as (keyof Stats)[]).map((k) => `${STAT_LABELS[k]} ${min[k]} 以上`),
    ...(Object.keys(max) as (keyof Stats)[]).map((k) => `${STAT_LABELS[k]} ${max[k]} 以下`),
    ...(choice.requires?.flags ?? []).map((f) => FLAG_LABELS[f] ?? f),
    ...(choice.requires?.notFlags ?? []).map((f) => `${FLAG_LABELS[f] ?? f}ときは選べない`),
  ];
  return `${parts.join(" / ")}なら選べる`;
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
  const brokeDown = useGameStore((s) => s.brokeDown);
  const choose = useGameStore((s) => s.choose);
  const advanceChapter = useGameStore((s) => s.advanceChapter);
  const retryChapter = useGameStore((s) => s.retryChapter);
  const restart = useGameStore((s) => s.restart);
  const hydrate = useGameStore((s) => s.hydrate);

  const [revealCount, setRevealCount] = useState(0);
  // セーブから戻したぶんの件数。ここまでは「もう読んだ」扱いにして、
  // 1通ずつの再生も地の文の表示もしない。
  const [resumedCount, setResumedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLButtonElement>(null);

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

  // 次のメッセージが別の相手のものなら、ここで進行を止めて通知を出す。
  // 自動で切り替えると、直前のやり取りを読み切る前に画面が変わってしまうため。
  const opensNewTalk = !!talk && revealCount < timeline.length && revealCount >= talk.end;
  const incomingTalk = opensNewTalk ? talks[talkIndex + 1] : undefined;

  // タイムラインが伸びたら、まだ見せていない分を1通ずつ表示する
  useEffect(() => {
    if (revealCount > timeline.length) {
      setRevealCount(timeline.length);
      return;
    }
    if (revealCount === timeline.length) return;
    if (opensNewTalk) return; // 通知をタップしてもらうまで待つ

    const prev = timeline[revealCount - 1];
    const current = timeline[revealCount];
    const delay =
      current.from === "me"
        ? MY_REPLY_DELAY_MS
        : current.from === "system"
          ? NARRATION_DELAY_MS
          : prev?.from === "system"
            ? AFTER_NARRATION_DELAY_MS
            : REVEAL_DELAY_MS;
    const t = setTimeout(() => setRevealCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [timeline, revealCount, opensNewTalk]);

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
  // 入力中のアニメーションは、相手の発言を待っているあいだだけ。
  // 地の文を待っているときや、次が別の相手のときには出さない。
  const showTyping = !allRevealed && !opensNewTalk && timeline[revealCount]?.from === "them";

  const ending = brokeDown
    ? BREAKDOWN_ENDINGS[brokeDown]
    : endingId
      ? chapter.endings.find((e) => e.id === endingId)
      : undefined;
  // 尽きて止まった章からは、次へは進めない
  const hasNextChapter = !!chapter.nextChapterId && !brokeDown;

  function openIncomingTalk() {
    setRevealCount((c) => c + 1);
  }

  // 通知の外を触ったときは、進めずにカードを一度光らせる。
  // 何も起きないと固まったように見えるので、押す場所のほうを教える。
  function nudgeNotice() {
    const el = noticeRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: "translateY(0) scale(1)", filter: "brightness(1)" },
        { transform: "translateY(-3px) scale(1.03)", filter: "brightness(1.08)" },
        { transform: "translateY(0) scale(1)", filter: "brightness(1)" },
      ],
      { duration: 460, easing: "ease-out" },
    );
  }

  // 相手が変わるところで進められるのは通知カードだけにしている。
  // どこを触っても進めるようにすると、早送りの手癖でタップした拍子に、
  // 読むために作った間を自分で飛ばしてしまうため。
  function handleTap() {
    if (opensNewTalk) {
      nudgeNotice();
      return;
    }
    if (talk) setRevealCount(Math.min(timeline.length, talk.end));
  }

  function handleAdvance(e: React.MouseEvent) {
    e.stopPropagation();
    advanceChapter();
    setRevealCount(0);
    setResumedCount(0);
  }

  function handleRetry(e: React.MouseEvent) {
    e.stopPropagation();
    retryChapter();
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
      onClick={!allRevealed ? handleTap : undefined}
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


          {/* 別の相手からの通知。視線と親指がある会話の末尾に、上から降りてくる */}
          {incomingTalk && (
            <button
              ref={noticeRef}
              className="talk-notice"
              onClick={(e) => {
                e.stopPropagation();
                openIncomingTalk();
              }}
            >
              <span className="talk-notice-avatar">{incomingTalk.speaker.avatar}</span>
              <span className="talk-notice-body">
                <span className="talk-notice-name">{incomingTalk.speaker.name}</span>
                <span className="talk-notice-text">
                  {timeline[incomingTalk.start]?.notice ?? "メッセージが届きました"}
                </span>
              </span>
              <span className="talk-notice-cta">タップして開く</span>
            </button>
          )}

          {isEnded && allRevealed && (
            <div
              className={`chapter-end-card${brokeDown ? " broken" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="chapter-end-title">
                {brokeDown ? `── ${chapter.title} 中断 ──` : `── ${chapter.title} 完 ──`}
              </div>
              {ending && <div className="chapter-end-ending">{ending.title}</div>}
              <p>{ending?.note}</p>
              <div className="chapter-end-actions">
                {hasNextChapter && (
                  <button className="next-btn" onClick={handleAdvance}>
                    次の章へ進む
                  </button>
                )}
                {brokeDown && (
                  <button className="next-btn" onClick={handleRetry}>
                    {chapter.title}をやり直す
                  </button>
                )}
                {!hasNextChapter && !brokeDown && (
                  <span className="chapter-end-soon">{chapter.nextTeaser ?? "続きは執筆中です"}</span>
                )}
                {!brokeDown && (
                  <button className="restart-btn ghost" onClick={handleRetry}>
                    {chapter.title}をやり直す
                  </button>
                )}
                <button className="restart-btn ghost" onClick={handleRestart}>
                  最初から
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showChoices && (
        <div className="choice-stack" onClick={(e) => e.stopPropagation()}>
          {node.choices!.map((c, i) => {
            const unlocked = meetsCondition(stats, c.requires, flags);
            // 選べはするが、選ぶとそこで物語が止まる選択
            const cliff = unlocked ? wouldExhaust(stats, c) : null;
            return (
              <button
                key={i}
                className={`choice-btn${unlocked ? "" : " locked"}${cliff ? " risky" : ""}`}
                onClick={() => choose(i)}
                disabled={!unlocked}
                title={unlocked ? undefined : requirementHint(c)}
              >
                {c.label}
                {!unlocked && <span className="choice-lock">{requirementHint(c)}</span>}
                {cliff && (
                  <span className="choice-cliff">
                    これを選ぶと{STAT_LABELS[cliff]}が尽きる
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <StatusHUD stats={stats} lastDelta={lastDelta} changeId={changeId} />
    </div>
  );
}
