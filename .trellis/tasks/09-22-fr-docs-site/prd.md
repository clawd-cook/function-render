# fr-docs-site — VitePress 文档站 + LeetCode 在线运行 + GitHub Pages

> 从最新 `main` 切分支。目标:打通「文档站 + LeetCode 题(function-render 实现)+ 浏览器在线运行 + GitHub Pages 部署」完整流水线,首批若干题,后续可扩到全部 93。

## Goal

一个 VitePress 文档站:(1) 介绍 function-render 项目(概念/算子/API);(2) LeetCode Hot100 分类目录 + 每题页(题目描述、原 Python 解法、function-render spec、**浏览器在线运行器**);(3) GitHub Pages 自动部署。

数据来源:`https://github.com/realnghon/LeetCode_Hot100_Python`(公开题解,文档内注明来源)。

## Confirmed Facts / Decisions

- **落地方式(已认可)**:每题把 Python 解法移植成 TS 函数,放进新包 `@function-renderer/leetcode`;该题「function-render 实现」= 调用它的 spec(单 `call` 或用 `seq`/`for` 编排);在 VitePress 里嵌浏览器内运行器,复用 `@function-renderer/runner`。
- **范围(已定)**:先**打通完整流水线**(首批 ~6 题,覆盖哈希/双指针/滑动窗口/普通数组),再分批扩展至全部 93。
- **部署(已定)**:GitHub Pages(GitHub Actions 构建并部署)。
- **VitePress 集成(已验证)**:workspace 用 `overrides: vite@*: catalog:` 把 `vite` 强制成 Vite+ core;VitePress 需额外装 `vue` + `esbuild` 才能 `vitepress build` 成功(否则 `Cannot find package 'vue'` / `transformWithEsbuild` 缺失)。已验证 `build complete`。

## Requirements

- **R1 leetcode 包**:`@function-renderer/leetcode` 导出 `problems`:每题 `{ num, title, slug, url, difficulty, category, description, python, solution, spec, catalog, sample }`。`solution` = 移植的 TS 函数;`spec` = function-render Node;`sample` = 默认输入 + 期望输出。
- **R2 首批题**:1 两数之和、283 移动零、3 无重复字符最长子串、53 最大子数组和、11 盛最多水的容器、15 三数之和(纯数组/字符串 I/O,JSON 友好)。
- **R3 站点**:`apps/docs`(VitePress)。首页/介绍(项目、算子、API)、LeetCode 分类目录、每题页(动态路由或生成脚本)含描述/Python/spec/在线运行器。sidebar 由数据生成。
- **R4 在线运行器**:Vue 组件 `<OnlineRunner>`,读取某题的 catalog+spec+可编辑输入 → `run()` → 展示 result/state/错误。
- **R5 部署**:`.github/workflows/deploy-docs.yml` 构建 VitePress 并部署 GitHub Pages;VitePress `base` 设为 `/function-render/`(项目页)。
- **R6 验证**:`leetcode` 包单测(每题 solution + spec 经 runner 得期望);站点 `vitepress build` 成功;浏览器手测一题在线运行;部署 workflow 合理。

## Acceptance Criteria

- [ ] AC1 `@function-renderer/leetcode` 首批题:每题 `solution(sample.input)` 与 `run(spec,{catalog, initialState})` 都得 `sample.expected`;单测绿。
- [ ] AC2 `vitepress build` 成功产出静态站(含介绍页 + 每题页)。
- [ ] AC3 浏览器打开某题页,改输入点运行,得到正确输出(录屏)。
- [ ] AC4 GitHub Pages workflow 存在且配置正确(build + upload-pages-artifact + deploy-pages;`base` 正确)。
- [ ] AC5 `vp check` 对新增 TS 源(leetcode 包 + 运行器组件)干净;全仓既有测试不回归。

## Out of Scope(本批)

- 全部 93 题(后续批次);链表/树类题(需序列化辅助,后续)。
- 站内搜索/多语言/评论等。

## Notes

- VitePress 用 Vue 生态,天然可嵌 Vue 运行器组件;它经 Vite+ core 构建(需 `vue`+`esbuild` 依赖)。
- 运行器在浏览器内执行 `@function-renderer/runner`(纯前端,无后端)。
