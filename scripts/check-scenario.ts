// シナリオの機械チェック。`npm run check:scenario` で実行する。
//
//  - 遷移先ノードの実在、到達できないノード、行き止まり
//  - すべての選択肢に reply があること
//    （選んだ内容に噛み合う返事は選択肢側に置く、という書き方の約束）
//  - 会話のつながりを全部書き出す（選んだ内容 → 直後の返し → 次の本文）
//  - 全ルートを総当たりして、各エンディングと条件つき選択肢に
//    到達できるルートが実在すること
//  - 条件が参照しているフラグが、どこかの選択肢で実際に立つこと
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

// ── 到達可能性 ──────────────────────────────────────────────
//
// 章をまたいだ全組み合わせを数え上げるのは、もう成立しない。
// 第2章を終えた時点で状態は37,221通りあり、第3章まで通すと
// (ノード, 状態) の組が数千万を超えて、重複排除しても6GBで足りなくなる。
// 章が増えるたびに指数で伸びるので、間引いて誤魔化しても先がない。
//
// 一方で、章の中だけのルート数は多くても2000程度しかない。
// なので「前の章をどう終えたか」を代表的な状態に絞り、
// 各章はその代表ごとに全数探索する。章を足しても線形にしか増えない。
//
// 代表に選ぶのは、各ステータスの最大・最小、2つの組み合わせの最大、
// 前章のエンディングごと・フラグの組み合わせごとに1件。
// ステータスの増減は足し算なので、最大値・最小値を持つ状態を入れておけば
// 「どこまで伸ばせるか／どこまで落ちるか」は代表からでも見える。
console.log("\n\n======== 到達可能性 ========");
type Run = { stats: Stats; flags: string[] };
type Finished = Run & { endingId: string };

function representatives(runs: Finished[]): Run[] {
  const picked = new Map<string, Run>();
  const add = (r?: Run) => {
    if (!r) return;
    const key = JSON.stringify(r);
    if (!picked.has(key)) picked.set(key, { stats: r.stats, flags: r.flags });
  };
  const best = (score: (r: Finished) => number) => runs.reduce((a, b) => (score(b) > score(a) ? b : a));
  for (const k of KEYS) {
    add(best((r) => r.stats[k]));
    add(best((r) => -r.stats[k]));
  }
  // 条件は「知識8以上かつ関係53以上」のように重なることがあるので、2つの和が最大の状態も入れる
  for (let i = 0; i < KEYS.length; i++)
    for (let j = i + 1; j < KEYS.length; j++) add(best((r) => r.stats[KEYS[i]] + r.stats[KEYS[j]]));
  const once = new Set<string>();
  for (const r of runs) {
    const tags = [`end:${r.endingId}`, `flags:${r.flags.join(",")}`];
    for (const t of tags) if (!once.has(t)) { once.add(t); add(r); }
  }
  return [...picked.values()];
}

let starts: Run[] = [{ stats: INITIAL, flags: [] }];
const unlocked = new Set<string>();

for (const ch of chapters) {
  const endingCount = new Map<string, number>();
  const lo = { ...INITIAL }, hi = { ...INITIAL };
  let total = 0, first = true;
  const finished: Finished[] = [];

  const walk = (nodeId: string, run: Run, d = 0) => {
    if (d > 40) { fail("ループの疑い"); return; }
    const node = ch.nodes[nodeId];
    if (node.end) {
      const e = ch.endings.find((x) => meetsCondition(run.stats, x.condition, run.flags)) ?? ch.endings.at(-1)!;
      endingCount.set(e.id, (endingCount.get(e.id) ?? 0) + 1);
      total++;
      for (const k of KEYS) {
        if (first || run.stats[k] < lo[k]) lo[k] = run.stats[k];
        if (first || run.stats[k] > hi[k]) hi[k] = run.stats[k];
      }
      first = false;
      finished.push({ ...run, endingId: e.id });
      return;
    }
    for (const c of node.choices ?? []) {
      if (!meetsCondition(run.stats, c.requires, run.flags)) continue;
      if (c.requires) unlocked.add(`${ch.id}/${nodeId}`);
      const flags = c.flags ? [...new Set([...run.flags, ...c.flags])].sort() : run.flags;
      walk(c.next, { stats: apply(run.stats, c.effects), flags }, d + 1);
    }
  };
  for (const s0 of starts) walk(ch.startNode, s0);

  console.log(`\n[${ch.id}] 代表となる開始状態 ${starts.length} 通り × 章内の全選択 = ${total.toLocaleString()} ルート`);
  if (ch.prologue) {
    ch.prologue.forEach((pr, i) => {
      const hits = starts.filter(
        (r) => ch.prologue!.findIndex((p) => meetsCondition(r.stats, p.condition, r.flags)) === i,
      ).length;
      console.log(`  ${hits ? "OK" : "NG"}  書き出し[${i}] 代表 ${String(hits).padStart(2)}/${starts.length} が該当  「${pr.messages[1]?.text ?? pr.messages[0]?.text}」`);
      if (!hits) fail(`[${ch.id}] 書き出し[${i}] に到達する代表状態が無い`);
    });
  }
  for (const e of ch.endings) {
    const hits = endingCount.get(e.id) ?? 0;
    console.log(`  ${hits ? "OK" : "NG"}  ${e.id.padEnd(9)} ${String(hits.toLocaleString()).padStart(7)} ルート (${((hits / total) * 100).toFixed(1)}%)  ${e.title}`);
    if (!hits) fail(`エンディング ${e.id} に到達するルートが、代表状態からは見つからない`);
  }
  console.log("  終了時範囲: " + KEYS.map((k) => `${k} ${lo[k]}〜${hi[k]}`).join(" / "));
  starts = representatives(finished);
}
for (const ch of chapters) for (const [id, n] of Object.entries(ch.nodes)) for (const c of n.choices ?? []) {
  if (c.requires && !unlocked.has(`${ch.id}/${id}`)) fail(`条件つき選択肢が一度も解禁されない: ${c.label}`);
}

// 条件が見ているフラグの綴りが、どこかの選択肢で実際に立つか
const produced = new Set<string>();
for (const ch of chapters) for (const n of Object.values(ch.nodes)) for (const c of n.choices ?? []) (c.flags ?? []).forEach((f) => produced.add(f));
const referenced = new Set<string>();
for (const ch of chapters) {
  for (const n of Object.values(ch.nodes)) for (const c of n.choices ?? []) (c.requires?.flags ?? []).forEach((f) => referenced.add(f));
  for (const e of ch.endings) (e.condition?.flags ?? []).forEach((f) => referenced.add(f));
  for (const pr of ch.prologue ?? []) (pr.condition?.flags ?? []).forEach((f) => referenced.add(f));
}
console.log("\nフラグ: 立てている " + [...produced].join(", ") || "(なし)");
for (const f of referenced) {
  if (!produced.has(f)) fail(`条件が見ているフラグ「${f}」を立てる選択肢が無い（綴り違い？）`);
}

console.log(problems === 0 ? "\n=== すべてのチェックを通過 ===" : `\n=== ${problems} 件の問題 ===`);
if (problems > 0) process.exitCode = 1;
