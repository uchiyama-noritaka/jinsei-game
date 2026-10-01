import { chapters } from "./chapters";
import { BREAKDOWN_ENDINGS } from "./breakdown";
import type { Ending } from "../types";

// 見た結末の記録。
//
// セーブ（jinsei-game-save-v2）とは別に持つ。最初からやり直しても消えない。
// 周をまたいで残ることが、この記録の存在理由そのものなので。
//
// プレイ中の判断には一切関与しない。終わってから見るものなので、
// 「次はあれを見たい」が選択を歪めることはあっても、その場の選択は歪めない。
const KEY = "jinsei-game-endings-v1";

export type GalleryGroup = { title: string; endings: Ending[] };

// 章ごとの結末＋どの章でも起こりうる中断
export function galleryGroups(): GalleryGroup[] {
  return [
    ...chapters.map((ch) => ({ title: `${ch.title} ${ch.subtitle}`, endings: ch.endings })),
    { title: "章の途中で中断", endings: Object.values(BREAKDOWN_ENDINGS) },
  ];
}

export function totalEndings(): number {
  return galleryGroups().reduce((n, g) => n + g.endings.length, 0);
}

export function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSeen(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // 使えない環境でも黙って続行する
  }
}
