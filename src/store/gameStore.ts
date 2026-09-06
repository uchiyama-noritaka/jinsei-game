import { create } from "zustand";
import type { Condition, Stats, StatDelta, Sender } from "../types";
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
};

type SavedShape = {
  stats: Stats;
  chapterId: string;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
  endingId: string | null;
};

type GameState = {
  stats: Stats;
  chapterId: string;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
  endingId: string | null;
  applyDelta: (delta?: StatDelta) => void;
  choose: (choiceIndex: number) => void;
  advanceChapter: () => void;
  restart: () => void;
  hydrate: () => void;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

// min/maxに書いたステータスをすべて満たしていればtrue。条件なしは常にtrue。
export function meetsCondition(stats: Stats, condition?: Condition): boolean {
  if (!condition) return true;
  const min = condition.min ?? {};
  const max = condition.max ?? {};
  const okMin = (Object.keys(min) as (keyof Stats)[]).every((k) => stats[k] >= (min[k] ?? 0));
  const okMax = (Object.keys(max) as (keyof Stats)[]).every((k) => stats[k] <= (max[k] ?? 100));
  return okMin && okMax;
}

function firstChapterState() {
  const chapter = chapters[0];
  return {
    chapterId: chapter.id,
    currentNodeId: chapter.startNode,
    timeline: [...chapter.nodes[chapter.startNode].messages],
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
    if (!meetsCondition(state.stats, choice.requires)) return;

    get().applyDelta(choice.effects);

    const nextNode = chapter.nodes[choice.next];
    if (!nextNode) return;
    const meEntry: TimelineEntry = { from: "me", text: choice.label };

    if (nextNode.end) {
      const stats = get().stats;
      // 上から順に判定し、最初に条件を満たしたもの。全部外れたら最後の1つ。
      const ending =
        chapter.endings.find((e) => meetsCondition(stats, e.condition)) ??
        chapter.endings[chapter.endings.length - 1];
      const newTimeline = [...state.timeline, meEntry, ...ending.messages];
      set({
        timeline: newTimeline,
        currentNodeId: nextNode.id,
        isEnded: true,
        endingId: ending.id,
      });
      persist({
        stats,
        chapterId: chapter.id,
        currentNodeId: nextNode.id,
        timeline: newTimeline,
        isEnded: true,
        endingId: ending.id,
      });
      return;
    }

    const newTimeline = [...state.timeline, meEntry, ...nextNode.messages];
    set({ timeline: newTimeline, currentNodeId: nextNode.id });
    persist({
      stats: get().stats,
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

    const timeline = [...next.nodes[next.startNode].messages];
    set({
      chapterId: next.id,
      currentNodeId: next.startNode,
      timeline,
      isEnded: false,
      endingId: null,
    });
    persist({
      stats: state.stats,
      chapterId: next.id,
      currentNodeId: next.startNode,
      timeline,
      isEnded: false,
      endingId: null,
    });
  },

  restart: () => {
    clearSave();
    set({ stats: { ...INITIAL_STATS }, ...firstChapterState() });
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedShape;
      // 章やノードを作り替えたあとの古いセーブで詰まないよう、実在を確認してから復元する
      const chapter = chapterById(saved.chapterId);
      if (!chapter || !chapter.nodes[saved.currentNodeId]) return;
      set({
        stats: saved.stats,
        chapterId: saved.chapterId,
        currentNodeId: saved.currentNodeId,
        timeline: saved.timeline,
        isEnded: saved.isEnded,
        endingId: saved.endingId ?? null,
      });
    } catch {
      // 壊れたセーブは無視して初期状態のまま
    }
  },
}));
