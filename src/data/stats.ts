import type { StatKey } from "../types";

// ステータスの表示名。HUDと、選択肢の解禁条件の表示で共有する。
export const STAT_LABELS: Record<StatKey, string> = {
  money: "お金",
  energy: "気力",
  bondMother: "母との関係",
  bondSibling: "きょうだい",
  knowledge: "知識",
};

export const STAT_ORDER: StatKey[] = ["money", "energy", "bondMother", "bondSibling", "knowledge"];
