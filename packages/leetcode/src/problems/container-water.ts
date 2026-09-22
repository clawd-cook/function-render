import type { Problem } from "../types.ts";

function maxArea({ height }: { height: number[] }): number {
  let start = 0;
  let end = height.length - 1;
  let best = 0;
  while (start < end) {
    const volume = Math.min(height[start]!, height[end]!) * (end - start);
    best = Math.max(best, volume);
    if (height[start]! < height[end]!) start++;
    else end--;
  }
  return best;
}

export const containerWater11: Problem = {
  num: 11,
  title: "盛最多水的容器",
  slug: "container-with-most-water",
  url: "https://leetcode.cn/problems/container-with-most-water/",
  difficulty: "中等",
  category: "双指针",
  description:
    "给定一个长度为 n 的整数数组 height,有 n 条垂线。找出其中两条线,使它们与 x 轴共同构成的容器可以容纳最多的水,返回最大水量。",
  python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        start, end = 0, len(height) - 1
        max_volume = 0
        while start < end:
            volume = min(height[start], height[end]) * (end - start)
            max_volume = max(max_volume, volume)
            if height[start] < height[end]:
                start += 1
            else:
                end -= 1
        return max_volume`,
  solution: maxArea as (input: Record<string, unknown>) => unknown,
  spec: { call: "maxArea", args: { height: { $state: "/height" } }, out: "/result" },
  catalog: { maxArea },
  sample: { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expected: 49 },
};
