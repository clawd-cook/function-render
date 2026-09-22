import type { FlowSpec } from "@logic-renderer/runner";

export type Difficulty = "简单" | "中等" | "困难";

/**
 * A LeetCode-style problem expressed as a logic-renderer FlowSpec.
 * v1 runtime has no `for`/`arrayMap`, so algorithmic problems call registered
 * Funcs; sort still uses catalog `sort`.
 */
export interface Problem {
  num: number;
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  /** logic-renderer protocol that solves the problem. */
  spec: FlowSpec;
  /** Default `run` input (becomes `$.input`). */
  input: unknown;
  /** Expected `result` of running the protocol. */
  expected: unknown;
  /** Whether the protocol uses only ExprAtom + control (no callFunc). */
  pureProtocol: boolean;
}

export const SOURCE = {
  name: "realnghon/LeetCode_Hot100_Python",
  url: "https://github.com/realnghon/LeetCode_Hot100_Python",
};

const twoSum: Problem = {
  num: 1,
  title: "两数之和",
  slug: "two-sum",
  url: "https://leetcode.cn/problems/two-sum/",
  difficulty: "简单",
  category: "数组",
  description:
    "给定整数数组与目标值,返回和为目标的两个下标。v1 无 for/arrayMap,解法登记为 Func `twoSum`,协议用 callFunc 调用。",
  pureProtocol: false,
  input: { nums: [2, 7, 11, 15], target: 9 },
  expected: [0, 1],
  spec: {
    type: "callFunc",
    params: {
      funcKey: "twoSum",
      args: { nums: "$.input.nums", target: "$.input.target" },
    },
    outputTo: "$.result",
  },
};

const moveZeroes: Problem = {
  num: 283,
  title: "移动零",
  slug: "move-zeroes",
  url: "https://leetcode.cn/problems/move-zeroes/",
  difficulty: "简单",
  category: "数组",
  description: "将数组中的 0 移到末尾并保持非零相对顺序。登记为 Func `moveZeroes`。",
  pureProtocol: false,
  input: { nums: [0, 1, 0, 3, 12] },
  expected: [1, 3, 12, 0, 0],
  spec: {
    type: "callFunc",
    params: { funcKey: "moveZeroes", args: { nums: "$.input.nums" } },
    outputTo: "$.result",
  },
};

const maxSubarray: Problem = {
  num: 53,
  title: "最大子数组和",
  slug: "maximum-subarray",
  url: "https://leetcode.cn/problems/maximum-subarray/",
  difficulty: "中等",
  category: "动态规划",
  description: "求连续子数组最大和。登记为 Func `maxSubarray`。",
  pureProtocol: false,
  input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  expected: 6,
  spec: {
    type: "callFunc",
    params: { funcKey: "maxSubarray", args: { nums: "$.input.nums" } },
    outputTo: "$.result",
  },
};

const sortArray: Problem = {
  num: 912,
  title: "排序数组",
  slug: "sort-an-array",
  url: "https://leetcode.cn/problems/sort-an-array/",
  difficulty: "中等",
  category: "排序",
  description: "对数组排序。用 catalog 中的 sort Func + callFunc。",
  pureProtocol: false,
  input: { nums: [5, 2, 3, 1, 4] },
  expected: [1, 2, 3, 4, 5],
  spec: {
    type: "callFunc",
    params: { funcKey: "sort", args: { items: "$.input.nums" } },
    outputTo: "$.result",
  },
};

export const problems: Problem[] = [twoSum, moveZeroes, maxSubarray, sortArray];

export function getProblem(slug: string): Problem | undefined {
  return problems.find((problem) => problem.slug === slug);
}

export interface Category {
  name: string;
  problems: Problem[];
}

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
