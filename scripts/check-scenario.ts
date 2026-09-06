// シナリオの機械チェック。`npm run check:scenario` で実行する。
//
//  - 遷移先ノードの実在、到達できないノード、行き止まり
//  - すべての選択肢に reply があること
//    （選んだ内容に噛み合う返事は選択肢側に置く、という書き方の約束）
//  - 会話のつながりを全部書き出す（選んだ内容 → 直後の返し → 次の本文）
//  - 全ルートを総当たりして、各エンディングと条件つき選択肢に
//    到達できるルートが実在すること
//
// 本文の良し悪しまでは判定できないので、書き出した一覧を目で読む前提。

import { chapters } from "../src/data/chapters";
import { meetsCondition } from "../src/store/gameStore";
import type { Stats } from "../src/types";

const INITIAL: Stats = { money: 50, energy: 60, bondMother: 50, bondSibling: 50, knowledge: 0 };
const KEYS = Object.keys(INITIAL) as (keyof Stats)[];
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const apply = (s: Stats, d?: Partial<Stats>) => {
  const n = { ...s };
  for (const k of Object.keys(d ?? {}) as (keyof Stats)[]) n[k] = clamp(n[k] + (d![k] ?? 0));
  return n;
};
let problems = 0;
const fail = (m: string) => { problems++; console.log("  NG:", m); };

for (const ch of chapters) {
  console.log(`\n[${ch.id}] ${ch.title} ${ch.subtitle}`);
  if (!ch.nodes[ch.startNode]) fail(`startNode ${ch.startNode} が無い`);
  const reachable = new Set([ch.startNode]);
  const stack = [ch.startNode];
  while (stack.length) {
    const id = stack.pop()!;
    const n = ch.nodes[id];
    if (!n) { fail(`ノード ${id} が無い`); continue; }
    if (n.id !== id) fail(`ノード ${id} の id が ${n.id}`);
    const nexts = [...(n.choices?.map((c) => c.next) ?? []), ...(n.next ? [n.next] : [])];
    if (!n.end && nexts.length === 0) fail(`ノード ${id} は行き止まりだが end でない`);
    for (const c of n.choices ?? []) {
      // 選んだ内容に噛み合う返事は必ず選択肢側に置く、という約束の機械チェック
      if (!c.reply?.length) fail(`[${ch.id}/${id}] 選択肢に reply が無い: ${c.label}`);
    }
    for (const nx of nexts) {
      if (!ch.nodes[nx]) { fail(`${id} の遷移先 ${nx} が無い`); continue; }
      if (!reachable.has(nx)) { reachable.add(nx); stack.push(nx); }
    }
  }
  for (const id of Object.keys(ch.nodes)) if (!reachable.has(id)) fail(`ノード ${id} に到達できない`);
  if (ch.endings.at(-1)?.condition) fail("最後のエンディングに条件がある（フォールバックが無い）");
  console.log(`  ノード ${Object.keys(ch.nodes).length} / エンディング ${ch.endings.length} / 全選択肢に reply あり`);
}

// 会話のつながりを全部書き出して、人の目で読めるようにする
console.log("\n\n======== 接続の一覧（選んだ内容 → 直後の返し → 次の本文の1行目）========");
for (const ch of chapters) {
  console.log(`\n■ ${ch.title}`);
  for (const [id, n] of Object.entries(ch.nodes)) {
    if (!n.choices) continue;
    console.log(`\n  ● ${id}（相手: ${n.speaker?.name ?? ch.npcName}） 本文末: 「${n.messages.at(-1)?.text ?? "(なし)"}」`);
    for (const c of n.choices) {
      const nx = ch.nodes[c.next];
      const head = nx.end
        ? ch.endings.map((e) => `[${e.id}] ${e.messages[0]?.text}`).join(" / ")
        : `「${nx.messages[0]?.text}」`;
      console.log(`     自分: 「${c.label}」`);
      for (const r of c.reply ?? []) console.log(`       └ 返し(${r.from}): 「${r.text}」`);
      console.log(`         → 次: ${head}`);
    }
  }
}

// 全ルート総当たり
console.log("\n\n======== 到達可能性 ========");
let starts: Stats[] = [INITIAL];
const unlocked = new Set<string>();
for (const ch of chapters) {
  const results: { endingId: string; stats: Stats }[] = [];
  const walk = (nodeId: string, stats: Stats, d = 0) => {
    if (d > 40) { fail("ループの疑い"); return; }
    const node = ch.nodes[nodeId];
    if (node.end) {
      const e = ch.endings.find((x) => meetsCondition(stats, x.condition)) ?? ch.endings.at(-1)!;
      results.push({ endingId: e.id, stats });
      return;
    }
    for (const c of node.choices ?? []) {
      if (!meetsCondition(stats, c.requires)) continue;
      if (c.requires) unlocked.add(`${ch.id}/${nodeId}`);
      walk(c.next, apply(stats, c.effects), d + 1);
    }
  };
  const seen = new Set<string>();
  for (const s of starts) {
    const key = JSON.stringify(s);
    if (seen.has(key)) continue;
    seen.add(key);
    walk(ch.startNode, s);
  }
  console.log(`\n[${ch.id}] 開始 ${seen.size} 通り × 全選択 = ${results.length} ルート`);
  for (const e of ch.endings) {
    const hits = results.filter((r) => r.endingId === e.id).length;
    console.log(`  ${hits ? "OK" : "NG"}  ${e.id.padEnd(8)} ${String(hits).padStart(7)} ルート (${((hits / results.length) * 100).toFixed(1)}%)  ${e.title}`);
    if (!hits) fail(`エンディング ${e.id} に到達できるルートが無い`);
  }
  console.log("  終了時範囲: " + KEYS.map((k) => `${k} ${Math.min(...results.map((r) => r.stats[k]))}〜${Math.max(...results.map((r) => r.stats[k]))}`).join(" / "));
  starts = results.map((r) => r.stats);
}
for (const ch of chapters) for (const [id, n] of Object.entries(ch.nodes)) for (const c of n.choices ?? []) {
  if (c.requires && !unlocked.has(`${ch.id}/${id}`)) fail(`条件つき選択肢が一度も解禁されない: ${c.label}`);
}
console.log(problems === 0 ? "\n=== すべてのチェックを通過 ===" : `\n=== ${problems} 件の問題 ===`);
if (problems > 0) process.exitCode = 1;
