import type { Problem } from "../types.ts";

function maxSubArray({ nums }: { nums: number[] }): number {
  let current = nums[0]!;
  let best = nums[0]!;
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i]!, current + nums[i]!);
    best = Math.max(best, current);
  }
  return best;
}

export const maxSubarray53: Problem = {
  num: 53,
  title: "最大子数组和",
  slug: "maximum-subarray",
  url: "https://leetcode.cn/problems/maximum-subarray/",
  difficulty: "中等",
  category: "普通数组",
  description:
    "给你一个整数数组 nums，找出一个具有最大和的连续子数组(子数组最少包含一个元素),返回其最大和。",
  python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        current_sum = max_sum = nums[0]
        for num in nums[1:]:
            current_sum = max(num, current_sum + num)
            max_sum = max(max_sum, current_sum)
        return max_sum`,
  solution: maxSubArray as (input: Record<string, unknown>) => unknown,
  spec: { call: "maxSubArray", args: { nums: { $state: "/nums" } }, out: "/result" },
  catalog: { maxSubArray },
  sample: { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: 6 },
};
