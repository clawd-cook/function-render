// oxlint-disable unicorn/no-thenable -- `then` is an `if`-node spec field name in these protocols
import type { Node } from "@logic-renderer/runner";

export type Difficulty = "简单" | "中等" | "困难";

/**
 * A LeetCode problem expressed directly as a logic-renderer **protocol**
 * (spec). The protocol is shown in the docs and executed in the browser — no
 * per-problem solution function. Most use only atomic operators + orchestration;
 * some `call` a registered complex operator (e.g. `sort`).
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
  spec: Node;
  /** Default input (initial shared state). */
  input: Record<string, unknown>;
  /** Expected `result` of running the protocol. */
  expected: unknown;
  /** Whether the protocol uses only built-in atomic operators (no `call`). */
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
    "给定一个整数数组 nums 和目标值 target,返回和为 target 的两个下标。这里完全用原子算子表达(嵌套遍历 + 取值/相加/比较 + 赋值),无需专门的解法函数。",
  pureProtocol: true,
  input: { nums: [2, 7, 11, 15], target: 9 },
  expected: [0, 1],
  spec: {
    seq: [
      { set: "/result", value: null },
      {
        for: { $state: "/nums" },
        as: "/x",
        indexAs: "/i",
        body: {
          for: { $state: "/nums" },
          as: "/y",
          indexAs: "/j",
          body: {
            if: {
              $and: [
                { $gt: [{ $state: "/j" }, { $state: "/i" }] },
                { $not: { $state: "/result" } },
                {
                  $eq: [
                    {
                      $add: [
                        { $at: [{ $state: "/nums" }, { $state: "/i" }] },
                        { $at: [{ $state: "/nums" }, { $state: "/j" }] },
                      ],
                    },
                    { $state: "/target" },
                  ],
                },
              ],
            },
            then: { set: "/result", value: [{ $state: "/i" }, { $state: "/j" }] },
          },
        },
      },
      { set: "/result", value: { $state: "/result" } },
    ],
  },
};

const moveZeroes: Problem = {
  num: 283,
  title: "移动零",
  slug: "move-zeroes",
  url: "https://leetcode.cn/problems/move-zeroes/",
  difficulty: "简单",
  category: "双指针",
  description:
    "将数组中的 0 移到末尾,保持非零元素相对顺序。协议先收集非零元素,再补齐 0,最后拼接 —— 全部用原子算子。",
  pureProtocol: true,
  input: { nums: [0, 1, 0, 3, 12] },
  expected: [1, 3, 12, 0, 0],
  spec: {
    seq: [
      { set: "/nz", value: [] },
      {
        for: { $state: "/nums" },
        as: "/x",
        body: {
          if: { $ne: [{ $state: "/x" }, 0] },
          then: { set: "/nz", value: { $push: [{ $state: "/nz" }, { $state: "/x" }] } },
        },
      },
      { set: "/zeros", value: [] },
      {
        for: { $state: "/nums" },
        as: "/y",
        body: {
          if: { $eq: [{ $state: "/y" }, 0] },
          then: { set: "/zeros", value: { $push: [{ $state: "/zeros" }, 0] } },
        },
      },
      { set: "/result", value: { $concat: [{ $state: "/nz" }, { $state: "/zeros" }] } },
    ],
  },
};

const maxSubarray: Problem = {
  num: 53,
  title: "最大子数组和",
  slug: "maximum-subarray",
  url: "https://leetcode.cn/problems/maximum-subarray/",
  difficulty: "中等",
  category: "动态规划",
  description:
    "求具有最大和的连续子数组的和(Kadane)。协议用共享状态做累加器,配合 $max/$add 原子算子,无需解法函数。",
  pureProtocol: true,
  input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  expected: 6,
  spec: {
    seq: [
      { set: "/best", value: { $at: [{ $state: "/nums" }, 0] } },
      { set: "/cur", value: { $at: [{ $state: "/nums" }, 0] } },
      {
        for: { $state: "/nums" },
        as: "/num",
        indexAs: "/k",
        body: {
          if: { $gt: [{ $state: "/k" }, 0] },
          then: {
            seq: [
              {
                set: "/cur",
                value: {
                  $max: [{ $state: "/num" }, { $add: [{ $state: "/cur" }, { $state: "/num" }] }],
                },
              },
              { set: "/best", value: { $max: [{ $state: "/best" }, { $state: "/cur" }] } },
            ],
          },
        },
      },
      { set: "/best", value: { $state: "/best" } },
    ],
  },
};

const sortArray: Problem = {
  num: 912,
  title: "排序数组",
  slug: "sort-an-array",
  url: "https://leetcode.cn/problems/sort-an-array/",
  difficulty: "中等",
  category: "排序",
  description:
    "对数组排序。排序属于复杂算子,登记为 catalog 中的 sort,协议用 call 调用它 —— 展示「编排算子 + 已登记的复杂算子」的组合。",
  pureProtocol: false,
  input: { nums: [5, 2, 3, 1, 4] },
  expected: [1, 2, 3, 4, 5],
  spec: { call: "sort", args: { items: { $state: "/nums" } }, out: "/result" },
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
