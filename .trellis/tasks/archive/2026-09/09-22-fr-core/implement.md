# Implement — fr-core (`packages/core`)

基线:`. "$HOME/.config/vite-plus/env"`(交互 shell 已自动 source)。

## Step 0 — 脚手架 + 依赖
- [ ] 建 `packages/core`,照 `packages/utils` 拷 `package.json`/`tsconfig.json`/`vite.config.ts`;`name` 改 `@logic-renderer/core`。
- [ ] `pnpm-workspace.yaml` 的 `catalog:` 加 `zod: ^4.3.6`;`packages/core/package.json` 的 `dependencies` 写 `"zod": "catalog:"`。
- [ ] `vp install`;`src/index.ts` 空导出;`vp run -r build` 能识别新包。

## Step 1 — errors + types
- [ ] `src/errors.ts`:`FunctionRenderError`(见 design)。
- [ ] `src/types.ts`:`StateModel`/`RunContext`/`RunResult`/`FunctionDef`/`FnImpl`/`Catalog`。

## Step 2 — state
- [ ] `src/state.ts`:`parsePointer`/`getByPath`/`setByPath`。
- [ ] `tests/state.test.ts`:读/写/嵌套/数组下标/缺失创建(对象与数组)/`-` push/`~0`·`~1` 转义(AC1)。

## Step 3 — schema + 类型
- [ ] `src/schema.ts`:`isJsonPointer`、`DynamicValueSchema`/`ConditionSchema`/`NodeSchema`(`.strict()`、`z.lazy`)+ 导出 `DynamicValue`/`Condition`/`Node` 类型。

## Step 4 — expr
- [ ] `src/expr.ts`:`resolveArgs`/`evaluateCondition`。
- [ ] `tests/expr.test.ts`:嵌套 `$state`、字面量对象、各比较算子、`not`、`$and`/`$or`、隐式 AND、缺失路径(AC2)。

## Step 5 — validate
- [ ] `src/validate.ts`:`validate(specJson, fnNames?)`(zod safeParse → FunctionRenderError;可选函数名递归校验)。
- [ ] `tests/validate.test.ts`:合法通过;非法节点(同含 call+seq)/非法指针/缺 then/未知函数各抛错且含 path(AC3)。

## Step 6 — 导出 + 校验
- [ ] `src/index.ts` 汇出公共 API 与类型;`README.md` 简述。
- [ ] `packages/core`:`vp test` 绿、`vp check` 干净、`vp pack` 出 dts+exports(AC4)。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp install
vp run -r test        # 至少 core 测试绿
vp check              # 关注 packages/core 源码结果(全仓 check 会带出既有历史 md/json 问题)
vp run --filter @logic-renderer/core build   # 或 vp run -r build
```

## Rollback
- 纯新增 `packages/core`;回滚 = 删目录 + 撤销 `pnpm-workspace.yaml` 的 zod 行。
