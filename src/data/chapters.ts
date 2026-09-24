import type { Chapter } from "../types";
import { chapter1 } from "./chapter1";
import { chapter2 } from "./chapter2";
import { chapter3 } from "./chapter3";
import { chapter4 } from "./chapter4";
import { chapter5 } from "./chapter5";
import { chapter6 } from "./chapter6";
import { chapter7 } from "./chapter7";

// 章の登録簿。章を足すときは、ここに1行追加して
// 前の章の nextChapterId を新しい章のIDに向けるだけでよい。
export const chapters: Chapter[] = [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6, chapter7];

export const FIRST_CHAPTER_ID = chapters[0].id;

export function chapterById(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function chapterNumber(id: string): number {
  return chapters.findIndex((c) => c.id === id) + 1;
}
