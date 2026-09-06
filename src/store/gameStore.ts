import { create } from "zustand";
import type { Stats, StatDelta, Sender } from "../types";
import { chapter1, endingMessages } from "../data/chapter1";

const INITIAL_STATS: Stats = {
  money: 50,
  energy: 60,
  bondMother: 50,
  bondSibling: 50,
  knowledge: 0,
};

const WARM_ENDING_THRESHOLD = 55;
const SAVE_KEY = "jinsei-game-save-v1";

export type TimelineEntry = {
  from: Sender;
  text: string;
};

type SavedShape = {
  stats: Stats;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
};

type GameState = {
  stats: Stats;
  currentNodeId: string;
  timeline: TimelineEntry[];
  isEnded: boolean;
  endingVariant: "warm" | "distant" | null;
  applyDelta: (delta?: StatDelta) => void;
  choose: (choiceIndex: number) => void;
  restart: () => void;
  hydrate: () => void;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function persist(state: Pick<GameState, "stats" | "currentNodeId" | "timeline" | "isEnded">) {
  try {
    const payload: SavedShape = {
      stats: state.stats,
      currentNodeId: state.currentNodeId,
      timeline: state.timeline,
      isEnded: state.isEnded,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // localStorageが使えない環境でも黙って続行する
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  stats: { ...INITIAL_STATS },
  currentNodeId: chapter1.startNode,
  timeline: [...chapter1.nodes[chapter1.startNode].messages],
  isEnded: false,
  endingVariant: null,

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
    const node = chapter1.nodes[state.currentNodeId];
    const choice = node.choices?.[choiceIndex];
    if (!choice) return;

    get().applyDelta(choice.effects);

    const nextNode = chapter1.nodes[choice.next];
    const meEntry: TimelineEntry = { from: "me", text: choice.label };

    if (nextNode.end) {
      const finalBond = get().stats.bondMother;
      const variant: "warm" | "distant" = finalBond >= WARM_ENDING_THRESHOLD ? "warm" : "distant";
      const closing = endingMessages[variant];
      const newTimeline = [...state.timeline, meEntry, ...closing];
      set({
        timeline: newTimeline,
        currentNodeId: "end",
        isEnded: true,
        endingVariant: variant,
      });
      persist({ stats: get().stats, currentNodeId: "end", timeline: newTimeline, isEnded: true });
      return;
    }

    const newTimeline = [...state.timeline, meEntry, ...nextNode.messages];
    set({ timeline: newTimeline, currentNodeId: nextNode.id });
    persist({ stats: get().stats, currentNodeId: nextNode.id, timeline: newTimeline, isEnded: false });
  },

  restart: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // noop
    }
    set({
      stats: { ...INITIAL_STATS },
      currentNodeId: chapter1.startNode,
      timeline: [...chapter1.nodes[chapter1.startNode].messages],
      isEnded: false,
      endingVariant: null,
    });
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedShape;
      set({
        stats: saved.stats,
        currentNodeId: saved.currentNodeId,
        timeline: saved.timeline,
        isEnded: saved.isEnded,
      });
    } catch {
      // 壊れたセーブは無視して初期状態のまま
    }
  },
}));

export { chapter1 };
