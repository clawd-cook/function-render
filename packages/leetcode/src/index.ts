import { containerWater11 } from "./problems/container-water.ts";
import { longestSubstring3 } from "./problems/longest-substring.ts";
import { maxSubarray53 } from "./problems/max-subarray.ts";
import { moveZeroes283 } from "./problems/move-zeroes.ts";
import { threeSum15 } from "./problems/three-sum.ts";
import { twoSum1 } from "./problems/two-sum.ts";
import type { Problem } from "./types.ts";

export type { Problem, Difficulty } from "./types.ts";

/** Attribution: solutions ported from a public study repository. */
export const SOURCE = {
  name: "realnghon/LeetCode_Hot100_Python",
  url: "https://github.com/realnghon/LeetCode_Hot100_Python",
};

/** All ported problems (first batch). */
export const problems: Problem[] = [
  twoSum1,
  moveZeroes283,
  longestSubstring3,
  maxSubarray53,
  containerWater11,
  threeSum15,
];

/** Look up a problem by its slug. */
export function getProblem(slug: string): Problem | undefined {
  return problems.find((problem) => problem.slug === slug);
}

export interface Category {
  name: string;
  problems: Problem[];
}

/** Problems grouped by category, preserving first-seen order. */
export const categories: Category[] = (() => {
  const order: string[] = [];
  const byName = new Map<string, Problem[]>();
  for (const problem of problems) {
    if (!byName.has(problem.category)) {
      byName.set(problem.category, []);
      order.push(problem.category);
    }
    byName.get(problem.category)!.push(problem);
  }
  return order.map((name) => ({ name, problems: byName.get(name)! }));
})();
