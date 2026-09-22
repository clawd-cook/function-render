import type { Catalog, Node } from "@function-renderer/core";

export type Difficulty = "简单" | "中等" | "困难";

/**
 * A LeetCode problem ported to TypeScript and expressed as a function-renderer
 * program: `solution` is the ported function, `catalog` registers it, and
 * `spec` is the JSON orchestration that runs it against `sample.input`.
 */
export interface Problem {
  num: number;
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  category: string;
  /** Problem statement (plain text / light markdown). */
  description: string;
  /** Original Python solution (from the source repository). */
  python: string;
  /** The ported TypeScript solution. */
  solution: (input: Record<string, unknown>) => unknown;
  /** function-renderer spec that runs the solution. */
  spec: Node;
  /** Catalog registering the solution under its slug/name. */
  catalog: Catalog;
  /** Default input and the expected output for the online runner and tests. */
  sample: { input: Record<string, unknown>; expected: unknown };
}
