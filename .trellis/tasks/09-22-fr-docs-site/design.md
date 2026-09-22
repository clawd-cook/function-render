# Design — fr-docs-site

## 包:`packages/leetcode`(`@logic-renderer/leetcode`)
- deps:`@logic-renderer/core`(类型)、`@logic-renderer/runner`(测试/运行)、`zod`。
- `src/problems/<slug>.ts`:每题一个模块,导出 `Problem`:
  ```ts
  interface Problem {
    num: number; title: string; slug: string; url: string;
    difficulty: "简单" | "中等"; category: string;
    description: string;        // 题目描述(markdown)
    python: string;             // 原 Python 解法
    solution: (input: any) => unknown;   // 移植的 TS 解法
    spec: Node;                 // logic-render 实现(调用注册函数)
    catalog: Catalog;           // 该题的 catalog(通常 { <slug>: solution })
    sample: { input: Record<string, unknown>; expected: unknown };
  }
  ```
- `src/index.ts`:`export const problems: Problem[]`、`export const categories`(按分类聚合)。
- spec 形态示例(two-sum):`{ call: "twoSum", args: { nums: {$state:"/nums"}, target: {$state:"/target"} }, out: "/result" }`,`sample.input = { nums:[2,7,11,15], target:9 }`,`expected=[0,1]`。
- 测试:遍历 `problems`,断言 `solution(sample.input)`==expected 且 `run(spec,{catalog,initialState:sample.input}).result`==expected。

## 站点:`apps/docs`(VitePress)
- `docs` 根 = `apps/docs`;`.vitepress/config.ts`:title/description、`base: "/logic-render/"`、nav、sidebar(介绍 + LeetCode 分类,由 leetcode 包数据生成)。
- 介绍页:`index.md`(首页 hero)、`guide/overview.md`、`guide/operators.md`、`guide/api.md`(概念/算子/API,摘自现有 README)。
- LeetCode:动态路由 `leetcode/[slug].md` + `leetcode/[slug].paths.js`(从 `@logic-renderer/leetcode` 的 `problems` 生成 params:title/num/url/difficulty/description/python/spec 字符串)。页面模板渲染这些字段 + `<OnlineRunner :slug="..."/>`。
- `.vitepress/theme/`:注册全局组件 `OnlineRunner`。
- `leetcode/index.md`:分类目录表(链接到各题页)。

## 运行器组件:`OnlineRunner.vue`
- props:`slug`。从 `@logic-renderer/leetcode` 按 slug 找到 Problem。
- UI:展示 spec(只读)、可编辑「输入(JSON)」(默认 `sample.input`)、Run 按钮、结果/错误面板。
- 逻辑:`run(problem.spec, { catalog: problem.catalog, initialState: JSON.parse(inputText) })` → 展示 `result`/`state`;`FunctionRenderError` → 错误面板。纯浏览器执行。

## 部署:GitHub Pages
- `.github/workflows/deploy-docs.yml`:on push main;job:checkout(含 submodule 可选不需要)、装 vp(`curl … | bash`)或 setup-node+pnpm、`vp install`、`vp run -r build`(建库)、`cd apps/docs && pnpm exec vitepress build`、`actions/upload-pages-artifact`(path `apps/docs/.vitepress/dist`)、`actions/deploy-pages`。permissions: pages write、id-token write。
- VitePress `base: "/logic-render/"`(仓库名 logic-render → 项目页 URL `https://clawd-cook.github.io/logic-render/`)。

## 集成注意(已验证)
- `apps/docs` devDeps 必须含 `vue` + `esbuild`(否则 Vite+ core 下 VitePress 构建失败)。
- 运行器组件 import `@logic-renderer/leetcode`(workspace),需先 `vp run -r build` 出 dist(库),VitePress 再构建(bundler 解析 dist)。CI 顺序同理。
- 遵循 `.trellis/spec/guides/viteplus-ts-package-conventions.md`。

## 分批扩展(后续)
- 加题 = 在 leetcode 包新增 `problems/<slug>.ts`,站点/ sidebar / 运行器自动带上(动态路由 + 数据驱动)。链表/树题另加序列化辅助(输入 JSON 数组 → 结构)。
