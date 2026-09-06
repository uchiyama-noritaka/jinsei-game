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

// ステータスの条件。min/maxに書いたキーを「すべて」満たしたときに成立する。
// 選択肢の解禁条件と、エンディングの分岐条件の両方で使う。
export type Condition = {
  min?: StatDelta;
  max?: StatDelta;
};

export type Sender = "me" | "them" | "system";

export type ScenarioMessage = {
  from: Sender;
  text: string;
};

export type Choice = {
  label: string;
  next: string; // 遷移先ノードID
  effects?: StatDelta;
  // 満たしていないと選べない条件。知識や関係値を積んだプレイヤーにだけ開く道。
  requires?: Condition;
  // 選んだ直後に返ってくる一言。この選択肢を選んだときにだけ表示される。
  // 「選んだ内容と噛み合った返事」はすべてここに置き、遷移先ノードの本文は
  // どの選択肢のあとに読んでも成立する内容だけにする。
  // 会話が噛み合っていない演出をしたいときは、ここに意図してそう書く。
  reply?: ScenarioMessage[];
};

// 会話相手。章の途中で母以外（兄・近所の人）に切り替わるときに使う。
// tone は画面の地の色を切り替えるためのキー（省略時は章の既定色）。
export type Speaker = {
  name: string;
  avatar: string;
  tone?: SpeakerTone;
};

export type SpeakerTone = "neighbor" | "sibling";

export type ScenarioNode = {
  id: string;
  messages: ScenarioMessage[];
  choices?: Choice[];
  next?: string; // choicesが無い場合の自動遷移先
  end?: boolean; // 章の終端ノードかどうか
  speaker?: Speaker; // 省略時は章のデフォルト相手
};

// 章の結び。上から順に条件を判定し、最初に成立したものを採用する。
// 条件を持たないエンディングはフォールバックとして最後に置く。
export type Ending = {
  id: string;
  title: string;
  condition?: Condition;
  messages: ScenarioMessage[];
  note: string; // 結末のあとに出す、プレイヤーへの振り返り
};

export type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  npcName: string;
  npcAvatar: string;
  startNode: string;
  nodes: Record<string, ScenarioNode>;
  endings: Ending[];
  nextChapterId?: string; // 次の章。未定義なら現時点の最終章
};
