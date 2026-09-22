# Implement — fr-catalog (`packages/catalog`)

## Step 0 — 脚手架
- [ ] 建 `packages/catalog`,照 core 拷配置;`name` = `@logic-renderer/catalog`。
- [ ] `dependencies`:`@logic-renderer/core` `workspace:*`、`zod` `catalog:`;`devDependencies` 加 `@logic-renderer/runner` `workspace:*`(测试)+ 标准 devDeps。
- [ ] `vp install`。

## Step 1 — define / functions / examples
- [ ] `src/define.ts`:`defineFunction` / `defineCatalog`。
- [ ] `src/functions.ts`:`standardCatalog`(std lib,zod params,`satisfies Catalog`)。
- [ ] `src/examples.ts`:`examples`(`satisfies Record<string, ExampleSpec>`;文件级 `oxlint-disable unicorn/no-thenable`)。
- [ ] `src/index.ts`:汇出 `defineFunction`/`defineCatalog`/`standardCatalog`/`examples`/`ExampleSpec`。

## Step 2 — 测试
- [ ] `tests/functions.test.ts`:std 函数逐一断言(含 async `delay`);`defineFunction` 推导。
- [ ] `tests/examples.test.ts`:用 `@logic-renderer/runner` 跑每个示例,断言 `result`/`state`(AC3)。

## Step 3 — 校验
- [ ] `vp run -r build`;`vp run --filter @logic-renderer/catalog test` 绿;`vp check packages/catalog` 干净(必要时 `--fix`)(AC4)。

## Step 4 — 提交
- [ ] 提交 `packages/catalog` + lockfile;push;更新 PR #1。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp install && vp run -r build
vp run --filter @logic-renderer/catalog test
vp check packages/catalog
```
