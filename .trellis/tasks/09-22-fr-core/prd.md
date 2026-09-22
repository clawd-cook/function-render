# fr-core — `@function-renderer/core`(解析层)

> 父任务:`../09-22-function-renderer`(总纲/共享契约见父 `prd.md`/`design.md`)。本子任务交付**解析层库**,无前置依赖。

## Goal

实现 `packages/core`:函数渲染器的**纯逻辑解析层**。提供类型 + zod schema、spec 解析/校验、参数与条件表达式求值、JSON Pointer 共享状态、错误类型。**不含执行(runner)、不含函数目录实现(catalog)、不含 UI。** 作为 runner/catalog/apps 的共享基座。

借鉴 `submodules/json-render/packages/core/src` 的 `state-store.ts`/`types.ts`(JSON Pointer)、`visibility.ts`(条件),仅参考语义、自实现最小子集,不依赖 `@json-render/core`。

## Confirmed Facts

- 包名 `@function-renderer/core`,目录 `packages/core`,ESM,`vp pack` 打包 / `vp test` 测试(照 `packages/utils`)。
- 运行时依赖:`zod`(经仓库 `catalog:` 加 `zod: ^4.3.6`)。
- 输入 = JSON 编排树;数据模型 = 单一共享 state + JSON Pointer;表达式 MVP = `$state`(值)+ 条件(`$state`+比较/`$and`/`$or`/隐式 AND)。

## Requirements

- **R1 类型/Schema(schema.ts + types.ts)**:用 zod(`z.lazy` 递归)定义 `DynamicValueSchema`/`ConditionSchema`/`NodeSchema`,并 `export type DynamicValue/Condition/Node = z.infer<...>`;另导出 `StateModel`、`Catalog`、`FunctionDef<S extends z.ZodType>`、`FnImpl`、`RunContext`、`RunResult` 等共享类型(实现在 runner/catalog,但类型基座在 core)。
- **R2 State(state.ts)**:`parsePointer` / `getByPath(state, ptr)` / `setByPath(state, ptr, value)`(就地可变;缺失路径按下一段是否数字创建 `[]`/`{}`;`-` push;`~0`/`~1` 反转义)。
- **R3 表达式(expr.ts)**:`resolveArgs(value, ctx)`(递归;仅 `{$state}` 视为表达式,其余字面量/递归);`evaluateCondition(cond, ctx)`(`boolean` / `$state`+`eq/neq/gt/gte/lt/lte/not` / 数组隐式 AND / `$and` / `$or`)。`ctx` 至少提供 `get(ptr)`。
- **R4 校验(validate.ts)**:`validate(specJson, fnNames?) → Node`:`NodeSchema.parse` 结构校验(zod issue → `FunctionRenderError(kind="validation", path, message)`)+ 若给 `fnNames` 则递归校验 `call` 名存在(`unknown_function`)。
- **R5 错误(errors.ts)**:`FunctionRenderError extends Error { kind:"validation"|"call"; path:string; fnName?:string; cause? }`。
- **R6 导出(index.ts)**:上述公共 API 与类型统一导出。
- **R7 测试**:Vitest 覆盖 state 读写/缺失创建/数组、`$state` 与各条件算子、`validate` 的通过与各类失败(非法节点/非法指针/缺 then/未知函数)。

## Acceptance Criteria

- [ ] AC1 `getByPath`/`setByPath` 通过:读写、嵌套、数组下标、缺失路径创建、`-` push、`~0/~1` 转义。
- [ ] AC2 `resolveArgs` 正确解析嵌套 `$state` 与字面量;`evaluateCondition` 覆盖全部算子(含 `not`/`$and`/`$or`/隐式 AND/缺失路径)。
- [ ] AC3 `validate` 对合法 spec 返回 `Node`;对非法结构/指针/缺 `then`/未知函数抛 `FunctionRenderError(kind="validation")` 且含可读 `path`/`message`。
- [ ] AC4 `packages/core` 的 `vp test` 全绿;`vp check` 对该包源码无 lint/类型错误;`vp pack` 能出 dts+exports。

## Out of Scope

- 执行引擎(`run`/engine)→ `fr-runner`。
- `defineCatalog` 实现与标准函数 → `fr-catalog`(core 仅出类型基座)。
- `$computed`/`$template`/`$cond`(值表达式)、`switch`/`for`/`retry`、EL 字符串 → 后续增强。

## Notes

- 依赖:无前置子任务。产物被 `fr-runner`/`fr-catalog`/apps 消费,故 API 命名/导出需稳定。
