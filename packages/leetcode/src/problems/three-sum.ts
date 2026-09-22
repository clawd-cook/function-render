import type { Problem } from "../types.ts";

function threeSum({ nums }: { nums: number[] }): number[][] {
  if (nums.length < 3) return [];
  const sorted = [...nums].sort((a, b) => a - b);
  const result: number[][] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]! > 0) break;
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const total = sorted[i]! + sorted[left]! + sorted[right]!;
      if (total === 0) {
        result.push([sorted[i]!, sorted[left]!, sorted[right]!]);
        while (left < right && sorted[left] === sorted[left + 1]) left++;
        while (left < right && sorted[right] === sorted[right - 1]) right--;
        left++;
        right--;
      } else if (total < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}

export const threeSum15: Problem = {
  num: 15,
  title: "三数之和",
  slug: "3sum",
  url: "https://leetcode.cn/problems/3sum/",
  difficulty: "中等",
  category: "双指针",
  description:
    "给你一个整数数组 nums,返回所有和为 0 且不重复的三元组 [nums[i], nums[j], nums[k]](i、j、k 互不相同)。",
  python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        if len(nums) < 3: return []
        nums.sort()
        result = []
        for i in range(len(nums)):
            if nums[i] > 0: break
            if i > 0 and nums[i] == nums[i - 1]: continue
            L, R = i + 1, len(nums) - 1
            while L < R:
                total = nums[i] + nums[L] + nums[R]
                if total == 0:
                    result.append([nums[i], nums[L], nums[R]])
                    while L < R and nums[L] == nums[L + 1]: L += 1
                    while L < R and nums[R] == nums[R - 1]: R -= 1
                    L += 1
                    R -= 1
                elif total < 0:
                    L += 1
                else:
                    R -= 1
        return result`,
  solution: threeSum as (input: Record<string, unknown>) => unknown,
  spec: { call: "threeSum", args: { nums: { $state: "/nums" } }, out: "/result" },
  catalog: { threeSum },
  sample: {
    input: { nums: [-1, 0, 1, 2, -1, -4] },
    expected: [
      [-1, -1, 2],
      [-1, 0, 1],
    ],
  },
};
