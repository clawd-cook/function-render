# API

## `@logic-renderer/runner`

```ts
import { run } from "@logic-renderer/runner";

const { state, result } = await run(spec, { input, funcs, preview });
```

- `run(spec, { input, funcs, preview? }) => Promise<{ state, result }>`:先 `validate`,再 walk。
- `preview: true`:**永不**调用任何 `Func.run`(安全保证)。
- `funcs`:`Record<string, Fn | { params?, run, sideEffect?, rollback? }>`。

## `@logic-renderer/catalog`

```ts
import {
  defineFunction,
  defineCatalog,
  standardCatalog,
  examples,
} from "@logic-renderer/catalog";
```

- `defineFunction({ params, run, sideEffect?, rollback? })`。
- `standardCatalog`:字符串/`sort`/结算 `deductBalance` 等;**不含** `add`/`mul`(算术是 ExprAtom)。
- `examples`:`math-pipeline` / `greeting` / `conditional` / `settlement`。

## `@logic-renderer/core`

```ts
import {
  validate,
  evaluate,
  getSlot,
  setSlot,
  FunctionRenderError,
} from "@logic-renderer/core";
```

- `validate(spec, { funcs }) => FlowSpec`:结构 + 未知 type/atom/funcKey;不执行 Func。
- `evaluate(expr, { state })`:ExprAtom + Slot 读。
- `getSlot` / `setSlot`:Slot `$.path` 读写(`$.input` 只读)。
- `FunctionRenderError`:`{ phase: "validate" | "run" | "rollback", path, funcKey?, cause? }`。

## 原子计算(ExprAtom,v1)

- 算术:`$add` `$mul`
- 比较:`$gt`
- 强制字面量:`$lit`
- Slot 读:字符串 `$.path`(其它字符串是字面量,中缀不算)

## LeetCode 协议

题解协议在 `apps/docs/data/problems.ts`,浏览器用 runner + catalog 在线运行。见 [LeetCode](/leetcode/)。
