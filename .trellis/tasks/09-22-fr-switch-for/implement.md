# Implement — fr-switch-for

## Step 1 — core
- [ ] `packages/core/src/schema.ts`:`Node` 类型 + `NodeSchema` 增 `switch`/`for` 两变体。
- [ ] `packages/core/src/validate.ts`:`checkCalls` 递归 `cases`/`default`/`body`。
- [ ] core 测试:`schema`/`validate` 合法 + 非法用例。

## Step 2 — runner
- [ ] `packages/runner/src/engine.ts`:`exec` 处理 `switch`/`for`(见 design)。
- [ ] runner 测试:switch(命中/默认/无默认)、for(数组/数字/as/indexAs/顺序收集/嵌套/fail-fast)。

## Step 3 — catalog
- [ ] `packages/catalog/src/examples.ts`:加 `switch-demo`、`for-demo`。
- [ ] catalog 测试:两示例经 runner 跑通(14 / [10,20,30])。

## Step 4 — 校验 + 演示
- [ ] `vp run -r build`;`vp run -r test` 全绿;新增代码 `vp check` 干净。
- [ ] node-service:`curl POST /run {example:"for-demo"}` → [10,20,30];react 或 vue 浏览器跑 `switch-demo`。

## Step 5 — 提交
- [ ] 按 core / runner / catalog 分提交;push;开新 PR(base main)。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp run -r build && vp run -r test
vp check packages/core packages/runner packages/catalog
```
