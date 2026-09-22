# Implement — fr-runner (`packages/runner`)

## Step 0 — 脚手架
- [ ] 建 `packages/runner`,照 core 拷配置;`name` = `@logic-renderer/runner`。
- [ ] `package.json`:`dependencies` = `{ "@logic-renderer/core": "workspace:*" }`;`devDependencies` 加 `"zod": "catalog:"`(测试定义 params 用)。
- [ ] `vp install`。

## Step 1 — engine
- [ ] `src/engine.ts`:`normalizeCatalog` / `run` / `exec`(见 design)。
- [ ] `src/index.ts`:`export { run }`、`export type { RunOptions }`,并从 core 透出常用类型(可选)。

## Step 2 — 测试
- [ ] `tests/engine.test.ts`:
  - happy:`add`(async)+ `$state` 参数 + `out` 写回,断言 `{state,result}`(AC1)。
  - `seq` 末项 / `parallel` 数组(可用并发计时或直接断言数组)/ `if` 命中与未命中(无 else→undefined)/ 嵌套(AC2)。
  - fail-fast:抛错函数 → `FunctionRenderError(kind="call", path, fnName, cause)`;`parallel` 一分支抛 → 整体 reject(AC3)。
  - params:`z.object({a:z.number()})` 收到非法 → `FunctionRenderError(kind="validation")`(AC4)。

## Step 3 — 校验
- [ ] `vp run -r build`(先建 core 再建 runner);`vp run --filter @logic-renderer/runner test` 绿;`vp check packages/runner` 干净(必要时 `vp check --fix`)(AC5)。

## Step 4 — 提交
- [ ] 提交 `packages/runner` + lockfile;push;更新 PR #1。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp install
vp run -r build
vp run --filter @logic-renderer/runner test
vp check packages/runner
```

## Rollback
- 纯新增 `packages/runner`;回滚 = 删目录。
