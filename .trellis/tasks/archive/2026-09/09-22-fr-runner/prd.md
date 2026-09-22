# fr-runner — `@logic-renderer/runner`(执行层)

> 父任务:`../09-22-logic-renderer`。依赖 `fr-core`(已完成)。

## Goal

实现 `packages/runner`:接收 JSON spec + catalog + 初始 state,按 `core` 的语义执行编排并产出结果。依赖 `@logic-renderer/core` 的类型/校验/表达式/state。

## Requirements

- **R1** `run(spec, { catalog, initialState? }): Promise<RunResult>`:内部 `core.validate(spec, catalogNames)`(未知函数即报错);`structuredClone` 初始 state;构造 `RunContext{ get,set,state }`;递归执行;返回 `{ state, result }`。
- **R2 节点语义**:`call`(`resolveArgs`→(有 `params` 则 `params.safeParse`,失败抛 `validation`)→`run(args,ctx)`→可选 `out` 写回→返回值);`seq`(串行,返回末项;空→`undefined`);`parallel`(`Promise.all`,返回数组);`if`(`evaluateCondition` 选 `then`/`else`,未命中且无 `else`→`undefined`)。
- **R3 catalog 归一化**:接受 `FnImpl` 或 `{ params?, run }`,统一为 `{ params?, run }`。
- **R4 错误 fail-fast**:函数抛错包成 `FunctionRenderError(kind="call", path, fnName, cause)`(已是 `FunctionRenderError` 则透传);`parallel` 任一分支失败即整体失败。参数校验失败为 `kind="validation"`。
- **R5 测试**:Vitest 覆盖四节点 + 嵌套 + async + `out` 写回 + fail-fast + parallel 失败 + params 校验失败。

## Acceptance Criteria

- [ ] AC1 happy path:async 函数 + `$state` 参数 + `out` 写回,`{state,result}` 正确。
- [ ] AC2 四节点语义 + 嵌套组合正确(`seq` 末项 / `parallel` 数组 / `if` 命中与否)。
- [ ] AC3 fail-fast:函数抛错 → `FunctionRenderError(kind="call")` 含 path/fnName/cause 且中止;`parallel` 一分支失败即整体失败。
- [ ] AC4 有 `params` 的函数收到非法参数 → `FunctionRenderError(kind="validation")`。
- [ ] AC5 `vp run --filter @logic-renderer/runner test` 绿;`vp check packages/runner` 干净;`vp pack` 出 dist。

## Out of Scope

- `defineCatalog` 与标准函数(→ `fr-catalog`);UI/服务(→ apps)。
- `switch`/`for`/`retry`、节点级 `onError`(后续增强)。

## Notes

- 依赖 `@logic-renderer/core`(`workspace:*`)。消费其 `dist`,故需先 `vp run -r build` 构建 core(已构建)。
