import { create } from "zustand";
import type { Chapter, Condition, ScenarioMessage, ScenarioNode, Speaker, Stats, StatDelta, Sender } from "../types";
import { chapterById, chapters } from "../data/chapters";

const INITIAL_STATS: Stats = {
  money: 50,
  energy: 60,
  bondMother: 50,
  bondSibling: 50,
  knowledge: 0,
};

// 章をまたぐ保存形式に変えたのでキーもv2にした。v1のセーブは読まずに捨てる。
const SAVE_KEY = "jinsei-game-save-v2";
const LEGACY_SAVE_KEYS = ["jinsei-game-save-v1"];

export type TimelineEntry = {
  from: Sender;
  text: string;
  // このメッセージが「誰との会話」のものか。ヘッダーと画面の地の色は、
  // 現在ノードではなく“表示済みの最後のメッセージ”のこれに追従する。
  // そうしないと、選んだ瞬間に相手が切り替わり、自分の発言が
  // 次の相手のトーク画面に出ているように見えてしまう。
  speaker?: Speaker;
  // トークを開くときの通知の一行（そのノートの最初のメッセージだけが持つ）
  notice?: string;
};

type SavedShape = {
  stats: Stats;
  flags?: string[];
  chapterId: string;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
  endingId: string | null;
};

