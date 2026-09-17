import type { Chapter, Speaker } from "../types";

// 第5章「終活編」
// 介護の話が続いてきたが、この章で初めて終活そのものを扱う。
// 母が話せるうちに聞いておくこと ── お金の在りか、医療の希望、実家のこと。
//
// ここまで名前だけの存在だった父が、はじめて自分から連絡してくる。
// 黙っていたのではなく、言い出せなかった、という形にしている。
//
// 話せたかどうかは数字に写せないので、3つのフラグで覚える。
//   talked-money … 通帳と印鑑の在りかを聞けた（父）
//   talked-house … 実家をどうするか決めた（兄）
//   talked-care  … 医療の希望を本人から聞けた（母）
// エンディングは、そのうちどれを持ち帰れたかで分かれる。
//
// 書き方の約束は chapter1.ts の冒頭を参照。

const FATHER: Speaker = { name: "父", avatar: "👴", tone: "father" };
const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };
const CARE_MANAGER: Speaker = { name: "三浦さん（ケアマネ）", avatar: "📋", tone: "care" };

export const chapter5: Chapter = {
  id: "chapter5",
  title: "第5章",
  subtitle: "終活編 ── 話しておくべきこと",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextChapterId: "chapter6",

  // 第4章の結び方に合わせて書き出しを変える。
  // 条件は第4章のエンディング判定と同じ式・同じ順番にしてある。
  prologue: [
    {
      condition: { max: { energy: 14 } },
      messages: [
        { from: "system", text: "── 第4章から、半年後 ──" },
        { from: "system", text: "あなたが動けなくなった数週間は、兄と三浦さんが埋めた。" },
        { from: "system", text: "戻ってきてから、前ほど無理をしなくなった。" },
      ],
    },
    {
      condition: { max: { money: 8 } },
      messages: [
        { from: "system", text: "── 第4章から、半年後 ──" },
        { from: "system", text: "デイの回数を減らし、負担限度額の申請をして、どうにか回している。" },
        { from: "system", text: "お金の話から、もう目をそらせなくなった。" },
      ],
    },
    {
      condition: { min: { knowledge: 20, bondSibling: 55 } },
      messages: [
        { from: "system", text: "── 第4章から、半年後 ──" },
        { from: "system", text: "母の一週間は、いろいろな人の手で埋まっている。" },
        { from: "system", text: "回りはじめたからこそ、次に来るもののことを考える余裕ができた。" },
      ],
    },
    {
      condition: { min: { bondMother: 60 } },
      messages: [
        { from: "system", text: "── 第4章から、半年後 ──" },
        { from: "system", text: "母はいい日とそうでない日を繰り返しながら、まだ自分の言葉で話す。" },
        { from: "system", text: "話せる日は、少しずつ減っている。" },
      ],
    },
    {
      messages: [
        { from: "system", text: "── 第4章から、半年後 ──" },
        { from: "system", text: "母の様子は、ヘルパーとケアマネジャーから聞いている。" },
        { from: "system", text: "自分の目で見た記憶が、いつのものか思い出せない。" },
      ],
    },
  ],

  nodes: {
    n1: {
      id: "n1",
      messages: [
        { from: "them", text: "この前ね、テレビでやってたの" },
        { from: "them", text: "エンディングノート、っていうんですって" },
        { from: "them", text: "私も書いてみようかしら" },
        { from: "them", text: "でも、何を書けばいいのか、さっぱり" },
      ],
      choices: [
        {
          label: "一緒に書こうか。今度帰ったときに",
          next: "n2",
          effects: { energy: -4, bondMother: 4 },
          reply: [
            { from: "them", text: "ほんと？助かるわ" },
            { from: "them", text: "ひとりだと、ペンが止まっちゃうのよ" },
          ],
        },
        {
          label: "そういうのは、まだ早いよ",
          next: "n2",
          effects: { bondMother: -2 },
          reply: [
            { from: "them", text: "そう？" },
            { from: "them", text: "……早いうちじゃないと、書けないと思うんだけど" },
          ],
        },
        {
          label: "市役所でもらえる冊子があるらしいよ。取ってくる",
          next: "n2",
          effects: { knowledge: 3, bondMother: 2 },
          reply: [
            { from: "them", text: "あら、そんなものがあるの" },
            { from: "them", text: "じゃあ、それを見ながら書いてみる" },
          ],
        },
        {
          // 三章ぶん調べてきた人だけが、先に核心を置ける。
          label: "書くなら、お金のことと、医療の希望は先に入れてほしい",
          next: "n2",
          effects: { knowledge: 3, bondMother: 1 },
          requires: { min: { knowledge: 18 } },
          reply: [
            { from: "them", text: "……ずいぶん詳しいのね" },
            { from: "them", text: "わかった。そこから書く" },
          ],
        },
      ],
    },

    n2: {
      id: "n2",
      speaker: FATHER,
      messages: [
        { from: "system", text: "── 登録したままだった、父のアカウントから ──" },
        { from: "them", text: "テストです" },
        { from: "them", text: "母さんに教わって、やっと送れた" },
        { from: "them", text: "話しておきたいことがある" },
        { from: "them", text: "通帳と印鑑は、仏壇の一番下の引き出しだ" },
        { from: "them", text: "保険の証書も、同じところに入れておいた" },
      ],
      choices: [
        {
          label: "ありがとう。……お父さんも、無理しないでね",
          next: "n3",
          effects: { knowledge: 2, bondMother: 2 },
          flags: ["talked-money"],
          reply: [
            { from: "them", text: "わしは平気だ" },
            { from: "them", text: "母さんのことばかりで、すまんな" },
          ],
        },
        {
          label: "わかった。他にも聞いておきたいことがある",
          next: "n3",
          effects: { knowledge: 4 },
          flags: ["talked-money"],
          reply: [
            { from: "them", text: "そうか" },
            { from: "them", text: "聞かれるのを待っていた気がする" },
          ],
        },
        {
          label: "そんな話、まだしなくていいよ",
          next: "n3",
          effects: { bondMother: -1 },
          reply: [
            { from: "them", text: "……そうか" },
            { from: "system", text: "それきり、父からの連絡は途絶えた。" },
          ],
        },
      ],
    },

    n3: {
      id: "n3",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "親父からLINE来た？" },
        { from: "them", text: "たぶん、俺たちに気を遣わせないようにしてる" },
        { from: "them", text: "……で、言いにくいんだけどさ" },
        { from: "them", text: "実家、どうするかって話、しておかないか" },
      ],
      choices: [
        {
          label: "うん。もめたくないから、先に話そう",
          next: "n4",
          effects: { bondSibling: 4, knowledge: 2 },
          reply: [
            { from: "them", text: "助かる" },
            { from: "them", text: "正直、切り出すのが一番きつかった" },
          ],
        },
        {
          label: "住む人がいなくなったら売る、でいい？",
          next: "n4",
          effects: { bondSibling: 2, knowledge: 3 },
          flags: ["talked-house"],
          reply: [
            { from: "them", text: "俺もそう思ってた" },
            { from: "them", text: "決めておけば、あとで揉めずに済むな" },
          ],
        },
        {
          label: "そういう話は、まだ聞きたくない",
          next: "n4",
          effects: { bondSibling: -4 },
          reply: [
            { from: "them", text: "……わかった" },
            { from: "them", text: "でも、いつかは話すことになる" },
          ],
        },
        {
          // 調べた人だけが出せる、具体的な進め方。
          label: "父さんが元気なうちに、公正証書で遺言を残しておこう",
          next: "n4",
          effects: { bondSibling: 3, knowledge: 4 },
          requires: { min: { knowledge: 22 } },
          flags: ["talked-house"],
          reply: [
            { from: "them", text: "遺言って、そんな大げさな" },
            { from: "them", text: "……いや、そうか。もめないためにやるのか" },
          ],
        },
      ],
    },

    n4: {
      id: "n4",
      speaker: CARE_MANAGER,
      messages: [
        { from: "system", text: "── 三浦さんから ──" },
        { from: "them", text: "お母様のことで、一度ご相談させてください" },
        { from: "them", text: "もしもの時に、どこまでの医療を望まれるか" },
        { from: "them", text: "ご本人とご家族で話しておいていただけると、いざという時に迷わずに済みます" },
        { from: "them", text: "人生会議、と呼ばれているものです" },
      ],
      choices: [
        {
          label: "母に聞いてみます。まだ話せるうちに",
          next: "n5",
          effects: { energy: -3, knowledge: 3 },
          reply: [
            { from: "them", text: "ありがとうございます" },
            { from: "them", text: "一度で決めなくて大丈夫です。気が変わってもいいんです" },
          ],
        },
        {
          label: "そんなこと、本人に聞けません",
          next: "n5",
          effects: { energy: -5, knowledge: -1 },
          reply: [
            { from: "them", text: "……そうですよね" },
            { from: "them", text: "ただ、聞かないまま決める日が来ると、決めるのはご家族になります" },
          ],
        },
        {
          label: "兄とも相談してから決めます",
          next: "n5",
          effects: { bondSibling: 2, knowledge: 1 },
          reply: [{ from: "them", text: "はい。お二人で話されるのが一番です" }],
        },
      ],
    },

    n5: {
      id: "n5",
      messages: [
        { from: "system", text: "── 実家の居間で ──" },
        { from: "system", text: "母は今日、調子がいい。" },
        { from: "them", text: "なあに、改まって" },
        { from: "them", text: "……ああ、その話ね" },
        { from: "them", text: "いいわよ。聞いて" },
      ],
      choices: [
        {
          label: "もしものとき、どこまでの治療を望む？",
          next: "n6",
          effects: { bondMother: 3, knowledge: 3 },
          flags: ["talked-care"],
          reply: [
            { from: "them", text: "管だらけになってまで、とは思わないわ" },
            { from: "them", text: "でも、痛いのは嫌。それだけはお願い" },
          ],
        },
        {
          label: "痛いのは嫌？　それとも、できるだけ長く一緒にいたい？",
          next: "n6",
          effects: { bondMother: 4, knowledge: 2 },
          flags: ["talked-care"],
          reply: [
            { from: "them", text: "……上手な聞き方ね" },
            { from: "them", text: "痛くないほうがいい。長さは、もういいの" },
            { from: "them", text: "あなたたちが困らないように決めて" },
          ],
        },
        {
          label: "……やっぱり、今日はやめておこうか",
          next: "n6",
          effects: { bondMother: 1 },
          reply: [
            { from: "them", text: "そう？" },
            { from: "system", text: "母は少しだけ、ほっとしたように見えた。" },
          ],
        },
      ],
    },

    n6: {
      id: "n6",
      messages: [
        { from: "system", text: "── 押し入れの整理をしていたら ──" },
        { from: "them", text: "これ、あなたが小学生のときに描いた絵" },
        { from: "them", text: "捨てられなくてね" },
        { from: "them", text: "私がいなくなったら、好きにしていいからね" },
      ],
      choices: [
        {
          label: "もらっていく。うちに飾るよ",
          next: "end",
          effects: { bondMother: 4 },
          reply: [
            { from: "them", text: "あらやだ、下手なのに" },
            { from: "them", text: "……でも、うれしい" },
          ],
        },
        {
          label: "そんなこと言わないでよ",
          next: "end",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "はいはい" },
            { from: "them", text: "でも、言っておかないと忘れちゃうから" },
          ],
        },
        {
          label: "……うん。考えておく",
          next: "end",
          effects: { bondMother: 1, knowledge: 1 },
          reply: [{ from: "them", text: "そうしてちょうだい" }],
        },
      ],
    },

    end: {
      id: "end",
      end: true,
      messages: [],
    },
  },

  // 何を持ち帰れたかで分かれる。条件の細かいものから順に判定する。
  endings: [
    {
      id: "prepared",
      title: "話しておけたこと",
      condition: { flags: ["talked-money", "talked-house", "talked-care"] },
      messages: [
        { from: "system", text: "エンディングノートは、半分ほど埋まった。" },
        { from: "system", text: "お金の在りか。実家のこと。母自身の望み。" },
        { from: "them", text: "書いてみたら、案外すっきりしたわ" },
        { from: "them", text: "残りは、また今度ね" },
      ],
      note: "決めたのではなく、聞いておけた。この先どんな判断を迫られても、それは母の言葉に沿って決めたことになる。家族が背負う「決めた責任」が、少しだけ軽くなった。",
    },
    {
      id: "wishes",
      title: "本人の言葉が残った",
      condition: { flags: ["talked-care"] },
      messages: [
        { from: "system", text: "医療の希望だけは、母の言葉で聞いておけた。" },
        { from: "system", text: "書き留めて、兄にも送った。" },
        { from: "them", text: "ちゃんと覚えておいてね" },
        { from: "them", text: "忘れたころに、必要になるんだから" },
      ],
      note: "手続きのことは、まだ何も決まっていない。それでも、いちばん代わりに決めにくいことを本人から聞けたのは大きい。",
    },
    {
      id: "papers",
      title: "場所は分かっている",
      condition: { flags: ["talked-money"] },
      messages: [
        { from: "system", text: "仏壇の一番下の引き出し。通帳、印鑑、保険の証書。" },
        { from: "system", text: "場所は分かった。中身の話は、まだしていない。" },
        { from: "them", text: "お父さん、あれからまた黙っちゃって" },
        { from: "them", text: "あの人、話すのが下手なのよ" },
      ],
      note: "困らない程度の備えはできた。ただ、母がどうしたいかは、まだ誰も聞けていない。",
    },
    {
      id: "unspoken",
      title: "聞けないままの箱",
      messages: [
        { from: "system", text: "エンディングノートは、最初の数ページで止まっている。" },
        { from: "system", text: "押し入れの箱も、開けないままになった。" },
        { from: "them", text: "まあ、そのうちね" },
        { from: "system", text: "その「そのうち」が、あと何回あるかは誰にも分からない。" },
      ],
      note: "聞くのがつらいのは、聞かれる側より聞く側であることが多い。先延ばしのぶんだけ、決めるのは残された人になる。",
    },
  ],
};
