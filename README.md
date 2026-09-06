# 人生（終盤）ゲーム ─ 第1章プロトタイプ

介護・終活をテーマにした、LINE風メッセージ画面で進むノベルゲーム。
このリポジトリは企画書の「開発ロードマップ W1: 土台構築」にあたる、第1章（日常編）を通しで遊べる最小プロトタイプ。

## 遊び方

```bash
npm install
npm run dev
```

表示されるURL（通常 http://localhost:5173）をブラウザで開く。

## ビルド

```bash
npm run build
```

`dist/index.html` に、JS・CSSをすべて1ファイルに埋め込んだ自己完結型のHTMLが出力される（`vite-plugin-singlefile`を使用）。この1ファイルをそのままどこにでも置けば動く。

## 何を・なぜこの設計にしたか

- **シナリオをコードから分離した（`src/data/chapter1.ts`）**
  ノード（発言のかたまり）と選択肢をデータとして定義し、エンジン（`src/store/gameStore.ts`）はそれを読んで進行を管理するだけにした。章を追加するときはこのデータファイルを増やすだけでよく、UIやロジックに触れる必要がない。

- **状態管理はZustand**
  Reduxほどの定型コードを書かずに、`stats`（お金・気力・関係値・知識）と`timeline`（表示済みメッセージ）と`currentNodeId`（今どのノードにいるか）をシンプルなストアで一元管理している。

- **セーブはlocalStorageへ自動保存**
  選択するたびに`persist()`が状態をlocalStorageへ書き込む。サーバーもログインも不要で、ブラウザを閉じても続きから再開できる（`hydrate()`で読み込み）。

- **ビルドを1ファイルに固めた（vite-plugin-singlefile）**
  MVPの段階では「どこでもすぐ動かせる」ことを優先。章が増えてバンドルが大きくなったら、通常のコード分割ビルドに戻すのが素直な次の一手。

- **エンディング分岐はデータではなくロジック側で判定**
  `chapter1.ts`の`end`ノード自体は空で、`gameStore.ts`の`choose()`が最終的な`bondMother`の値を見て`warm`/`distant`のどちらの結び方を見せるか決めている。パラメータの積み重ねが結末に反映される、という設計を確認するための実装。

## ディレクトリ構成

```
src/
  types.ts              型定義（Stats, ScenarioNode, Choice など）
  data/chapter1.ts       第1章のシナリオデータ（本文はここ）
  store/gameStore.ts     ゲーム進行のロジックとセーブ/ロード
  components/
    ChatScreen.tsx       画面全体の制御（メッセージの逐次表示、選択肢、演出）
    MessageBubble.tsx    吹き出し1つ分の見た目
    StatusHUD.tsx        画面下部のステータス表示
  App.tsx / main.tsx     エントリーポイント
  index.css              LINE風UIのスタイル一式（ライト/ダーク両対応）
```

## 次にやること（企画書ロードマップより）

1. 残り6章分の分岐フローチャートを詳細化
2. 第2〜7章のシナリオ執筆とデータ化
3. テストプレイでの分岐漏れ・パラメータ矛盾のチェック
4. PWA化・独自ドメインでの公開
