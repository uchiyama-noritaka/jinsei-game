import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// MVP段階では、デプロイと共有のしやすさを優先して
// ビルド成果物を1枚のHTMLに固める（vite-plugin-singlefile）。
// 章が増えてバンドルサイズが大きくなってきたら、通常のコード分割に戻す。
export default defineConfig({
  // GitHub Pages（https://<user>.github.io/jinsei-game/）で配信するため、
  // リポジトリ名をベースパスにする。ローカルの dev サーバでも問題なく動く。
  base: "/jinsei-game/",
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2019",
  },
});
