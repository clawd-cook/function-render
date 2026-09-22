import type { Problem } from "../types.ts";

function moveZeroes({ nums }: { nums: number[] }): number[] {
  const result = [...nums];
  let insert = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i] !== 0) {
      [result[insert], result[i]] = [result[i]!, result[insert]!];
      insert++;
    }
  }
  return result;
}

export const moveZeroes283: Problem = {
  num: 283,
  title: "移动零",
  slug: "move-zeroes",
  url: "https://leetcode.cn/problems/move-zeroes/",
  difficulty: "简单",
  category: "双指针",
  description:
    "给定一个数组 nums，将所有 0 移动到数组末尾,同时保持非零元素的相对顺序。必须在原地对数组进行操作。",
  python: `class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        zeroindex = -1
        for i in range(len(nums)):
            if nums[i] == 0 and zeroindex == -1:
                zeroindex = i
            elif nums[i] != 0 and zeroindex != -1:
                nums[zeroindex], nums[i] = nums[i], nums[zeroindex]
                zeroindex += 1
        return nums`,
  solution: moveZeroes as (input: Record<string, unknown>) => unknown,
  spec: { call: "moveZeroes", args: { nums: { $state: "/nums" } }, out: "/result" },
  catalog: { moveZeroes },
  sample: { input: { nums: [0, 1, 0, 3, 12] }, expected: [1, 3, 12, 0, 0] },
};
