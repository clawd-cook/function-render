import { defineConfig } from "vitepress";

import { categories } from "../data/problems.ts";

const leetcodeGroups = categories.map((category) => ({
  text: category.name,
  collapsed: false,
  items: category.problems.map((problem) => ({
    text: `${problem.num}. ${problem.title}`,
    link: `/leetcode/${problem.slug}`,
  })),
}));

export default defineConfig({
  title: "Function Renderer",
  description: "声明式函数执行引擎 — 用 JSON 编排已注册函数,浏览器在线运行 LeetCode",
  base: "/function-render/",
  lang: "zh-CN",
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/overview" },
      { text: "LeetCode", link: "/leetcode/" },
      { text: "GitHub", link: "https://github.com/clawd-cook/function-render" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "概览", link: "/guide/overview" },
            { text: "编排算子", link: "/guide/operators" },
            { text: "API", link: "/guide/api" },
          ],
        },
      ],
      "/leetcode/": [
        { text: "LeetCode Hot 100", items: [{ text: "目录", link: "/leetcode/" }] },
        ...leetcodeGroups,
      ],
    },
    outline: { level: "deep", label: "本页目录" },
    socialLinks: [{ icon: "github", link: "https://github.com/clawd-cook/function-render" }],
  },
});
