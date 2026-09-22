import type { Problem } from "../types.ts";

function twoSum({ nums, target }: { nums: number[]; target: number }): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]!;
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i]!, i);
  }
  return [];
}

export const twoSum1: Problem = {
  num: 1,
  title: "两数之和",
  slug: "two-sum",
  url: "https://leetcode.cn/problems/two-sum/",
  difficulty: "简单",
  category: "哈希",
  description:
    "给定一个整数数组 nums 和一个整数目标值 target，请在数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。每种输入只会对应一个答案，且同一个元素不能使用两次。",
  python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hashmap = {}
        for i in range(len(nums)):
            if target - nums[i] in hashmap:
                return [i, hashmap[target - nums[i]]]
            hashmap[nums[i]] = i`,
  solution: twoSum as (input: Record<string, unknown>) => unknown,
  spec: {
    call: "twoSum",
    args: { nums: { $state: "/nums" }, target: { $state: "/target" } },
    out: "/result",
  },
  catalog: { twoSum },
  sample: { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
};
