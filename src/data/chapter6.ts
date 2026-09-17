import type { Chapter, Speaker } from "../types";

// 第6章「看取り編」
// 第5章で母の希望を聞けたかどうかが、ここで効く。
// 聞けていた人は母の言葉に沿って決められる。聞けていない人は、
// 本人の意思が分からないまま家族が決めることになる。
// その差を、選択肢の解禁とエンディングの両方に出している。
//
// 「正しい選択」は用意していない。どれを選んでも後悔は残る、という前提で書いた。
// ただし、母の言葉を持っている人だけは「自分が決めた」という重さを負わずに済む。
//
// 決めた内容は数字に写せないのでフラグで覚える。
//   chose-wishes   … 母の言葉どおりにした
//   chose-together … 二人で決めた
//   chose-treat    … できることは全部やる
//   chose-doctor   … 決めきれず医師に委ねた
//
// 書き方の約束は chapter1.ts の冒頭を参照。

const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };
const FATHER: Speaker = { name: "父", avatar: "👴", tone: "father" };
const DOCTOR: Speaker = { name: "川原先生（主治医）", avatar: "🩺", tone: "hospital" };

export const chapter6: Chapter = {
  id: "chapter6",
  title: "第6章",
  subtitle: "看取り編 ── その日の決め方",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextTeaser: "第7章は執筆中です",

  // 第5章で何を聞けていたかで書き出しが変わる。
  prologue: [
    {
      condition: { flags: ["talked-money", "talked-house", "talked-care"] },
      messages: [
        { from: "system", text: "── 第5章から、8か月後 ──" },
        { from: "system", text: "エンディングノートは、引き出しの手前に置いてある。" },
        { from: "system", text: "使う日が来るとは、まだ思っていなかった。" },
      ],
    },
    {
      condition: { flags: ["talked-care"] },
      messages: [
        { from: "system", text: "── 第5章から、8か月後 ──" },
        { from: "system", text: "母の言葉は、スマホのメモに残してある。" },
        { from: "system", text: "「痛いのは嫌」。読み返したのは、あの日以来だった。" },
      ],
    },
    {
      condition: { flags: ["talked-money"] },
      messages: [
        { from: "system", text: "── 第5章から、8か月後 ──" },
        { from: "system", text: "通帳の在りかは分かっている。" },
        { from: "system", text: "それ以外のことは、何も聞けていない。" },
      ],
    },
    {
      messages: [
        { from: "system", text: "── 第5章から、8か月後 ──" },
        { from: "system", text: "聞きそびれたまま、母が自分の言葉で話せる日は減っていった。" },
        { from: "system", text: "そのうち、と思っているうちに、そのうちが来なくなった。" },
      ],
    },
  ],

  nodes: {
    n1: {
      id: "n1",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "母さん、熱が出て入院した" },
        { from: "them", text: "誤嚥性肺炎だって" },
        { from: "them", text: "いまは点滴で落ち着いてる" },
      ],
      choices: [
        {
          label: "すぐ行く。今日の便を取る",
          next: "n2",
          effects: { money: -12, energy: -10, bondMother: 3 },
          reply: [
            { from: "them", text: "助かる" },
            { from: "them", text: "……正直、ひとりで待つのがきつかった" },
          ],
        },
        {
          label: "明日の朝いちばんで行く。今夜は頼む",
          next: "n2",
          effects: { money: -8, energy: -4, bondSibling: 2, bondMother: 1 },
          reply: [{ from: "them", text: "わかった。何かあったらすぐ連絡する" }],
        },
        {
          label: "容体が変わったら連絡して",
          next: "n2",
          effects: { energy: 2, bondSibling: -3, bondMother: -2 },
          reply: [
            { from: "them", text: "……ああ" },
            { from: "them", text: "そうする" },
          ],
        },
      ],
    },

    n2: {
      id: "n2",
      speaker: DOCTOR,
      messages: [
        { from: "system", text: "── 病院の面談室で ──" },
        { from: "them", text: "担当の川原です。お母様の状態をご説明します" },
        { from: "them", text: "誤嚥性肺炎です。今回は薬で治まりましたが、繰り返します" },
        { from: "them", text: "飲み込む力が落ちていて、食べ物や唾液が気管に入ってしまうんです" },
        { from: "them", text: "次に同じことが起きたとき、どこまでの治療を行うか" },
        { from: "them", text: "ご家族で決めておいていただけますか" },
      ],
      choices: [
        {
          label: "胃ろうという選択肢がある、と聞いたことがあります",
          next: "n3",
          effects: { knowledge: 3 },
          reply: [
            { from: "them", text: "はい。お腹から直接、栄養を入れる方法です" },
            { from: "them", text: "延命にはなりますが、口から食べる楽しみは失われます" },
          ],
        },
        {
          // 第5章で母から直接聞いていた人だけが出せる言葉。
          label: "本人の希望は聞いています。管だらけになるのは嫌だと",
          next: "n3",
          effects: { knowledge: 2, bondMother: 2 },
          requires: { flags: ["talked-care"] },
          reply: [
            { from: "them", text: "……それは、とても大きな情報です" },
            { from: "them", text: "ご本人の言葉があると、私たちも迷わずに済みます" },
          ],
        },
        {
          label: "正直、どうすればいいのか分かりません",
          next: "n3",
          effects: { energy: -5, knowledge: 1 },
          reply: [
            { from: "them", text: "当然だと思います" },
            { from: "them", text: "ご家族はみなさん、そうおっしゃいます" },
          ],
        },
        {
          label: "兄と父と相談してから、お返事します",
          next: "n3",
          effects: { bondSibling: 2, knowledge: 1 },
          reply: [{ from: "them", text: "そうしてください。急がなくて大丈夫です" }],
        },
      ],
    },

    n3: {
      id: "n3",
      messages: [
        { from: "system", text: "── 病室から ──" },
        { from: "them", text: "ごめんね、来てもらって" },
        { from: "them", text: "ここ、どこだったかしら" },
        { from: "them", text: "……ああ、病院ね。そうよね" },
      ],
      choices: [
        {
          label: "うん、病院。すぐ良くなるよ",
          next: "n4",
          effects: { bondMother: 3 },
          reply: [
            { from: "them", text: "そう" },
            { from: "them", text: "あなたが来てくれたなら、大丈夫ね" },
          ],
        },
        {
          label: "家に帰りたい？",
          next: "n4",
          effects: { bondMother: 4, knowledge: 1 },
          reply: [
            { from: "them", text: "帰りたいわねえ" },
            { from: "them", text: "でも、迷惑かけちゃうから" },
          ],
        },
        {
          label: "早く元気になってよ",
          next: "n4",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "はいはい" },
            { from: "them", text: "……あなたも、ちゃんと寝てるの" },
          ],
        },
      ],
    },

    n4: {
      id: "n4",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "先生から言われた件" },
        { from: "them", text: "胃ろうにすれば栄養は入る。けど、たぶん家には帰れなくなる" },
        { from: "them", text: "しなければ、食べられるぶんだけになる" },
        { from: "them", text: "……どうする" },
      ],
      choices: [
        {
          // 母の言葉を持っている人だけが、迷わずここに立てる。
          label: "母さんは「管だらけは嫌」って言ってた。その通りにしよう",
          next: "n5",
          effects: { bondSibling: 4, bondMother: 3, knowledge: 2 },
          requires: { flags: ["talked-care"] },
          flags: ["chose-wishes"],
          reply: [
            { from: "them", text: "……聞いておいてくれて、助かった" },
            { from: "them", text: "俺たちが決めたことにしなくて済む" },
          ],
        },
        {
          label: "二人で決めよう。どっちを選んでも、後悔はすると思う",
          next: "n5",
          effects: { energy: -4, bondSibling: 4 },
          flags: ["chose-together"],
          reply: [
            { from: "them", text: "……だな" },
            { from: "them", text: "じゃあ、二人で背負おう" },
          ],
        },
        {
          label: "できることは全部やってほしい",
          next: "n5",
          effects: { energy: -6, money: -8 },
          flags: ["chose-treat"],
          reply: [
            { from: "them", text: "わかった" },
            { from: "them", text: "……それで母さんが苦しかったら、って考えちまうけどな" },
          ],
        },
        {
          label: "決められない。先生に任せよう",
          next: "n5",
          effects: { energy: -8, bondSibling: -2 },
          flags: ["chose-doctor"],
          reply: [
            { from: "them", text: "……そうするか" },
            { from: "them", text: "でも、それも俺たちが選んだことになるんだよな" },
          ],
        },
      ],
    },

    n5: {
      id: "n5",
      speaker: FATHER,
      messages: [
        { from: "system", text: "── 父から ──" },
        { from: "them", text: "話は聞いた" },
        { from: "them", text: "わしは、母さんの思うようにしてやりたい" },
        { from: "them", text: "……でも正直、まだ諦めきれん" },
        { from: "them", text: "お前たちが決めたなら、それでいい" },
      ],
      choices: [
        {
          label: "……お父さんは、どうしたい？",
          next: "n6",
          effects: { bondMother: 4, knowledge: 2 },
          reply: [
            { from: "them", text: "……長いこと、聞かれなかったな、そういうことは" },
            { from: "them", text: "そばにいてやりたい。それだけだ" },
          ],
        },
        {
          label: "一緒に決めよう。お父さんも当事者だよ",
          next: "n6",
          effects: { bondMother: 3, bondSibling: 2 },
          reply: [
            { from: "them", text: "……そうか" },
            { from: "them", text: "そうだな。わしも、行く" },
          ],
        },
        {
          label: "わかった。責任は私が持つから",
          next: "n6",
          effects: { energy: -8, bondMother: 2 },
          reply: [
            { from: "them", text: "すまん" },
            { from: "them", text: "……お前にばかり、負わせてるな" },
          ],
        },
      ],
    },

    n6: {
      id: "n6",
      messages: [
        { from: "system", text: "── それから、三週間後 ──" },
        { from: "system", text: "熱が下がらなくなった。" },
        { from: "system", text: "病室に、父と兄と、あなたがそろった。" },
        { from: "them", text: "……あら" },
        { from: "them", text: "みんな、いるのね" },
      ],
      choices: [
        {
          label: "うん。みんないるよ",
          next: "end",
          effects: { bondMother: 5 },
          reply: [
            { from: "them", text: "よかった" },
            { from: "system", text: "母は、それきり静かになった。" },
          ],
        },
        {
          label: "ここにいるよ。ずっといるから",
          next: "end",
          effects: { bondMother: 4, energy: -3 },
          reply: [
            { from: "them", text: "……うん" },
            { from: "system", text: "手を握ると、握り返す力があった。" },
          ],
        },
        {
          label: "ありがとう、お母さん",
          next: "end",
          effects: { bondMother: 5, energy: -3 },
          reply: [
            { from: "them", text: "なあに、あらたまって" },
            { from: "system", text: "それが、母と交わした最後の会話になった。" },
          ],
        },
      ],
    },

    end: {
      id: "end",
      end: true,
      messages: [],
    },
  },

  // 何を選んだかではなく、どう決めたかで分かれる。
  // どれを選んでも後悔は残るが、母の言葉を持っていた人だけは
  // 「自分が決めた」という重さを負わずに済む。
  endings: [
    {
      id: "as-wished",
      title: "その通りにした",
      condition: { flags: ["chose-wishes"] },
      messages: [
        { from: "system", text: "胃ろうはつくらなかった。母が、そう言っていたから。" },
        { from: "system", text: "最後の一週間、母は好きなものを少しずつ口にした。" },
        { from: "system", text: "アイスクリームを、ひとさじ。" },
        { from: "system", text: "「おいしい」と言った。それが、はっきり聞き取れた最後の言葉だった。" },
      ],
      note: "選んだのは家族だが、決めたのは母だった。この違いは、あとから効いてくる。聞いておいた数十分が、決めたあとの何年かを支える。",
    },
    {
      id: "together",
      title: "二人で決めた",
      condition: { flags: ["chose-together"] },
      messages: [
        { from: "system", text: "何度も話して、決めた。" },
        { from: "system", text: "正しかったかどうかは、いまも分からない。" },
        { from: "system", text: "ただ、兄と二人で決めたということだけは覚えている。" },
        { from: "them", text: "……ありがとう" },
      ],
      note: "後悔は残った。それでも、ひとりで抱える後悔とは重さが違う。決断そのものより、誰と決めたかが残る。",
    },
    {
      id: "everything",
      title: "できることは全部やった",
      condition: { flags: ["chose-treat"] },
      messages: [
        { from: "system", text: "できる処置はすべて行った。母は、二か月長く生きた。" },
        { from: "system", text: "その二か月のことを、うまく思い出せない。" },
        { from: "system", text: "管の本数だけは、正確に覚えている。" },
      ],
      note: "手を尽くしたことは間違っていない。ただ、本人がそれを望んだかどうかは、もう確かめようがない。",
    },
    {
      id: "in-the-dark",
      title: "誰も、本人の望みを知らなかった",
      condition: { flags: ["chose-doctor"], notFlags: ["talked-care"] },
      messages: [
        { from: "system", text: "医師の判断にゆだねた。標準的な、適切な治療が行われた。" },
        { from: "system", text: "何度も聞かれた。「ご本人はどうお考えでしたか」と。" },
        { from: "system", text: "そのたびに、分かりません、と答えた。" },
      ],
      note: "医療者は決めてくれない。決めるのは必ず家族で、その拠りどころになるのは本人の言葉しかない。聞かないという選択も、決断のひとつだったことになる。",
    },
    {
      id: "entrusted",
      title: "聞いてはいたが、決めきれなかった",
      messages: [
        { from: "system", text: "母の言葉は覚えていた。それでも、口に出せなかった。" },
        { from: "system", text: "医師の判断にゆだねた。" },
        { from: "system", text: "メモは、開いたまま閉じた。" },
      ],
      note: "聞けていることと、その通りにできることは別だった。それでも、拠りどころがあったこと自体は残る。",
    },
  ],
};
