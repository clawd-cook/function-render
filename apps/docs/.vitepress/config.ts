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

/** MDN-style: Tutorials (指南 / 中级 / 高级) + References — shared on guide & reference. */
const flowSpecSidebar = [
  {
    text: "教程",
    items: [
      {
        text: "FlowSpec 指南",
        collapsed: false,
        items: [
          { text: "指南目录", link: "/guide/guide" },
          { text: "语法与类型", link: "/guide/grammar-and-types" },
          { text: "控制流与错误处理", link: "/guide/control-flow" },
          { text: "循环与迭代", link: "/guide/loops" },
          { text: "函数（callFunc）", link: "/guide/functions" },
          { text: "表达式与运算符", link: "/guide/expressions" },
          { text: "索引集合", link: "/guide/collections" },
        ],
      },
      {
        text: "中级",
        collapsed: false,
        items: [
          { text: "语言概览", link: "/guide/overview" },
          { text: "三层身份与放置规则", link: "/guide/identities" },
        ],
      },
      {
        text: "高级",
        collapsed: true,
        items: [
          { text: "设计理念", link: "/guide/rationale" },
          { text: "preview 与 rollback", link: "/guide/preview-rollback" },
        ],
      },
    ],
  },
  {
    text: "参考",
    items: [
      { text: "参考总览", link: "/reference/" },
      {
        text: "语句和声明",
        collapsed: true,
        items: [{ text: "总览", link: "/reference/statements" }, ...statementPages],
      },
      {
        text: "表达式和运算符",
        collapsed: true,
        items: [{ text: "总览", link: "/reference/operators" }, ...operatorPages],
      },
      { text: "错误", link: "/reference/errors" },
      { text: "API", link: "/reference/api" },
    ],
  },
];

export default defineConfig({
  title: "Function Renderer",
  description:
    "声明式函数执行引擎 — 对齐 MDN：教程（指南/中级/高级）+ 参考（语句/运算符）",
  base: "/logic-render/",
  lang: "zh-CN",
  themeConfig: {
    nav: [
      { text: "FlowSpec", link: "/guide/" },
      { text: "指南", link: "/guide/guide" },
      { text: "参考", link: "/reference/" },
      { text: "博客", link: "/blog/" },
      { text: "LeetCode", link: "/leetcode/" },
      { text: "test262", link: "/test262/" },
      { text: "GitHub", link: "https://github.com/clawd-cook/logic-render" },
    ],
    sidebar: {
      "/guide/": flowSpecSidebar,
      "/reference/": flowSpecSidebar,
      "/blog/": [
        {
          text: "博客",
          items: [
            { text: "目录", link: "/blog/" },
            {
              text: "配置化的困境",
              link: "/blog/configuration-dilemma",
            },
          ],
        },
      ],
      "/leetcode/": [
        { text: "LeetCode Hot 100", items: [{ text: "目录", link: "/leetcode/" }] },
        ...leetcodeGroups,
      ],
    },
    outline: { level: "deep", label: "本文内容" },
    socialLinks: [{ icon: "github", link: "https://github.com/clawd-cook/logic-render" }],
  },
});
