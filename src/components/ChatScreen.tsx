import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore, meetsCondition, speakerOf } from "../store/gameStore";
import { chapterById, chapterNumber, chapters } from "../data/chapters";
import { FLAG_LABELS, STAT_LABELS } from "../data/stats";
import { BREAKDOWN_ENDINGS, LIMIT_KEYS, WARN_LINE } from "../data/breakdown";
import type { Choice, Speaker, StatKey, Stats } from "../types";
import { MessageBubble } from "./MessageBubble";
import { StatusHUD } from "./StatusHUD";
import { EndingGallery } from "./EndingGallery";
import { totalEndings } from "../data/collection";

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

// 選択肢に出す負担の内訳。
//
// 出すのは気力とお金だけで、関係値と知識は伏せたままにしている。
// 時間・体力・お金は、やる前におおよそ見積もれる。人との関係がどう動くかは
// やってみるまで分からない。出す数字と出さない数字を、そこに合わせた。
// 「これを選ぶと尽きる」という判定は出さない。判定を出すと、選ぶのは
// 終わらせたい人だけになり、自分の意思を通した結果として尽きる体験が消える。
//
// そして、数字が出るのは追い詰められてからにしてある。
// 余裕のあるうちから一部の選択肢にだけ数字が付くと、付いていない選択肢が
// 「何も起きない選択」に見えて霞む。現実の介護者も、限界が近づいて初めて
// 何にどれだけ使えるかを数え出す。
//
// 数え始めるかどうかは、気力とお金で別々に見る。
// お金が減っていても気力が十分なら、「気力 −2」は出さない。
// 足りているものの数字を見せられても、読み手には意味がないため。
function countingKeys(stats: Stats, started: StatKey[]): StatKey[] {
  return LIMIT_KEYS.filter((k) => stats[k] <= WARN_LINE || started.includes(k));
}

function costsOf(choice: Choice, keys: StatKey[]): { key: StatKey; delta: number }[] {
  return keys.map((key) => ({ key, delta: choice.effects?.[key] ?? 0 })).filter((c) => c.delta !== 0);
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
  const seenEndings = useGameStore((s) => s.seenEndings);
  const choose = useGameStore((s) => s.choose);
  const advanceChapter = useGameStore((s) => s.advanceChapter);
  const retryChapter = useGameStore((s) => s.retryChapter);
  const restart = useGameStore((s) => s.restart);
  const hydrate = useGameStore((s) => s.hydrate);

  const [revealCount, setRevealCount] = useState(0);
  // セーブから戻したぶんの件数。ここまでは「もう読んだ」扱いにして、
  // 1通ずつの再生も地の文の表示もしない。
  const [resumedCount, setResumedCount] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLButtonElement>(null);
  // 数え始めたステータス。気力とお金で別々に数え始める。
  // 一度始めたら、その周のあいだは出しっぱなしにする（出たり消えたりしないように）。
  const countingRef = useRef<StatKey[]>([]);
  // 数え始めた場面。断りの一文は、その場面のあいだだけ出す。
  // 描画のたびに出たり消えたりしないよう、ノードIDで覚えておく。
  const [countingStartedAt, setCountingStartedAt] = useState<string | null>(null);

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

  // 章末カードが伸びたときも追いかける。記録を開いたのに画面外、を防ぐ。
  useEffect(() => {
    if (!isEnded) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, [galleryOpen, isEnded]);


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

  // 数え始めたかどうか。一度始まったら、その章のあいだは出しっぱなしにする
  // （選択のたびに出たり消えたりすると、不具合に見えるため）。
  const counted = countingKeys(stats, countingRef.current);
  countingRef.current = counted;
  const counting = counted.length > 0;

  // 数え始めた最初の場面を一度だけ記録する。断りの一文は、その場面のあいだだけ出す。
  useEffect(() => {
    if (counting && countingStartedAt === null) setCountingStartedAt(currentNodeId);
  }, [counting, countingStartedAt, currentNodeId]);

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
    setGalleryOpen(false);
    setRevealCount(0);
    setResumedCount(0);
  }

  function handleRetry(e: React.MouseEvent) {
    e.stopPropagation();
    retryChapter();
    setGalleryOpen(false);
    countingRef.current = [];
    setCountingStartedAt(null);
    setRevealCount(0);
    setResumedCount(0);
  }

  function handleRestart(e: React.MouseEvent) {
    e.stopPropagation();
    restart();
    setGalleryOpen(false);
    countingRef.current = [];
    setCountingStartedAt(null);
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
          {showChoices && counting && countingStartedAt === currentNodeId && (
            <div className="system-line counting-note">
              そろそろ、{counted.map((k) => STAT_LABELS[k]).join("と")}
              をどれだけ使えるか、数えるようになった。
            </div>
          )}
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
                <button
                  className="restart-btn ghost gallery-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryOpen((v) => !v);
                  }}
                >
                  結末の記録 {seenEndings.length}/{totalEndings()}
                </button>
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
              {galleryOpen && <EndingGallery seen={seenEndings} />}
            </div>
          )}
        </div>
      </div>

      {showChoices && (
        <div className="choice-stack" onClick={(e) => e.stopPropagation()}>
          {node.choices!.map((c, i) => {
            const unlocked = meetsCondition(stats, c.requires, flags);
            const costs = unlocked ? costsOf(c, counted) : [];
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
                {costs.length > 0 && (
                  <span className="choice-costs">
                    {costs.map((cost) => (
                      <span
                        key={cost.key}
                        className={`choice-cost ${cost.delta < 0 ? "spend" : "gain"}`}
                      >
                        {STAT_LABELS[cost.key]} {cost.delta > 0 ? "+" : "−"}
                        {Math.abs(cost.delta)}
                      </span>
                    ))}
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
