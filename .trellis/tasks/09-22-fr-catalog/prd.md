# fr-catalog — `@logic-renderer/catalog`

> 父任务:`../09-22-logic-renderer`。依赖 `fr-core`。测试依赖 `fr-runner`(devDep)。

## Goal

实现 `packages/catalog`:函数目录工具 + 一组标准函数 + 共享示例 spec。供三个平级 app(node-service/react/vue)复用**同一份** catalog 与示例,保证三端行为一致。

## Requirements

- **R1 `defineFunction(def)`**:`{ params: ZodType, run(args, ctx) }` → 返回 `FunctionDef<S>`,让 `run` 的 `args` 由 `z.infer<params>` 推导(解决裸 `Catalog` 丢失参数类型的问题)。
- **R2 `defineCatalog(catalog)`**:恒等封装,保留字面量类型(键名自动补全),接受 `FnImpl` 或 `FunctionDef` 条目。
- **R3 标准函数 `standardCatalog`**:数学(`add`/`sub`/`mul`/`div`)、字符串(`concat`/`upper`/`lower`/`length`)、异步(`delay`)、`now`;均带 zod `params`。`satisfies Catalog`。
- **R4 示例 `examples`**:命名示例 `{ description, spec, initialState? }`,覆盖 `seq`/`parallel`/`if` 与 `$state`/`out`,均只用 `standardCatalog` 中的函数。
- **R5 测试**:用 `@logic-renderer/runner` 跑通每个示例并断言结果;校验 `standardCatalog` 各函数;`defineFunction` 的参数类型推导(编译期即验证)。

## Acceptance Criteria

- [ ] AC1 `defineFunction` 下 `run` 的 `args` 被正确推导(无需手动断言)。
- [ ] AC2 `standardCatalog` 各函数行为正确(含 async `delay`)。
- [ ] AC3 每个 `examples` 用 runner 跑通得到预期 `result`/`state`。
- [ ] AC4 `vp run --filter @logic-renderer/catalog test` 绿;`vp check packages/catalog` 干净;`vp pack` 出 dist。

## Out of Scope

- HTTP/UI(→ apps);节点级 `onError`、循环算子(后续)。

## Notes

- 运行时依赖:`@logic-renderer/core`(类型)+ `zod`(params)。测试用 `@logic-renderer/runner`(devDep)。
