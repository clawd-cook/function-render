import type { NodeType } from "./types.ts";

/**
 * Progressive complexity tiers (JS-aligned learning / delivery order).
 *
 * - **L0** — settlement subset: sequence, branch, Slot, callFunc, minimal Expr
 * - **L1** — control-flow completion (`switch`, `tryCatch`)
 * - **L2** — bounded loops (`while`, `for`)
 * - **L3** — widened ExprAtom set (arithmetic / compare / first-order data)
 * - **L4** — indexed-collection higher-order nodes
 * - **L5** — concurrency + utility / diagnostic nodes
 *
 * Docs Guide chapters and engine catalog growth follow this ladder.
 * Adding a NodeType / ExprAtom = pick a tier + engine version bump (never project `register`).
 */
export type ComplexityTier = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

/** Closed NodeType → complexity tier. */
export const NODE_COMPLEXITY: Readonly<Record<NodeType, ComplexityTier>> = {
  // oxlint-disable-next-line unicorn/no-thenable -- `then` is a NodeType key, not a Promise thenable
  then: "L0",
  if: "L0",
  set: "L0",
  get: "L0",
  callFunc: "L0",
  switch: "L1",
  tryCatch: "L1",
  while: "L2",
  for: "L2",
  arrayMap: "L4",
  arrayFilter: "L4",
  arrayReduce: "L4",
  when: "L5",
  log: "L5",
  assert: "L5",
  sleep: "L5",
  constant: "L5",
  expr: "L5",
};

/** Closed ExprAtom → complexity tier. L0 = settlement minimum; rest = L3 widen. */
export const EXPR_COMPLEXITY: Readonly<Record<string, ComplexityTier>> = {
  $add: "L0",
  $mul: "L0",
  $gt: "L0",
  $lit: "L0",
  $sub: "L3",
  $div: "L3",
  $mod: "L3",
  $pow: "L3",
  $abs: "L3",
  $ceil: "L3",
  $floor: "L3",
  $round: "L3",
  $gte: "L3",
  $lt: "L3",
  $lte: "L3",
  $eq: "L3",
  $neq: "L3",
  $and: "L3",
  $or: "L3",
  $not: "L3",
  $len: "L3",
  $at: "L3",
  $concat: "L3",
  $pick: "L3",
  $omit: "L3",
  $merge: "L3",
};

/** Human-readable tier blurbs for docs / tooling. */
export const COMPLEXITY_TIER_BLURB: Readonly<Record<ComplexityTier, string>> = {
  L0: "基础可运行：then / if / set / get / callFunc + $add / $mul / $gt / $lit",
  L1: "控制流补全：switch / tryCatch",
  L2: "有界循环：while / for（必带 maxIter）",
  L3: "表达式加宽：更多算术、比较、逻辑、一阶数据原子",
  L4: "索引集合高阶：arrayMap / arrayFilter / arrayReduce",
  L5: "并发与工具：when / log / assert / sleep / constant / expr",
};
