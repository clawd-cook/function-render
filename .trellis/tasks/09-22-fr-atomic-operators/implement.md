# Implement — fr-atomic-operators

## 阶段 1 — core 原子算子
- [ ] `packages/core/src/expr.ts`:重写为 `evaluate(expr,ctx)`(算子见 design A);`resolveArgs`=对 args 逐值 evaluate;`evaluateCondition`=Boolean(evaluate)。旧 `{$state,cmp}` 兼容。
- [ ] `packages/core/src/schema.ts`:`ValueSchema`(宽松);`Node` 的 args/if/switch/for 用 `ValueSchema`;导出 `Value`。
- [ ] `packages/core/src/index.ts`:导出 `evaluate`、`Value`。
- [ ] `packages/core/tests/expr.test.ts`:补原子算子(算术/比较/逻辑/集合/$if 惰性/错误)+ 旧条件兼容。
- [ ] `vp run --filter @function-renderer/core test` 绿;`vp check packages/core` 干净。

## 阶段 2 — runner + catalog
- [ ] `packages/runner/src/engine.ts`:if/switch/for 用 `evaluate`;call 用 `resolveArgs`(已含算子)。
- [ ] runner 现有测试不回归(条件兼容)。
- [ ] `packages/catalog`:`standardCatalog` 增复杂算子 `sort`(+ 单测)。
- [ ] `vp run -r test` 全绿。

## 阶段 3 — 文档协议化(移除 leetcode 包)
- [ ] 删除 `packages/leetcode`。
- [ ] `apps/docs/data/problems.ts`:首批题(two-sum/move-zeroes/maximum-subarray 纯协议 + 一个用 sort 的示例),含 spec/input/expected/metadata。
- [ ] `apps/docs` 依赖:去掉 leetcode,加 `@function-renderer/catalog`。
- [ ] `ProblemView.vue`/`OnlineRunner.vue`:展示可编辑协议 JSON + 输入 + 运行(catalog=standardCatalog)。
- [ ] `.vitepress/config.ts` / `leetcode/index` / `[slug].paths.ts` / `LeetcodeIndex.vue`:改读 `data/problems.ts`。
- [ ] `vitepress build` 通过;`vp check apps/docs` 干净。

## 阶段 4 — 验证 + 提交
- [ ] `vp run -r test` / `vp run -r build` / `vitepress build` 全绿。
- [ ] 浏览器:docs dev 打开 two-sum,协议可见可改,点击运行得正确结果(录屏)。
- [ ] 分阶段提交(core / runner+catalog / docs),push,开 PR(base main)。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp run -r build && vp run -r test
vp check packages/core packages/runner packages/catalog apps/docs
cd apps/docs && pnpm exec vitepress build
```
