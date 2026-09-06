import type { Chapter, Speaker } from "../types";

// 第2章「予兆編」
// 第1章から3か月後。「歳のせい」で説明できたことが、少しずつ説明できなくなる。
// この章で初めて、母以外の相手（隣人・兄）が会話に入ってくる。
// 第1章で積んだ knowledge と bondMother が、そのまま持ち越されて効いてくる。
//
// 書き方の約束は chapter1.ts の冒頭を参照。
// 選んだ内容に噛み合う返事は choice.reply に置き、ノード本文は
// どの選択肢のあとに読んでも成立する内容だけにする。

const NEIGHBOR: Speaker = { name: "隣の田中さん", avatar: "🏠", tone: "neighbor" };
const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };

export const chapter2: Chapter = {
  id: "chapter2",
  title: "第2章",
  subtitle: "予兆編 ── 「気のせい」が効かなくなる",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nodes: {
    n1: {
      id: "n1",
      messages: [
        { from: "system", text: "── 第1章から、3か月後 ──" },
        { from: "system", text: "母からのLINEは、前より増えた。" },
        { from: "system", text: "先々週は、りんごを送ったと連絡があった。" },
        { from: "system", text: "先週も、同じ知らせが届いた。" },
        { from: "them", text: "ねえ、この前送ったりんご届いた？" },
        { from: "them", text: "青森の、大きいやつ" },
        { from: "system", text: "同じ問いかけを読むのは、これで3度目だった。" },
      ],
      choices: [
        {
          // 気づきを言葉にする。優しくはないが、記録としては正しい。
          label: "届いたよ。それ、先週も聞いてくれたよね",
          next: "n2",
          effects: { bondMother: -1, knowledge: 3 },
          reply: [
            { from: "them", text: "あら、そうだった？やあね、私ったら(笑)" },
            { from: "them", text: "もう、歳ね" },
          ],
        },
        {
          label: "届いたよ、おいしかった。ありがとう",
          next: "n2",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "よかった〜。たくさん送ったから、遠慮しないで食べてね" },
          ],
        },
        {
          label: "その話、もう3回目だよ",
          next: "n2",
          effects: { bondMother: -3, knowledge: 1 },
          reply: [
            { from: "them", text: "……そうだった？" },
            { from: "them", text: "ごめんね。忘れちゃって" },
          ],
        },
      ],
    },

    n2: {
      id: "n2",
      messages: [
        { from: "them", text: "……あのね、笑わないで聞いてほしいんだけど" },
        { from: "them", text: "先週、お鍋を火にかけたまま買い物に行っちゃって" },
        { from: "them", text: "帰ったら家じゅう煙だらけで、鍋も真っ黒" },
      ],
      choices: [
        {
          label: "それ、けっこう危ないよ。コンロ、IHに替えない？",
          next: "n3",
          effects: { money: -8, bondMother: 2, knowledge: 2 },
          reply: [
            { from: "them", text: "そんな大げさな。お金だってかかるでしょ" },
            { from: "them", text: "……でも、あなたがそう言うなら考えとく" },
          ],
        },
        {
          label: "気をつけてね。無理しないで",
          next: "n3",
          effects: { bondMother: 1 },
          reply: [{ from: "them", text: "うん、気をつける" }],
        },
        {
          // 笑い話にせず、その場で兄に振る。母との会話はここで途切れ、数日後に飛ぶ。
          label: "（笑って流さずに、その場で兄にLINEする）",
          next: "n4",
          effects: { knowledge: 1, bondSibling: 1 },
          reply: [
            { from: "system", text: "兄に、鍋のことをそのまま伝えた。" },
            { from: "system", text: "「考えすぎだろ」とだけ返ってきて、それきりになった。" },
          ],
        },
      ],
    },

    n3: {
      id: "n3",
      messages: [
        { from: "them", text: "ま、大丈夫よ。たまたまだから" },
        { from: "them", text: "そんなことより、あなたこそご飯ちゃんと食べてるの" },
      ],
      choices: [
        {
          label: "食べてるよ。……今度の週末、顔見に行こうかな",
          next: "n4",
          effects: { money: -6, energy: -4, bondMother: 3 },
          reply: [
            { from: "them", text: "ほんと？じゃあ何か作っておくわね" },
            { from: "them", text: "何が食べたい？" },
          ],
        },
        {
          label: "食べてるよ。母さんこそ気をつけてね",
          next: "n4",
          effects: { bondMother: 1 },
          reply: [{ from: "them", text: "はいはい、わかってます(笑)" }],
        },
        {
          label: "うん。じゃあまたね",
          next: "n4",
          effects: { energy: 2, bondMother: -2 },
          reply: [{ from: "them", text: "うん。おやすみ" }],
        },
      ],
    },

    n4: {
      id: "n4",
      speaker: NEIGHBOR,
      messages: [
        { from: "system", text: "── 数日後・午後11時40分 ──" },
        { from: "system", text: "登録していない番号から、はじめてのLINEが届いた。" },
        { from: "them", text: "夜分にすみません、お隣の田中です" },
        { from: "them", text: "さきほど、お母様がパジャマのまま外にいらして" },
        { from: "them", text: "「バス停はどこですか」と聞かれたので、お家までお送りしました" },
        { from: "them", text: "ご存じかとは思いましたが、いちおうお伝えしておきますね" },
      ],
      choices: [
        {
          label: "教えてくださってありがとうございます。すぐ帰ります",
          next: "n5",
          effects: { money: -12, energy: -10, bondMother: 4, knowledge: 2 },
          reply: [
            { from: "them", text: "とんでもないです。お気をつけて" },
            { from: "system", text: "翌朝いちばんの新幹線を取った。" },
          ],
        },
        {
          label: "ありがとうございます。今度の週末、様子を見に行きます",
          next: "n5",
          effects: { money: -6, bondMother: 2, knowledge: 1 },
          reply: [{ from: "them", text: "ええ、そうしてあげてください" }],
        },
        {
          label: "兄に伝えます。実家の近くに住んでいるので",
          next: "n5",
          effects: { bondSibling: -3, knowledge: 1 },
          reply: [
            { from: "them", text: "そうですか" },
            { from: "them", text: "……何かあったら、いつでも言ってくださいね" },
          ],
        },
      ],
    },

    n5: {
      id: "n5",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "田中さんから聞いた" },
        { from: "them", text: "で、どうすんの。俺は平日は無理だぞ、仕事あるし" },
        { from: "them", text: "だいたい母さん、しっかりしてるときはしっかりしてるじゃん" },
      ],
      choices: [
        {
          label: "一度ちゃんと話そう。週末、実家で3人で",
          next: "n6",
          effects: { energy: -5, bondSibling: 4, knowledge: 1 },
          reply: [{ from: "them", text: "……わかった。土曜なら空けられる" }],
        },
        {
          label: "私がやるよ。お兄ちゃんは仕事してていいから",
          next: "n6",
          effects: { energy: -12, bondSibling: -1, bondMother: 2 },
          reply: [{ from: "them", text: "悪いな。助かる" }],
        },
        {
          label: "近くに住んでるのはそっちでしょ。少しは動いてよ",
          next: "n6",
          effects: { energy: -3, bondSibling: -6 },
          reply: [
            { from: "them", text: "はあ？俺だって様子は見に行ってるんだよ" },
            { from: "them", text: "そっちこそ、年に何回帰ってきてる" },
          ],
        },
        {
          // 第1章から知識を積んできたプレイヤーにだけ開く道。
          // 「家族だけで抱えない」という、この物語での正解に近い一手。
          label: "地域包括支援センターに相談してみる。家族だけでも無料で聞いてくれるって",
          next: "n6",
          effects: { energy: -2, bondSibling: 3, knowledge: 3 },
          requires: { min: { knowledge: 5 } },
          reply: [
            { from: "them", text: "……そんなのがあるのか" },
            { from: "them", text: "知らなかった" },
          ],
        },
      ],
    },

    n6: {
      id: "n6",
      speaker: BROTHER,
      messages: [
        { from: "them", text: "……なあ" },
        { from: "them", text: "正直、認めたくないだけかもしれない" },
        { from: "them", text: "この前帰ったとき、母さん、俺のこと父さんの名前で呼んだんだよ" },
        { from: "them", text: "聞き間違いってことにした" },
      ],
      choices: [
        {
          label: "私も、気のせいってことにしてた",
          next: "n7",
          effects: { bondSibling: 3, knowledge: 1 },
          reply: [{ from: "them", text: "……だよな" }],
        },
        {
          label: "一度、病院で診てもらお。物忘れ外来ってあるらしい",
          next: "n7",
          effects: { money: -4, bondSibling: 2, knowledge: 3 },
          reply: [{ from: "them", text: "そうだな。予約は俺が取るよ" }],
        },
        {
          label: "まだ大丈夫だよ、きっと",
          next: "n7",
          effects: { bondSibling: 1, knowledge: -1 },
          reply: [{ from: "them", text: "……だといいけどな" }],
        },
      ],
    },

    n7: {
      id: "n7",
      messages: [
        { from: "system", text: "── その夜・午前2時14分 ──" },
        { from: "system", text: "母から、通知が来た。" },
        { from: "them", text: "起きてる？" },
        { from: "them", text: "お父さんがいないの" },
        { from: "them", text: "さっきまで、そこにいたのに" },
      ],
      choices: [
        {
          label: "今から電話するね。出て",
          next: "end",
          effects: { energy: -6, bondMother: 5 },
          reply: [
            { from: "system", text: "呼び出し音が3回鳴って、母が出た。" },
            { from: "system", text: "受話器の向こうで、父のいびきが聞こえた。" },
          ],
        },
        {
          label: "お父さん、たぶん隣の部屋で寝てるよ。見てきて",
          next: "end",
          effects: { bondMother: 2, knowledge: 1 },
          reply: [
            { from: "them", text: "……ちょっと待ってね" },
            { from: "them", text: "あ、いた。寝てるわ" },
          ],
        },
        {
          label: "（通知には気づいたけれど、朝まで返さなかった）",
          next: "end",
          effects: { energy: 2, bondMother: -4 },
          reply: [{ from: "system", text: "画面を伏せた。通知は、それきり鳴らなかった。" }],
        },
      ],
    },

    end: {
      id: "end",
      end: true,
      messages: [],
    },
  },

  // どの選択肢のあとに読んでも成立するよう、結びは「翌朝」から書き起こす。
  endings: [
    {
      // 母との距離も、兄との分担も、知識もそろったときだけ通る結び。
      id: "faced",
      title: "向き合いはじめた夜",
      condition: { min: { knowledge: 8, bondSibling: 53 } },
      messages: [
        { from: "system", text: "翌朝、兄から短いメッセージが届いていた。" },
        { from: "system", text: "「来週の土曜、俺も休み取る。母さんと三人で話そう」" },
      ],
      note: "予兆を、ひとりではなく二人で見ることにした。ここからは、母を「どう介護するか」ではなく「どう暮らしてもらうか」の話になる。",
    },
    {
      // 母には寄り添えたが、抱え込みが始まっている。
      id: "alone",
      title: "あなただけが頼りよ",
      condition: { min: { bondMother: 58 } },
      messages: [
        { from: "them", text: "昨日の夜はごめんね。変なこと言って" },
        { from: "them", text: "あなただけが頼りよ" },
        { from: "system", text: "その一言が、少しだけ重かった。" },
      ],
      note: "母との距離は縮まった。ただし、この重さを一人で背負い続けられるかは別の話だ。",
    },
    {
      id: "unseen",
      title: "見ないふりをした夜",
      messages: [
        { from: "system", text: "翌朝、母からの通知は一件もなかった。" },
        { from: "system", text: "こちらから送る理由も、思いつかなかった。" },
      ],
      note: "気のせいということにした。予兆は消えたわけではなく、ただ誰にも見られなかっただけだった。",
    },
  ],
};
