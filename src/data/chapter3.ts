import type { Chapter, Speaker } from "../types";

// 第3章「決断編」
// 診断がついたあとの数か月。要介護認定、ケアマネジャー、デイサービス、そしてお金。
// 「気づくかどうか」だった前章までと違い、この章は「決める」章になる。
// 在宅か施設かは数字に写しにくいので、選択肢に flags を立てて覚えさせ、
// エンディングの条件から参照している。
//
// 書き方の約束は chapter1.ts の冒頭を参照。
// 選んだ内容に噛み合う返事は choice.reply に置き、ノード本文は
// どの選択肢のあとに読んでも成立する内容だけにする。

const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };
const CARE_MANAGER: Speaker = { name: "三浦さん（ケアマネ）", avatar: "📋", tone: "care" };

export const chapter3: Chapter = {
  id: "chapter3",
  title: "第3章",
  subtitle: "決断編 ── どれも、正解ではない",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextChapterId: "chapter4",

  // 第2章がどう終わったかで書き出しを変える。
  // 条件は第2章のエンディング判定と同じ式にしてあるので、結末と入りが食い違わない。
  prologue: [
    {
      // 「向き合いはじめた夜」で終えた人
      condition: { min: { knowledge: 8, bondSibling: 53 } },
      messages: [
        { from: "system", text: "── 第2章から、2か月後 ──" },
        { from: "system", text: "三人で話した週末のあと、兄が物忘れ外来の予約を取った。" },
        { from: "system", text: "母は「大げさね」と言いながら、素直に付いてきた。" },
      ],
    },
    {
      // 「あなただけが頼りよ」で終えた人
      condition: { min: { bondMother: 58 } },
      messages: [
        { from: "system", text: "── 第2章から、2か月後 ──" },
        { from: "system", text: "あなたが調べ、あなたが予約を取り、あなたが母を連れて行った。" },
        { from: "system", text: "兄には、行ったあとで報告した。" },
      ],
    },
    {
      // 「見ないふりをした夜」で終えた人
      messages: [
        { from: "system", text: "── 第2章から、2か月後 ──" },
        { from: "system", text: "母が家の鍵をなくし、交番から連絡が来た。" },
        { from: "system", text: "きっかけは、こちらから作ったものではなかった。" },
      ],
    },
  ],

  nodes: {
    n1: {
      id: "n1",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "診断、出たな" },
        { from: "them", text: "アルツハイマー型認知症。まだ軽度だって" },
        { from: "them", text: "薬は出たけど、進行を遅らせるだけらしい" },
        { from: "them", text: "で、これからどうする" },
      ],
      choices: [
        {
          label: "二人で市役所に行こう。まず話を聞いてくる",
          next: "n2",
          effects: { energy: -4, bondSibling: 4, knowledge: 2 },
          reply: [{ from: "them", text: "わかった。俺、半休取る" }],
        },
        {
          label: "私が動くよ。お兄ちゃんは仕事してて",
          next: "n2",
          effects: { energy: -12, bondSibling: -1, bondMother: 2 },
          reply: [
            { from: "them", text: "悪いな" },
            { from: "them", text: "……ほんと、悪い" },
          ],
        },
        {
          label: "まだ軽度なんでしょ。急がなくていいよ",
          next: "n2",
          effects: { knowledge: -1, bondSibling: -2 },
          reply: [
            { from: "them", text: "……そうだな" },
            { from: "them", text: "でも申請だけは出しとく。認定が下りるのに一か月かかるらしいから" },
          ],
        },
        {
          // 第1章から知識を積んできた人にだけ開く。制度を先に動かす一手。
          label: "要介護認定の申請、先に出そう。認定が下りるまで一か月かかるから",
          next: "n2",
          effects: { energy: -3, bondSibling: 3, knowledge: 3 },
          requires: { min: { knowledge: 7 } },
          reply: [
            { from: "them", text: "……詳しいな" },
            { from: "them", text: "そうしよう。書類、俺が取ってくる" },
          ],
        },
      ],
    },

    n2: {
      id: "n2",
      speaker: CARE_MANAGER,
      messages: [
        { from: "system", text: "── 一か月後 ──" },
        { from: "system", text: "要介護2の認定が下りた。担当のケアマネジャーから、はじめての連絡が来る。" },
        { from: "them", text: "はじめまして。担当させていただく、ケアマネジャーの三浦です" },
        { from: "them", text: "ケアプランのご相談で、一度お時間をいただけますか" },
        { from: "them", text: "お母様には、デイサービスを週2回から、とお話ししています" },
        { from: "them", text: "ただ、ご本人は「まだ必要ない」と" },
      ],
      choices: [
        {
          label: "費用は、どのくらいかかりますか",
          next: "n3",
          effects: { knowledge: 3 },
          reply: [
            { from: "them", text: "1割負担で、週2回なら月に8千円ほどです" },
            { from: "them", text: "送迎とお昼、お風呂も含まれます" },
          ],
        },
        {
          label: "本人が嫌がるなら、少し待ちます",
          next: "n3",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "わかりました。無理に始めても、続かないことが多いので" },
            { from: "them", text: "気が向いたら、いつでも言ってください" },
          ],
        },
        {
          label: "週2回でお願いします。私から説得します",
          next: "n3",
          effects: { energy: -6, bondMother: -2, knowledge: 1 },
          reply: [{ from: "them", text: "では、そのように進めますね" }],
        },
      ],
    },

    n3: {
      id: "n3",
      messages: [
        { from: "system", text: "── 母とのトーク ──" },
        { from: "them", text: "デイサービスなんて行かないわよ" },
        { from: "them", text: "あんな、年寄りばっかりのところ" },
        { from: "them", text: "私はまだ、自分のことは自分でできます" },
      ],
      choices: [
        {
          label: "じゃあ見学だけ行ってみない？私も一緒に行くから",
          next: "n4",
          effects: { money: -6, energy: -5, bondMother: 4 },
          reply: [{ from: "them", text: "……見学だけよ" }],
        },
        {
          label: "お願い。私が心配なの",
          next: "n4",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "心配って、何が" },
            { from: "them", text: "……わかったわよ。少しだけね" },
          ],
        },
        {
          label: "もう決まったことだから",
          next: "n4",
          effects: { bondMother: -5 },
          reply: [
            { from: "them", text: "……そう" },
            { from: "them", text: "私の話は、聞いてくれないのね" },
          ],
        },
        {
          // ケアマネジャーから中身を聞き出せていた人だけが言える説得。
          label: "体操とお風呂があるって。腰、楽になるかもよ",
          next: "n4",
          effects: { bondMother: 3, knowledge: 1 },
          requires: { min: { knowledge: 12 } },
          reply: [
            { from: "them", text: "お風呂……" },
            { from: "them", text: "一人で入るの、最近ちょっとこわいのよね" },
            { from: "them", text: "……見るだけ、見てみようかしら" },
          ],
        },
      ],
    },

    n4: {
      id: "n4",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "金の話、しとかないとな" },
        { from: "them", text: "母さんの年金は月12万。デイと薬で、月に3万は出ていく" },
        { from: "them", text: "施設だと、安いところでも月15万だ" },
        { from: "them", text: "足りない分は、俺たちが出すことになる" },
      ],
      choices: [
        {
          label: "折半にしよう。それが一番もめないと思う",
          next: "n5",
          effects: { money: -10, bondSibling: 3 },
          reply: [{ from: "them", text: "……そうだな。そうしよう" }],
        },
        {
          label: "お金のことは、まだ考えたくない",
          next: "n5",
          effects: { knowledge: -1, bondSibling: -3 },
          reply: [
            { from: "them", text: "……考えないと、選べないんだよ" },
            { from: "them", text: "選ばないでいると、選べなくなる" },
          ],
        },
        {
          // 制度を知っている人だけが持ち出せる話。向き合うほど出費が増える構造に、
          // 知識で抜け道を作っておく（調べた人が金銭的に追い詰められて終わらないように）。
          label: "高額介護サービス費、申請してる？上限を超えた分は戻ってくるって",
          next: "n5",
          effects: { money: 6, bondSibling: 2, knowledge: 3 },
          requires: { min: { knowledge: 14 } },
          reply: [
            { from: "them", text: "なんだそれ。知らないぞ" },
            { from: "them", text: "……調べてみる。戻ってくるなら大きいな" },
          ],
        },
        {
          // 出せる余裕がある人にだけ開く。お金で時間を買う選択。
          label: "私が多めに出す。お兄ちゃんは近くにいる分、通ってもらう",
          next: "n5",
          effects: { money: -16, energy: -3, bondSibling: 2 },
          requires: { min: { money: 30 } },
          reply: [
            { from: "them", text: "いいのか" },
            { from: "them", text: "……助かる。その代わり、平日は俺が行く" },
          ],
        },
      ],
    },

    n5: {
      id: "n5",
      messages: [
        { from: "system", text: "── ある日の夜 ──" },
        { from: "system", text: "母から、めずらしく長い文章が届いた。" },
        { from: "them", text: "ねえ、聞いて。今日は頭がはっきりしてるから、書いておくね" },
        { from: "them", text: "私がわからなくなったら、施設でもどこでも入れていいからね" },
        { from: "them", text: "あなたたちの生活を、壊さないでちょうだい" },
        { from: "them", text: "それだけ、お願い" },
      ],
      choices: [
        {
          label: "そんなこと言わないでよ",
          next: "n6",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "ごめんね" },
            { from: "them", text: "でも、言えるうちに言っておきたかったの" },
          ],
        },
        {
          label: "わかった。ちゃんと考える。お兄ちゃんとも話す",
          next: "n6",
          effects: { bondMother: 3, bondSibling: 1, knowledge: 2 },
          reply: [{ from: "them", text: "うん。二人で決めてちょうだい" }],
        },
        {
          label: "……うん",
          next: "n6",
          effects: { energy: -2, bondMother: 1 },
          reply: [{ from: "system", text: "それ以上、何も打てなかった。" }],
        },
      ],
    },

    n6: {
      id: "n6",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "そろそろ決めないとな" },
        { from: "them", text: "在宅で続けるか、施設を探し始めるか" },
        { from: "them", text: "どっちを選んでも、正解じゃない気がする" },
      ],
      choices: [
        {
          label: "在宅で続けよう。限界が来たら、そのとき決める",
          next: "end",
          effects: { energy: -8, bondMother: 3 },
          flags: ["decide-home"],
          reply: [{ from: "them", text: "わかった。俺も週末は行く" }],
        },
        {
          label: "施設を探し始めよう。母さんも、そう言ってた",
          next: "end",
          effects: { money: -5, knowledge: 3 },
          flags: ["decide-facility"],
          reply: [
            { from: "them", text: "……見学の予約、取るか" },
            { from: "them", text: "見るだけだ。まだ決めたわけじゃない" },
          ],
        },
        {
          label: "まだ決められない",
          next: "end",
          effects: { energy: -4 },
          reply: [
            { from: "them", text: "……だよな" },
            { from: "them", text: "もう少しだけ、考えよう" },
          ],
        },
        {
          // 三章ぶん知識を積んだ人にだけ見える第三の道。
          // 家で見るか施設に入れるかの二択を、崩すための選択肢。
          label: "小規模多機能に相談してみよう。通いも泊まりも、同じ事業所で見てもらえる",
          next: "end",
          effects: { energy: 4, bondSibling: 2, knowledge: 3 },
          requires: { min: { knowledge: 13 } },
          flags: ["decide-home", "know-shoukibo"],
          reply: [
            { from: "them", text: "……そんな選び方があるのか" },
            { from: "them", text: "三浦さんに聞いてみよう" },
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

  // 上から順に判定するので、条件の細かいものから並べる。
  // どの選択肢のあとに読んでも成立するよう、結びは決めたあとの日々から書く。
  endings: [
    {
      id: "shoukibo",
      title: "通いと泊まりの、あいだ",
      condition: { flags: ["decide-home", "know-shoukibo"] },
      messages: [
        { from: "system", text: "母は週に3日通い、月に何度か泊まるようになった。" },
        { from: "system", text: "同じ人たちが、通いのときも泊まりのときも母を見てくれる。" },
        { from: "them", text: "あそこの人たち、私の名前を覚えてくれてるのよ" },
        { from: "system", text: "その日、兄からのメッセージは「今週は俺が行くわ」だけだった。" },
      ],
      note: "家で見るか、施設に入れるか。その二択のほかにも道はあった。調べた人にだけ見える道だった、ということでもある。",
    },
    {
      id: "burnout",
      title: "倒れる前に",
      condition: { flags: ["decide-home"], max: { energy: 28 } },
      messages: [
        { from: "system", text: "在宅を続けると決めた。" },
        { from: "system", text: "週末ごとに実家へ通い、平日は電話をかけ、夜中の呼び出しに起きた。" },
        { from: "them", text: "あなた、顔色が悪いわよ" },
        { from: "system", text: "母にそう言われて、鏡を見たのは久しぶりだった。" },
      ],
      note: "決断そのものは間違っていない。ただ、続けられるかどうかは別の問題として残っている。次に倒れるのが母とはかぎらない。",
    },
    {
      id: "home",
      title: "家で、もう少しだけ",
      condition: { flags: ["decide-home"] },
      messages: [
        { from: "system", text: "在宅を続けると決めた。" },
        { from: "system", text: "デイサービスの日は、母から必ず報告が来る。" },
        { from: "them", text: "今日は折り紙をしたの。鶴、まだ折れたわ" },
        { from: "them", text: "こんど見せてあげる" },
      ],
      note: "限界が来たら、そのとき決める。先送りに見えて、いまはこれが選べる最善だった。",
    },
    {
      id: "facility",
      title: "順番を待つ列に並ぶ",
      condition: { flags: ["decide-facility"] },
      messages: [
        { from: "system", text: "施設をいくつか見学し、申し込みを出した。" },
        { from: "system", text: "特別養護老人ホームは、順番待ちが2年だと言われた。" },
        { from: "them", text: "見学、思ってたより明るいところだったわね" },
        { from: "them", text: "でも、まだ入らないからね" },
      ],
      note: "決めたのは「入れる」ことではなく、「列に並ぶ」ことだった。決断には、待っているあいだの時間も含まれている。",
    },
    {
      id: "postpone",
      title: "決めない、という決め方",
      messages: [
        { from: "system", text: "結論は出ないまま、季節がひとつ過ぎた。" },
        { from: "system", text: "母はデイサービスに行ったり、行かなかったりしている。" },
        { from: "them", text: "あなたたち、なにか決めた？" },
        { from: "system", text: "その問いに、まだ答えられていない。" },
      ],
      note: "決めないことも、ひとつの選択として時間を使っていく。次の決断は、たいてい前より条件が悪くなってからやってくる。",
    },
  ],
};
