# Implement — fr-docs-site

## Step 1 — leetcode 包
- [ ] `packages/leetcode`:package.json(deps core/runner/zod)、tsconfig/vite.config 照 core。
- [ ] `src/types.ts`:`Problem` 接口。`src/problems/<slug>.ts` 首批 6 题(1/283/3/53/11/15),移植自源 Python。
- [ ] `src/index.ts`:`problems`、`categories`。
- [ ] `tests/problems.test.ts`:遍历断言 solution & run(spec) == expected。

## Step 2 — VitePress 站点
- [ ] `apps/docs` devDeps 加 `vue`+`esbuild`(已加)。
- [ ] `.vitepress/config.ts`:base `/function-render/`、nav、sidebar(数据驱动)。
- [ ] 介绍页:`index.md`(hero)、`guide/overview.md`、`guide/operators.md`、`guide/api.md`。
- [ ] `leetcode/index.md`(分类目录)、`leetcode/[slug].md` + `[slug].paths.js`(从 problems 生成)。
- [ ] `.vitepress/theme/index.ts` 注册全局 `OnlineRunner`;`OnlineRunner.vue`。

## Step 3 — 部署
- [ ] `.github/workflows/deploy-docs.yml`:build 库 + vitepress build + upload-pages-artifact + deploy-pages;permissions pages/id-token。

## Step 4 — 验证
- [ ] `vp run -r build`(库)→ `cd apps/docs && pnpm exec vitepress build` 成功。
- [ ] `vp check packages/leetcode`(+ 运行器 TS)干净;`vp run -r test` 不回归 + leetcode 测试绿。
- [ ] 浏览器:`vitepress dev`,打开一题页,改输入运行,核对输出(录屏)。

## Step 5 — 提交
- [ ] 分逻辑提交(leetcode 包 / docs 站 / deploy workflow);push;开 PR(base main)。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp install && vp run -r build
vp run --filter @function-renderer/leetcode test
cd apps/docs && pnpm exec vitepress build
```
