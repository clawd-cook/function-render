import type { Problem } from "../types.ts";

function lengthOfLongestSubstring({ s }: { s: string }): number {
  let start = 0;
  let maxLength = 0;
  const lastIndex = new Map<string, number>();
  for (let end = 0; end < s.length; end++) {
    const ch = s[end]!;
    const seen = lastIndex.get(ch);
    if (seen !== undefined && seen >= start) {
      start = seen + 1;
    }
    lastIndex.set(ch, end);
    maxLength = Math.max(maxLength, end - start + 1);
  }
  return maxLength;
}

export const longestSubstring3: Problem = {
  num: 3,
  title: "无重复字符的最长子串",
  slug: "longest-substring-without-repeating-characters",
  url: "https://leetcode.cn/problems/longest-substring-without-repeating-characters/",
  difficulty: "中等",
  category: "滑动窗口",
  description: "给定一个字符串 s，找出其中不含有重复字符的最长子串的长度。",
  python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        if not s:
            return 0
        start, max_length = 0, 0
        char_index_map = {}
        for end in range(len(s)):
            if s[end] in char_index_map and char_index_map[s[end]] >= start:
                start = char_index_map[s[end]] + 1
            char_index_map[s[end]] = end
            max_length = max(max_length, end - start + 1)
        return max_length`,
  solution: lengthOfLongestSubstring as (input: Record<string, unknown>) => unknown,
  spec: { call: "lengthOfLongestSubstring", args: { s: { $state: "/s" } }, out: "/result" },
  catalog: { lengthOfLongestSubstring },
  sample: { input: { s: "abcabcbb" }, expected: 3 },
};
