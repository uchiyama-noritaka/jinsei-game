import type { Chapter } from "../types";

// 第1章「日常編」
// 実家の母から届く、なんてことのないLINEから物語が始まる。
// ここでの返し方ひとつで、母との関係値がゆっくり変わっていく。
//
// ── 書くときの約束（第2章以降も同じ）──
// 選んだ内容に噛み合った返事は、すべて choice.reply に置く。
// ノード本文（messages）は、どの選択肢のあとに読んでも成立する内容だけにする。
// 会話が噛み合っていない感じを出したいときは、reply に意図してそう書く。

export const chapter1: Chapter = {
  id: "chapter1",
  title: "第1章",
  subtitle: "日常編 ── 「元気だよ」の一言から",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextChapterId: "chapter2",
  nodes: {
    n1: {
      id: "n1",
      messages: [
        { from: "system", text: "── ある日の午後 ──" },
        { from: "system", text: "実家の母から、いつものLINEが届いた。" },
        { from: "them", text: "ねえねえ、聞いて〜" },
        { from: "them", text: "今日、庭の草むしりしてたら1時間で完全に息切れしちゃって(笑)" },
        { from: "them", text: "歳には勝てないね〜" },
      ],
      choices: [
        {
          label: "え、大丈夫？無理しないでね",
          next: "n2",
          effects: { bondMother: 3 },
          reply: [{ from: "them", text: "大丈夫大丈夫、心配性なんだから(笑)" }],
        },
        {
          label: "母さんも歳だからね(笑)",
          next: "n2",
          effects: { bondMother: 1 },
          reply: [{ from: "them", text: "ちょっと、失礼しちゃう(笑)" }],
        },
        {
          label: "（既読のまま、後で返そうと思う）",
          next: "n2",
          effects: { bondMother: -2, energy: 2 },
          reply: [{ from: "system", text: "既読だけがついた。母は気にする様子もなく、続きを送ってくる。" }],
        },
      ],
    },

    n2: {
      id: "n2",
      messages: [
        { from: "them", text: "そういえばこの前も、鍵どこに置いたか15分くらい探しちゃって" },
        { from: "them", text: "歳のせいかな〜、やんなっちゃう" },
      ],
      choices: [
        {
          label: "ちゃんと休んでね",
          next: "n3",
          effects: { bondMother: 2 },
          reply: [{ from: "them", text: "ありがとう。あなたも無理しないでね" }],
        },
        {
          label: "あるある、私も忘れっぽいし気にしすぎだよ",
          next: "n3",
          effects: { bondMother: 1, knowledge: 1 },
          reply: [{ from: "them", text: "そうよね〜、みんなそうよね" }],
        },
        {
          label: "（へえ、くらいで聞き流す）",
          next: "n3",
          effects: { energy: 1 },
          reply: [{ from: "system", text: "「まあ、いいんだけどね」とだけ返ってきた。" }],
        },
      ],
    },

    n3: {
      id: "n3",
      messages: [
        { from: "them", text: "あ、そうそう。来月お父さんの誕生日だから、電話してあげてね" },
        { from: "them", text: "最近ちょっと元気ないみたいだから" },
      ],
      choices: [
        {
          label: "了解、電話するね",
          next: "end",
          effects: { bondMother: 2 },
          reply: [{ from: "them", text: "よかった。お父さん、きっと喜ぶわ" }],
        },
        {
          label: "忙しいから、LINEでメッセージ送っとくよ",
          next: "end",
          effects: { energy: 1 },
          reply: [{ from: "them", text: "うん、それでも喜ぶと思う" }],
        },
        {
          label: "また今度考える",
          next: "end",
          effects: { bondMother: -2 },
          reply: [{ from: "them", text: "……そう" }],
        },
      ],
    },

    end: {
      id: "end",
      end: true,
      messages: [],
      // 実際の結びは下の endings から、そのときのステータスで選ばれる
    },
  },

  // 上から順に判定し、最初に条件を満たしたものが採用される。
  // 最後の1つは条件なし＝フォールバック。
  // どの選択肢のあとに読んでも成立するよう、「会話の締め」だけを書く。
  endings: [
    {
      id: "warm",
      title: "いつもの、ふつうの一日",
      condition: { min: { bondMother: 55 } },
      messages: [
        { from: "them", text: "いつも話聞いてくれてありがとうね" },
        { from: "them", text: "また今度、顔見せに帰ってきてね" },
      ],
      note: "なんてことのない会話だった。この時点では、まだ誰も気づいていない。",
    },
    {
      id: "distant",
      title: "既読のまま、少し間があく",
      messages: [
        { from: "them", text: "うん、じゃあまたね" },
        { from: "system", text: "……（既読のまま、少し間があく）" },
      ],
      note: "忙しい日々のなかでは、これがふつうの距離感かもしれない。",
    },
  ],
};
