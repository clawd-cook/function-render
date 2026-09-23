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

const statementPages = [
  "then",
  "if",
  "switch",
  "tryCatch",
  "while",
  "for",
  "when",
  "callFunc",
  "get",
  "set",
  "arrayMap",
  "arrayFilter",
  "arrayReduce",
  "log",
  "assert",
  "sleep",
  "constant",
  "expr",
].map((id) => ({ text: id, link: `/reference/statements/${id}` }));

const operatorPages = [
  "add",
  "mul",
  "sub",
  "div",
  "mod",
  "pow",
  "abs",
  "ceil",
  "floor",
  "round",
  "gt",
  "gte",
  "lt",
  "lte",
  "eq",
  "neq",
  "and",
  "or",
  "not",
  "len",
  "at",
  "concat",
  "pick",
  "omit",
  "merge",
  "lit",
].map((id) => ({ text: `$${id}`, link: `/reference/operators/${id}` }));

export default defineConfig({
  title: "Function Renderer",
  description:
    "声明式函数执行引擎 — 对齐 JS 语法渐进提升 DSL 复杂度；封闭 NodeType/ExprAtom + 注入 Func",
  base: "/logic-render/",
  lang: "zh-CN",
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/overview" },
      { text: "设计理念", link: "/guide/rationale" },
      { text: "参考", link: "/reference/" },
      { text: "LeetCode", link: "/leetcode/" },
      { text: "test262", link: "/test262/" },
      { text: "GitHub", link: "https://github.com/clawd-cook/logic-render" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "入门",
          items: [
            { text: "概览", link: "/guide/overview" },
            { text: "设计理念", link: "/guide/rationale" },
          ],
        },
        {
          text: "指南（渐进）",
          items: [
            { text: "语法与类型", link: "/guide/grammar-and-types" },
            { text: "控制流与错误处理", link: "/guide/control-flow" },
            { text: "循环与迭代", link: "/guide/loops" },
            { text: "函数（callFunc）", link: "/guide/functions" },
            { text: "表达式与运算符", link: "/guide/expressions" },
            { text: "索引集合", link: "/guide/collections" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "参考",
          items: [
            { text: "总览", link: "/reference/" },
            { text: "错误", link: "/reference/errors" },
            { text: "API", link: "/reference/api" },
          ],
        },
        {
          text: "语句（NodeType）",
          collapsed: false,
          items: [{ text: "总览", link: "/reference/statements" }, ...statementPages],
        },
        {
          text: "运算符（ExprAtom）",
          collapsed: true,
          items: [{ text: "总览", link: "/reference/operators" }, ...operatorPages],
        },
      ],
      "/leetcode/": [
        { text: "LeetCode Hot 100", items: [{ text: "目录", link: "/leetcode/" }] },
        ...leetcodeGroups,
      ],
    },
    outline: { level: "deep", label: "本页目录" },
    socialLinks: [{ icon: "github", link: "https://github.com/clawd-cook/logic-render" }],
  },
});