type GameState = {
  stats: Stats;
  // 直前の選択で実際に動いたぶん（0のキーは持たない）。HUDの演出用で、セーブはしない。
  // choice.effects ではなく前後の差を入れる。0や100で頭打ちになったときに、
  // 動いていない数字を「+4」と表示してしまわないようにするため。
  lastDelta: StatDelta | null;
  // 選ぶたびに増える。同じ値に戻ったときもアニメーションをやり直せるようにするための鍵。
  changeId: number;
  // これまでの選択で立った印。章をまたいで持ち越す。
  flags: string[];
  chapterId: string;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
  endingId: string | null;
  applyDelta: (delta?: StatDelta) => void;
  choose: (choiceIndex: number) => void;
  advanceChapter: () => void;
  restart: () => void;
  // セーブを読み込んだら true。復帰直後は演出を出さず、最後の状態から再開するため
  // 呼び出し側が「復帰したのか、最初から始めたのか」を区別できるようにしている。
  hydrate: () => boolean;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

// 書かれた条件をすべて満たしていればtrue。条件なしは常にtrue。
export function meetsCondition(stats: Stats, condition?: Condition, flags: string[] = []): boolean {
  if (!condition) return true;
  const min = condition.min ?? {};
  const max = condition.max ?? {};
  const okMin = (Object.keys(min) as (keyof Stats)[]).every((k) => stats[k] >= (min[k] ?? 0));
  const okMax = (Object.keys(max) as (keyof Stats)[]).every((k) => stats[k] <= (max[k] ?? 100));
  const okFlags = (condition.flags ?? []).every((f) => flags.includes(f));
  const okNotFlags = (condition.notFlags ?? []).every((f) => !flags.includes(f));
  return okMin && okMax && okFlags && okNotFlags;
}

export function speakerOf(chapter: Chapter, node?: ScenarioNode): Speaker {
  return node?.speaker ?? { name: chapter.npcName, avatar: chapter.npcAvatar };
}

function entries(messages: ScenarioMessage[], speaker: Speaker, notice?: string): TimelineEntry[] {
  return messages.map((m, i) => (i === 0 && notice ? { ...m, speaker, notice } : { ...m, speaker }));
}

// 章の書き出し。prologue があれば、そのときの状態に合ったものを本文の前に置く。
function startTimeline(chapter: Chapter, stats: Stats, flags: string[]): TimelineEntry[] {
  const start = chapter.nodes[chapter.startNode];
  const intro = chapter.prologue?.find((p) => meetsCondition(stats, p.condition, flags));
  return entries([...(intro?.messages ?? []), ...start.messages], speakerOf(chapter, start), start.notice);
}

function firstChapterState() {
  const chapter = chapters[0];
  return {
    chapterId: chapter.id,
    currentNodeId: chapter.startNode,
    timeline: startTimeline(chapter, INITIAL_STATS, []),
    isEnded: false,
    endingId: null as string | null,
  };
}

function persist(state: SavedShape) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorageが使えない環境でも黙って続行する
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // noop
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  stats: { ...INITIAL_STATS },
  lastDelta: null,
  changeId: 0,
  flags: [],
  ...firstChapterState(),

  applyDelta: (delta) => {
    if (!delta) return;
    set((state) => {
      const next = { ...state.stats };
      (Object.keys(delta) as (keyof Stats)[]).forEach((key) => {
        next[key] = clamp(next[key] + (delta[key] ?? 0));
      });
      return { stats: next };
    });
  },

  choose: (choiceIndex) => {
    const state = get();
    const chapter = chapterById(state.chapterId);
    const node = chapter?.nodes[state.currentNodeId];
    const choice = node?.choices?.[choiceIndex];
    if (!chapter || !choice) return;
    // 条件付きの選択肢は、UIで無効化していても念のためここでも弾く
    if (!meetsCondition(state.stats, choice.requires, state.flags)) return;

    const before = state.stats;
    get().applyDelta(choice.effects);
    const after = get().stats;
    const moved: StatDelta = {};
    (Object.keys(after) as (keyof Stats)[]).forEach((k) => {
      if (after[k] !== before[k]) moved[k] = after[k] - before[k];
    });
    // 同じ印を二重に立てない
    const flags = choice.flags
      ? [...state.flags, ...choice.flags.filter((f) => !state.flags.includes(f))]
      : state.flags;
    set((s) => ({
      lastDelta: Object.keys(moved).length ? moved : null,
      changeId: s.changeId + 1,
      flags,
    }));

    const nextNode = chapter.nodes[choice.next];
    if (!nextNode) return;

    // 自分の発言と、それに対する相手の返しは、まだ「今の相手」との会話。
    // 場面が変わるのは、遷移先ノードの本文が表示され始めてから。
    const here = speakerOf(chapter, node);
    const meEntry: TimelineEntry = { from: "me", text: choice.label, speaker: here };
    const replyEntries = entries(choice.reply ?? [], here);

    if (nextNode.end) {
      const stats = get().stats;
      // 上から順に判定し、最初に条件を満たしたもの。全部外れたら最後の1つ。
      const ending =
        chapter.endings.find((e) => meetsCondition(stats, e.condition, flags)) ??
        chapter.endings[chapter.endings.length - 1];
      const newTimeline = [
        ...state.timeline,
        meEntry,
        ...replyEntries,
        ...entries(ending.messages, speakerOf(chapter, nextNode), nextNode.notice),
      ];
      set({
        timeline: newTimeline,
        currentNodeId: nextNode.id,
        isEnded: true,
        endingId: ending.id,
      });
      persist({
        stats,
        flags,
        chapterId: chapter.id,
        currentNodeId: nextNode.id,
        timeline: newTimeline,
        isEnded: true,
        endingId: ending.id,
      });
      return;
    }

    const newTimeline = [
      ...state.timeline,
      meEntry,
      ...replyEntries,
      ...entries(nextNode.messages, speakerOf(chapter, nextNode), nextNode.notice),
    ];
    set({ timeline: newTimeline, currentNodeId: nextNode.id });
    persist({
      stats: get().stats,
      flags,
      chapterId: chapter.id,
      currentNodeId: nextNode.id,
      timeline: newTimeline,
      isEnded: false,
      endingId: null,
    });
  },

  // 次の章へ。ステータスは引き継ぎ、タイムラインだけ新しい章のものに入れ替える。
  advanceChapter: () => {
    const state = get();
    const nextId = chapterById(state.chapterId)?.nextChapterId;
    const next = nextId ? chapterById(nextId) : undefined;
    if (!next) return;

    const timeline = startTimeline(next, state.stats, state.flags);
    set({
      lastDelta: null,
      chapterId: next.id,
      currentNodeId: next.startNode,
      timeline,
      isEnded: false,
      endingId: null,
    });
    persist({
      stats: state.stats,
      flags: state.flags,
      chapterId: next.id,
      currentNodeId: next.startNode,
      timeline,
      isEnded: false,
      endingId: null,
    });
  },

  restart: () => {
    clearSave();
    set({ stats: { ...INITIAL_STATS }, lastDelta: null, changeId: 0, flags: [], ...firstChapterState() });
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as SavedShape;
      // 章やノードを作り替えたあとの古いセーブで詰まないよう、実在を確認してから復元する
      const chapter = chapterById(saved.chapterId);
      if (!chapter || !chapter.nodes[saved.currentNodeId]) return false;
      set({
        stats: saved.stats,
        // フラグを持たない古いセーブでも壊れないようにする
        flags: saved.flags ?? [],
        // 読み込みは「操作の結果」ではないので、演出は出さない
        lastDelta: null,
        chapterId: saved.chapterId,
        currentNodeId: saved.currentNodeId,
        timeline: saved.timeline,
        isEnded: saved.isEnded,
        endingId: saved.endingId ?? null,
      });
      return true;
    } catch {
      // 壊れたセーブは無視して初期状態のまま
      return false;
    }
  },
}));
