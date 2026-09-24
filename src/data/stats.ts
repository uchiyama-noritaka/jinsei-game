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

// フラグの読み方。選択肢が選べない理由を画面に出すときに使う。
// 「〜なら選べる」につながる形で書く。
export const FLAG_LABELS: Record<string, string> = {
  "decide-home": "在宅を選んでいた",
  "decide-facility": "施設を探しはじめていた",
  "know-shoukibo": "小規模多機能を知っていた",
  "talked-money": "通帳の在りかを聞いていた",
  "talked-house": "実家のことを決めていた",
  "talked-care": "母の医療の希望を聞いていた",
  "took-drawing": "あの絵を持ち帰っていた",
  "chose-wishes": "母の言葉どおりにした",
  "chose-together": "二人で決めた",
  "chose-treat": "できることは全部やった",
  "chose-doctor": "医師に委ねた",
};
