import type { Chapter, Speaker } from "../types";

// 第4章「介護編」
// 決めたあとの半年。ここからは「決断」ではなく「続けること」の話になる。
// 折り紙の鶴や昔の歌のような、なんでもない明るさを必ず挟む。
// 介護は暗い一色ではなく、重さと軽さが同じ日に来るものなので。
//
// この章で初めて、気力とお金が物語に効く。尽きていれば、そこで終わる。
// n3 には「気力が落ちているときにしか浮かばない選択肢」を置いた
// （追い詰められて初めて、助けを求める言葉が出てくる）。
//
// 書き方の約束は chapter1.ts の冒頭を参照。

const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };
const CARE_MANAGER: Speaker = { name: "三浦さん（ケアマネ）", avatar: "📋", tone: "care" };
const HELPER: Speaker = { name: "山本さん（ヘルパー）", avatar: "🧹", tone: "care" };

export const chapter4: Chapter = {
  id: "chapter4",
  title: "第4章",
  subtitle: "介護編 ── 続けるということ",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextChapterId: "chapter5",

  // 第3章でどう決めたかで書き出しが変わる。条件の細かいものから並べる。
  prologue: [
    {
      condition: { flags: ["decide-home", "know-shoukibo"] },
      messages: [
        { from: "system", text: "── 第3章から、半年後 ──" },
        { from: "system", text: "母は週に3日通い、月に何度か泊まっている。" },
        { from: "system", text: "同じ事業所が全部を見てくれるので、説明を繰り返さずに済んでいる。" },
      ],
    },
    {
      condition: { flags: ["decide-facility"] },
      messages: [
        { from: "system", text: "── 第3章から、半年後 ──" },
        { from: "system", text: "特別養護老人ホームの順番は、まだ回ってこない。" },
        { from: "system", text: "待っているあいだの暮らしを、どうにか回している。" },
      ],
    },
    {
      condition: { flags: ["decide-home"] },
      messages: [
        { from: "system", text: "── 第3章から、半年後 ──" },
        { from: "system", text: "在宅を続けている。デイサービスが週3回、訪問介護が週2回。" },
        { from: "system", text: "母の一日は、以前よりずっと人の手が入っている。" },
      ],
    },
    {
      messages: [
        { from: "system", text: "── 第3章から、半年後 ──" },
        { from: "system", text: "在宅か施設かは、結局決めないままになっている。" },
        { from: "system", text: "決めないでいるあいだも、母の生活は毎日続いていた。" },
      ],
    },
  ],

  nodes: {
    n1: {
      id: "n1",
      messages: [
        { from: "them", text: "今日ね、デイで折り紙をしたの" },
        { from: "them", text: "鶴、まだ折れたわ" },
        { from: "system", text: "少し歪んだ鶴の写真が、続けて届いた。" },
      ],
      choices: [
        {
          label: "上手だね。今度もらいに行く",
          next: "n2",
          effects: { bondMother: 3 },
          reply: [
            { from: "them", text: "ほんと？じゃあ取っておくわね" },
            { from: "them", text: "たくさん折っておく" },
          ],
        },
        {
          label: "すごい。私、たぶん折れないよ",
          next: "n2",
          effects: { energy: 2, bondMother: 2 },
          reply: [{ from: "them", text: "教えてあげる。簡単よ" }],
        },
        {
          label: "（写真を見て、既読だけつけた）",
          next: "n2",
          effects: { energy: 1, bondMother: -2 },
          reply: [{ from: "system", text: "しばらくして、「忙しいのね」と一行だけ届いた。" }],
        },
      ],
    },

    n2: {
      id: "n2",
      speaker: HELPER,
      messages: [
        { from: "system", text: "── 訪問介護の山本さんから ──" },
        { from: "them", text: "お世話になっております、ヘルパーの山本です" },
        { from: "them", text: "今日うかがったら、冷蔵庫に同じ牛乳が5本入っていました" },
        { from: "them", text: "あと、お薬が火曜から手つかずでした" },
      ],
      choices: [
        {
          label: "お薬カレンダー、買って持っていきます",
          next: "n3",
          effects: { money: -3, knowledge: 3 },
          reply: [
            { from: "them", text: "助かります。曜日ごとに分かれているものがいいですよ" },
            { from: "them", text: "こちらでも、うかがったときに確認します" },
          ],
        },
        {
          label: "教えてくださってありがとうございます。買い物は私が行きます",
          next: "n3",
          effects: { money: -5, energy: -8, bondMother: 2 },
          reply: [
            { from: "them", text: "ご無理のない範囲でお願いしますね" },
            { from: "them", text: "ご家族が倒れてしまうのが、いちばん困りますので" },
          ],
        },
        {
          label: "そうですか……。すみません",
          next: "n3",
          effects: { bondMother: -1 },
          reply: [{ from: "them", text: "いえ。また変わったことがあれば、お伝えします" }],
        },
        {
          // 制度で解けると知っている人だけの一手。人ではなく仕組みを動かす。
          label: "服薬の支援、ケアプランに入れてもらえますか",
          next: "n3",
          effects: { energy: 4, knowledge: 3 },
          requires: { min: { knowledge: 15 } },
          reply: [
            { from: "them", text: "できますよ。三浦さんに私からお伝えしておきます" },
            { from: "them", text: "訪問のたびに、目の前で飲んでいただく形にしましょう" },
          ],
        },
      ],
    },

    n3: {
      id: "n3",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "先週、母さんのとこ行けなかった。仕事が立て込んでて" },
        { from: "them", text: "悪い" },
        { from: "them", text: "来月は行く。たぶん" },
      ],
      choices: [
        {
          label: "わかった。無理しないで",
          next: "n4",
          effects: { energy: -6, bondSibling: 2 },
          reply: [{ from: "them", text: "ありがとな。助かる" }],
        },
        {
          label: "「たぶん」じゃなくて、日にちを決めて",
          next: "n4",
          effects: { bondSibling: 1, knowledge: 1 },
          reply: [
            { from: "them", text: "……わかった" },
            { from: "them", text: "第2土曜。カレンダーに入れる" },
          ],
        },
        {
          label: "もういい。私がやるから",
          next: "n4",
          effects: { energy: -10, bondSibling: -5 },
          reply: [
            { from: "them", text: "……そういう言い方するなよ" },
            { from: "them", text: "俺だって、なんとかしようとは思ってる" },
          ],
        },
        {
          // 気力が落ちているときにしか出てこない言葉。
          // かつ、弱音は言える相手にしか吐けない。追い詰められているだけでは足りず、
          // ここまでに兄との関係を作れているかが要る。
          label: "正直に言う。私、もう限界かもしれない",
          next: "n4",
          effects: { energy: 6, bondSibling: 5, knowledge: 2 },
          requires: { max: { energy: 30 }, min: { bondSibling: 52 } },
          reply: [
            { from: "them", text: "……そうか" },
            { from: "them", text: "ごめん。気づかなかった" },
            { from: "them", text: "今週末、俺が泊まりで行く。おまえは休め" },
          ],
        },
      ],
    },

    n4: {
      id: "n4",
      messages: [
        { from: "system", text: "── ある日の昼 ──" },
        { from: "them", text: "すみません、どちらさまですか" },
        { from: "system", text: "何度読み返しても、そう書いてあった。" },
        { from: "them", text: "あ、ごめんなさい。わかってるわよ" },
        { from: "them", text: "ちょっと、ぼうっとしてただけ" },
      ],
      choices: [
        {
          label: "うん、大丈夫",
          next: "n5",
          effects: { energy: -4, bondMother: 1 },
          reply: [{ from: "system", text: "大丈夫、と打ちながら、指が止まった。" }],
        },
        {
          label: "私だよ。娘だよ",
          next: "n5",
          effects: { energy: -6, bondMother: 2 },
          reply: [
            { from: "them", text: "そうよ、わかってる" },
            { from: "them", text: "やあね、もう" },
          ],
        },
        {
          label: "……ちょっと、電話していい？",
          next: "n5",
          effects: { energy: -3, bondMother: 3 },
          reply: [
            { from: "system", text: "母は普通に出た。声はいつもどおりだった。" },
            { from: "system", text: "10分ほど話して、切った。" },
          ],
        },
      ],
    },

    n5: {
      id: "n5",
      speaker: CARE_MANAGER,
      messages: [
        { from: "system", text: "── 三浦さんから ──" },
        { from: "them", text: "その後、いかがですか" },
        { from: "them", text: "ショートステイ、一度使ってみませんか" },
        { from: "them", text: "何泊かお預かりできます" },
        { from: "them", text: "ご本人のためだけでなく、ご家族が休むための制度でもあるので" },
      ],
      choices: [
        {
          label: "お願いします。少し、休みたいです",
          next: "n6",
          effects: { money: -8, energy: 14, knowledge: 2 },
          reply: [
            { from: "them", text: "はい。それでいいんですよ" },
            { from: "them", text: "続けるために休む、というのは立派な介護です" },
          ],
        },
        {
          label: "母が嫌がると思うので、やめておきます",
          next: "n6",
          effects: { energy: -4, bondMother: 1 },
          reply: [
            { from: "them", text: "わかりました" },
            { from: "them", text: "気が変わったら、いつでも言ってくださいね" },
          ],
        },
        {
          label: "そんな、預けるなんて",
          next: "n6",
          effects: { energy: -6, knowledge: -1 },
          reply: [
            { from: "them", text: "預ける、という言葉で考えなくて大丈夫ですよ" },
            { from: "them", text: "……ただ、無理をされる方ほど、あとで大きく崩れます" },
          ],
        },
      ],
    },

    n6: {
      id: "n6",
      messages: [
        { from: "system", text: "── 季節がひとつ過ぎた ──" },
        { from: "them", text: "あのね、今日は調子がいいの" },
        { from: "them", text: "昔の歌、まだ全部歌えたのよ" },
        { from: "them", text: "あなたが小さいころ、よく歌ったでしょう" },
      ],
      choices: [
        {
          label: "覚えてるよ。よく歌ってくれたね",
          next: "end",
          effects: { bondMother: 4 },
          reply: [
            { from: "them", text: "そう。覚えててくれたの" },
            { from: "them", text: "よかった" },
          ],
        },
        {
          label: "今度、一緒に歌おうか",
          next: "end",
          effects: { energy: 2, bondMother: 3 },
          reply: [{ from: "them", text: "いいわね。デイの人たちにも聞かせてあげる" }],
        },
        {
          label: "……どの歌だっけ",
          next: "end",
          effects: { bondMother: 1, knowledge: 1 },
          reply: [
            { from: "them", text: "やあねえ、忘れちゃったの" },
            { from: "system", text: "母が笑った。その言葉を、母が言った。" },
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

  // 続いているかどうかは、決断ではなく積み重ねで決まる。
  // 尽きていれば、そこで終わる。条件の細かいものから並べる。
  endings: [
    {
      id: "collapse",
      title: "先に倒れる",
      condition: { max: { energy: 14 } },
      messages: [
        { from: "system", text: "その週末、あなたは起き上がれなかった。" },
        { from: "system", text: "熱は出ていない。ただ、体が言うことを聞かなかった。" },
        { from: "system", text: "母のデイの迎えの時間に、誰も電話を取らなかった。" },
      ],
      note: "介護している側が倒れると、介護されている側の生活も同時に止まる。休むことは、続けるための手段だった。",
    },
    {
      id: "broke",
      title: "お金が続かない",
      condition: { max: { money: 8 } },
      messages: [
        { from: "system", text: "通帳を見て、来月の支払いを数えた。" },
        { from: "system", text: "デイの回数を減らす相談を、三浦さんにすることになった。" },
        { from: "them", text: "最近、行く日が減ったのね" },
        { from: "them", text: "……お金のこと、気にしなくていいのよ" },
      ],
      note: "使えるお金は、そのまま使える手の数になる。制度の負担軽減や高額介護サービス費のことを、もっと早く知る必要があった。",
    },
    {
      id: "team",
      title: "ひとりで抱えない形ができた",
      condition: { min: { knowledge: 20, bondSibling: 55 } },
      messages: [
        { from: "system", text: "母の一週間は、いろいろな人の手で埋まっている。" },
        { from: "system", text: "デイ、訪問介護、ショートステイ。第2土曜は兄が泊まる。" },
        { from: "them", text: "みんな、よくしてくれるのよ" },
        { from: "system", text: "あなたの一週間にも、まだ自分の時間が残っている。" },
      ],
      note: "家族だけで抱えないという形が、ようやく回りはじめた。この先も母は変わっていくが、受け止める手はもう一人ぶんではない。",
    },
    {
      id: "steady",
      title: "続いている、いまのところ",
      condition: { min: { bondMother: 60 } },
      messages: [
        { from: "system", text: "母は、いい日と、そうでない日を繰り返している。" },
        { from: "system", text: "折り紙の鶴が、実家の棚に少しずつ増えていく。" },
        { from: "them", text: "また来てね" },
        { from: "them", text: "急がなくていいから" },
      ],
      note: "うまくいっている、とは言えない。ただ、今日は続いている。介護の大半は、この「いまのところ」の積み重ねでできている。",
    },
    {
      id: "drift",
      title: "遠くなっていく",
      messages: [
        { from: "system", text: "連絡の間隔が、少しずつ空いていった。" },
        { from: "system", text: "母のことは、ヘルパーとケアマネジャーが教えてくれる。" },
        { from: "them", text: "……どちらさま、でしたっけ" },
        { from: "system", text: "今度は、訂正が来なかった。" },
      ],
      note: "手を離したわけではない。ただ、距離が開いたぶんだけ、母の変化に気づくのが遅れていく。",
    },
  ],
};
