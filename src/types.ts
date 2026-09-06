// ゲーム全体で使う型定義

export type Stats = {
  money: number; // お金
  energy: number; // 体力・気力
  bondMother: number; // 母との関係値
  bondSibling: number; // きょうだいとの関係値
  knowledge: number; // 介護・終活の知識
};

export type StatKey = keyof Stats;

export type StatDelta = Partial<Record<StatKey, number>>;

export type Sender = "me" | "them" | "system";

export type ScenarioMessage = {
  from: Sender;
  text: string;
};

export type Choice = {
  label: string;
  next: string; // 遷移先ノードID
  effects?: StatDelta;
};

export type ScenarioNode = {
  id: string;
  messages: ScenarioMessage[];
  choices?: Choice[];
  next?: string; // choicesが無い場合の自動遷移先
  end?: boolean; // 章の終端ノードかどうか
  // bondMotherがしきい値以上かどうかで終端メッセージを出し分けるための特別フラグ
  endingVariant?: "warm" | "distant";
};

export type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  npcName: string;
  npcAvatar: string;
  startNode: string;
  nodes: Record<string, ScenarioNode>;
};
