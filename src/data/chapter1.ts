import type { Chapter } from "../types";

// 第1章「日常編」
// 実家の母から届く、なんてことのないLINEから物語が始まる。
// ここでの返し方ひとつで、母との関係値がゆっくり変わっていく。

export const chapter1: Chapter = {
  id: "chapter1",
  title: "第1章",
  subtitle: "日常編 ── 「元気だよ」の一言から",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nodes: {
    n1: {
      id: "n1",
      messages: [
        { from: "them", text: "ねえねえ、聞いて〜" },
        { from: "them", text: "今日、庭の草むしりしてたら1時間で完全に息切れしちゃって(笑)" },
        { from: "them", text: "歳には勝てないね〜" },
      ],
      choices: [
        {
          label: "え、大丈夫？無理しないでね",
          next: "n2",
          effects: { bondMother: 3 },
        },
        {
          label: "母さんも歳だからね(笑)",
          next: "n2",
          effects: { bondMother: 1 },
        },
        {
          label: "（既読のまま、後で返そうと思う）",
          next: "n2",
          effects: { bondMother: -2, energy: 2 },
        },
      ],
    },

    n2: {
      id: "n2",
      messages: [
        { from: "them", text: "大丈夫大丈夫、心配性なんだから(笑)" },
        { from: "them", text: "そういえばこの前も、鍵どこに置いたか15分くらい探しちゃって" },
        { from: "them", text: "歳のせいかな〜、やんなっちゃう" },
      ],
      choices: [
        {
          label: "ちゃんと休んでね",
          next: "n3",
          effects: { bondMother: 2 },
        },
        {
          label: "あるある、私も忘れっぽいし気にしすぎだよ",
          next: "n3",
          effects: { bondMother: 1, knowledge: 1 },
        },
        {
          label: "（へえ、くらいで聞き流す）",
          next: "n3",
          effects: { energy: 1 },
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
        },
        {
          label: "忙しいから、LINEでメッセージ送っとくよ",
          next: "end",
          effects: { energy: 1 },
        },
        {
          label: "また今度考える",
          next: "end",
          effects: { bondMother: -2 },
        },
      ],
    },

    end: {
      id: "end",
      end: true,
      messages: [],
      // endingVariant はエンジン側で bondMother の値を見て動的に選ぶ
    },
  },
};

export const endingMessages = {
  warm: [
    { from: "them" as const, text: "いつも話聞いてくれてありがとうね" },
    { from: "them" as const, text: "また今度、顔見せに帰ってきてね" },
  ],
  distant: [
    { from: "them" as const, text: "うん、じゃあまたね" },
    { from: "them" as const, text: "……（既読のまま、少し間があく）" },
  ],
};
