import type { Chapter, Speaker } from "../types";

// 第7章「相続編」
// 最終章。ここまでの選択が、手続きと、出てくる物になって返ってくる。
//
// 物語の山は葬儀でも遺品整理でもなく、n3 ──「母とのトークをもう一度開く」に置いた。
// 泣かせにかかる場面を作者が用意するより、このゲームの形式でしか書けない一点、
// 「既読がつかない」だけで足りると考えている。
// 悲しみは書かずに、操作の結果として置く。
//
// 最後に、同じ冊子が自分の名前を待っている場面で閉じる。
// 介護と終活は終わった話ではなく、次は自分の番だという形にするため。
//
// 書き方の約束は chapter1.ts の冒頭を参照。

const BROTHER: Speaker = { name: "兄", avatar: "👨", tone: "sibling" };
const FATHER: Speaker = { name: "父", avatar: "👴", tone: "father" };
// LINEの「自分だけのトーク」。相手のいない画面として、最後の場面に使う。
const SELF: Speaker = { name: "自分だけのトーク", avatar: "📝", tone: "self" };

export const chapter7: Chapter = {
  id: "chapter7",
  title: "第7章",
  subtitle: "相続編 ── 遺されたもの",
  npcName: "母",
  npcAvatar: "👵",
  startNode: "n1",
  nextTeaser: "ここまでが、この物語です",

  // 第6章でどう決めたかで書き出しが変わる。条件は第6章のエンディング判定と同じ。
  prologue: [
    {
      condition: { flags: ["chose-wishes"] },
      messages: [
        { from: "system", text: "── 四十九日が過ぎた ──" },
        { from: "system", text: "母の望んだとおりにできた、と思っている。" },
        { from: "system", text: "思っていても、いなくなったことは変わらなかった。" },
      ],
    },
    {
      condition: { flags: ["chose-together"] },
      messages: [
        { from: "system", text: "── 四十九日が過ぎた ──" },
        { from: "system", text: "あれでよかったのか、といまも思う。" },
        { from: "system", text: "同じことを、兄も思っているらしい。" },
      ],
    },
    {
      condition: { flags: ["chose-treat"] },
      messages: [
        { from: "system", text: "── 四十九日が過ぎた ──" },
        { from: "system", text: "できることは全部やった。そう自分に言い聞かせている。" },
        { from: "system", text: "言い聞かせる必要があるうちは、たぶんまだ終わっていない。" },
      ],
    },
    {
      condition: { flags: ["chose-doctor"], notFlags: ["talked-care"] },
      messages: [
        { from: "system", text: "── 四十九日が過ぎた ──" },
        { from: "system", text: "結局、母が何を望んでいたのかは分からずじまいだった。" },
        { from: "system", text: "もう、確かめる相手がいない。" },
      ],
    },
    {
      messages: [
        { from: "system", text: "── 四十九日が過ぎた ──" },
        { from: "system", text: "決めきれなかった時間のことを、ときどき思い出す。" },
        { from: "system", text: "それでも日々は、手続きでできている。" },
      ],
    },
  ],

  nodes: {
    n1: {
      id: "n1",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 兄とのトーク ──" },
        { from: "them", text: "役所、まだ終わってない" },
        { from: "them", text: "年金の停止は出した。健康保険も返した" },
        { from: "them", text: "ただ、口座が凍結されてて金が下ろせない" },
        { from: "them", text: "葬儀屋の支払いが来てるんだけど、どうする" },
      ],
      choices: [
        {
          // 調べてきた人だけが知っている制度。ここまでの知識がそのまま効く。
          label: "仮払い制度が使えるはず。葬儀費用なら、凍結中でも引き出せる",
          next: "n2",
          effects: { knowledge: 3, bondSibling: 3 },
          requires: { min: { knowledge: 30 } },
          reply: [
            { from: "them", text: "そんな制度があるのか" },
            { from: "them", text: "……お前、ほんとに詳しくなったな" },
          ],
        },
        {
          label: "手分けしよう。私が年金と保険をやる",
          next: "n2",
          effects: { energy: -8, bondSibling: 4 },
          reply: [
            { from: "them", text: "助かる" },
            { from: "them", text: "一人でやってると、終わりが見えなくてな" },
          ],
        },
        {
          label: "相続の期限だけ先に調べる。3か月と10か月のやつ",
          next: "n2",
          effects: { knowledge: 4, bondSibling: 2 },
          reply: [
            { from: "them", text: "期限があるのか、相続って" },
            { from: "them", text: "……知らないままだったら、まずかったな" },
          ],
        },
        {
          label: "ごめん、しばらく動けそうにない",
          next: "n2",
          effects: { energy: 4, bondSibling: -3 },
          reply: [
            { from: "them", text: "……わかった" },
            { from: "them", text: "無理すんな。こっちでやっとく" },
          ],
        },
      ],
    },

    n2: {
      id: "n2",
      speaker: FATHER,
      messages: [
        { from: "system", text: "── 父から ──" },
        { from: "them", text: "手続き、任せきりですまん" },
        { from: "them", text: "一人だと、飯がうまくない" },
        { from: "them", text: "母さんの茶碗、まだ片付けられん" },
      ],
      choices: [
        {
          label: "片付けなくていいよ。置いておけばいい",
          next: "n3",
          effects: { bondMother: 3 },
          reply: [
            { from: "them", text: "……そうか" },
            { from: "them", text: "そう言ってもらえると、助かる" },
          ],
        },
        {
          label: "今度の週末、ご飯作りに行くよ",
          next: "n3",
          effects: { money: -6, energy: -5, bondMother: 4 },
          reply: [
            { from: "them", text: "いいのか" },
            { from: "them", text: "……楽しみにしとく" },
          ],
        },
        {
          label: "お父さんも、ちゃんと食べてね",
          next: "n3",
          effects: { bondMother: 1 },
          reply: [{ from: "them", text: "ああ。気をつける" }],
        },
      ],
    },

    n3: {
      id: "n3",
      // 母から届いたのではなく、こちらから開く。通知の文言を差し替える。
      notice: "最後のやり取りが残っている",
      messages: [
        { from: "system", text: "── 母とのトークを開いた ──" },
        { from: "system", text: "一番上にあるのは、入院する三日前のやり取りだった。" },
        { from: "them", text: "今日は調子がいいの" },
        { from: "them", text: "洗濯物、よく乾いたわ" },
        { from: "system", text: "画面の下には、いつもの入力欄がある。" },
        { from: "system", text: "打てば送れる。既読が、つかないだけで。" },
      ],
      choices: [
        {
          label: "（「ありがとう」と打って、送る）",
          next: "n4",
          effects: { bondMother: 3, energy: -3 },
          reply: [
            { from: "system", text: "送信された。既読はつかなかった。" },
            { from: "system", text: "それでも、送った。" },
          ],
        },
        {
          label: "（トークを保存して、閉じる）",
          next: "n4",
          effects: { bondMother: 2, knowledge: 1 },
          flags: ["kept-log"],
          reply: [
            { from: "system", text: "やり取りを書き出して、保存した。" },
            { from: "system", text: "7年ぶんあった。思っていたより、ずっと多い。" },
          ],
        },
        {
          label: "（そっと閉じる）",
          next: "n4",
          effects: { energy: -2, bondMother: 1 },
          reply: [{ from: "system", text: "閉じた。しばらく、何もしなかった。" }],
        },
      ],
    },

    n4: {
      id: "n4",
      speaker: BROTHER,
      messages: [
        { from: "system", text: "── 実家の片付け ──" },
        { from: "them", text: "押し入れから、いろいろ出てきた" },
        { from: "them", text: "折り紙の鶴が、箱いっぱい" },
        { from: "them", text: "あとこれ、お前が小学生のときに描いた絵じゃないか" },
      ],
      choices: [
        {
          // 第5章で「もらっていく」と言った人にだけ開く。約束したかどうかの回収。
          label: "その絵なら、うちの玄関に飾ってあるよ。それは予備だ",
          next: "n5",
          effects: { bondMother: 3, bondSibling: 2 },
          requires: { flags: ["took-drawing"] },
          reply: [
            { from: "them", text: "……飾ってんのか" },
            { from: "them", text: "母さん、喜んだだろうな" },
          ],
        },
        {
          label: "もらっていく。今度こそ",
          next: "n5",
          effects: { bondMother: 2 },
          reply: [
            { from: "them", text: "そうしろ" },
            { from: "them", text: "捨てるには、しのびない" },
          ],
        },
        {
          // 実家の行き先を決めてあった人だけが、片付けの先を話せる。
          label: "この家、売るって決めてたよね。片付いたら不動産屋に出そう",
          next: "n5",
          effects: { knowledge: 3, bondSibling: 3 },
          requires: { flags: ["talked-house"] },
          reply: [
            { from: "them", text: "ああ。決めておいてよかった" },
            { from: "them", text: "いま話し合ってたら、たぶん揉めてた" },
          ],
        },
        {
          label: "……鶴、どうしようか",
          next: "n5",
          effects: { bondMother: 2, energy: -2 },
          reply: [
            { from: "them", text: "持って帰るか。何羽か" },
            { from: "them", text: "全部は無理だ" },
          ],
        },
      ],
    },

    n5: {
      id: "n5",
      speaker: BROTHER,
      messages: [
        { from: "them", text: "で、親父のことなんだけどさ" },
        { from: "them", text: "一人にしておくのは、正直こわい" },
        { from: "them", text: "……また同じことを、もう一回やるのか" },
      ],
      choices: [
        {
          label: "今度は早めに動こう。何が起きるか、もう知ってる",
          next: "n6",
          effects: { bondSibling: 3, knowledge: 2 },
          flags: ["ready-next"],
          reply: [
            { from: "them", text: "……そうだな" },
            { from: "them", text: "一回目とは違う" },
          ],
        },
        {
          // 母のときに聞けた人は、同じことを父にもできると分かっている。
          // 母のときに聞けた経験と、兄と組めている関係の両方が要る提案。
          label: "父さんの希望を、先に聞いておこう。母さんのときにやったみたいに",
          next: "n6",
          effects: { bondSibling: 4, knowledge: 3 },
          requires: { flags: ["talked-care"], min: { bondSibling: 58 } },
          flags: ["ready-next", "ask-father"],
          reply: [
            { from: "them", text: "……あれ、効いたもんな" },
            { from: "them", text: "今度は最初から聞いておこう" },
          ],
        },
        {
          label: "まず三浦さんに相談してみる。父さんの地域の包括支援センターにも",
          next: "n6",
          effects: { bondSibling: 3, knowledge: 4 },
          flags: ["ready-next"],
          reply: [
            { from: "them", text: "そうか、親父のほうにも窓口があるのか" },
            { from: "them", text: "今度は、最初から人を頼るか" },
          ],
        },
        {
          label: "……正直、もう一度やれる気がしない",
          next: "n6",
          effects: { energy: -6, bondSibling: 1 },
          reply: [
            { from: "them", text: "わかるよ" },
            { from: "them", text: "……まあ、そのときになったら、また考えよう" },
          ],
        },
      ],
    },

    n6: {
      id: "n6",
      speaker: SELF,
      notice: "書きかけのまま残っている",
      messages: [
        { from: "system", text: "── 家に帰ってから ──" },
        { from: "system", text: "実家から持ち帰った紙袋の底に、冊子が入っていた。" },
        { from: "system", text: "市役所でもらえる、あのエンディングノートだ。" },
        { from: "system", text: "未使用のものが、もう一冊あった。" },
        { from: "system", text: "表紙には、名前を書く欄がある。" },
      ],
      choices: [
        {
          label: "（自分の名前を書く）",
          next: "end",
          effects: { knowledge: 3, bondMother: 2 },
          flags: ["own-note"],
          reply: [
            { from: "system", text: "名前を書いた。そのあと、しばらくページをめくっていた。" },
            { from: "system", text: "最初の項目は「もしものときに連絡してほしい人」だった。" },
          ],
        },
        {
          label: "（引き出しに戻す）",
          next: "end",
          effects: { energy: 2 },
          reply: [
            { from: "system", text: "引き出しに入れた。いつか書く、と思いながら。" },
            { from: "system", text: "母も、たぶん同じことを思っていた。" },
          ],
        },
        {
          label: "（母の名前が書いてあるほうを、指でなぞる）",
          next: "end",
          effects: { bondMother: 4, energy: -2 },
          reply: [
            { from: "system", text: "母の字だった。几帳面で、少し右上がりの。" },
            { from: "system", text: "半分から先は、白いままだった。" },
          ],
        },
      ],
    },

    end: {
      id: "end",
      // 結びは自分側の地の文なので、最後の場面と同じトークのまま閉じる。
      // ここを既定のまま（母）にすると、いない相手から通知が来てしまう。
      speaker: SELF,
      end: true,
      messages: [],
    },
  },

  // 最終章の結び。ここまでの積み重ねが、次に渡せるかどうかで分かれる。
  endings: [
    {
      id: "pass-it-on",
      title: "渡されたものを、渡す",
      condition: { flags: ["own-note", "ready-next"] },
      messages: [
        { from: "system", text: "父の希望を聞く日程を決めた。今度は、こちらから切り出した。" },
        { from: "system", text: "自分のノートは、最初の3ページだけ埋まっている。" },
        { from: "system", text: "連絡してほしい人の欄に、兄の名前を書いた。" },
        { from: "system", text: "母から渡されたのは、鶴と、絵と、そしてこの順番だった。" },
      ],
      note: "介護と終活は、終わった話ではなかった。一度通った人だけが、次は早く動ける。渡されたものを渡す側に回ったところで、この物語は終わる。",
    },
    {
      id: "own-note",
      title: "名前を書いた",
      condition: { flags: ["own-note"] },
      messages: [
        { from: "system", text: "自分のノートに、名前だけ書いた。" },
        { from: "system", text: "中身はまだ白い。それでも、開いたことには意味がある。" },
        { from: "system", text: "母のノートを開いたときのことを、思い出しながら書いている。" },
      ],
      note: "書き始めるのに、特別な日は来ない。母が「早いうちじゃないと書けない」と言ったのは、たぶんこういうことだった。",
    },
    {
      id: "ready",
      title: "次は、早く動ける",
      condition: { flags: ["ready-next"] },
      messages: [
        { from: "system", text: "父のことは、兄と分担を決めた。次に何が起きるかは、もう知っている。" },
        { from: "system", text: "自分のノートは、まだ書いていない。" },
        { from: "system", text: "人のことなら動けるのに、と思いながら引き出しを閉めた。" },
      ],
      note: "一度通った経験は、次に効く。ただし効くのは「人を看る側」としてだけで、自分自身の番についてはまだ何も決めていない。",
    },
    {
      id: "closed",
      title: "引き出しに戻した",
      messages: [
        { from: "system", text: "手続きは、どうにか終わった。" },
        { from: "system", text: "実家には、まだ手をつけていない部屋がある。" },
        { from: "system", text: "冊子は引き出しの中で、いつか書かれるのを待っている。" },
      ],
      note: "終わったあとにも、決めていないことは残る。母が遺したのは財産だけではなく、先延ばしにしてきたことの一覧でもあった。次にそれを開くのは、たぶん自分のためになる。",
    },
  ],
};
