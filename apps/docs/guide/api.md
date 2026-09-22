# API

## `@function-renderer/runner`

```ts
import { run } from "@function-renderer/runner";

const { state, result } = await run(spec, { catalog, initialState });
```

- `run(spec, { catalog, initialState? }) => Promise<{ state, result }>`:先用 core 校验 spec(含未知函数检查),再执行。
- `catalog`:`Record<string, Fn | { params?, run }>`。裸函数不校验参数;带 `params`(zod)则调用前校验。

## `@function-renderer/catalog`

```ts
import {
  defineFunction,
  defineCatalog,
  standardCatalog,
  examples,
} from "@function-renderer/catalog";
```

- `defineFunction({ params, run })`:`run` 的 `args` 类型由 zod schema 推导。
- `standardCatalog`:`add/sub/mul/div`、`concat/upper/lower/length`、`delay`、`now`。
- `examples`:`math-pipeline` / `greeting` / `conditional` / `parallel-demo` / `switch-demo` / `for-demo`。

## `@function-renderer/core`

```ts
import {
  validate,
  resolveArgs,
  evaluateCondition,
  getByPath,
  setByPath,
  FunctionRenderError,
} from "@function-renderer/core";
```

- `validate(specJson, fnNames?) => Node`:结构校验 + 未知函数检查,失败抛 `FunctionRenderError`。
- `resolveArgs(value, ctx)` / `evaluateCondition(cond, ctx)`:表达式求值。
- `getByPath` / `setByPath`:JSON Pointer 读写共享 state。
- `FunctionRenderError`:`{ kind: "validation" | "call", path, fnName?, cause? }`。

## `@function-renderer/leetcode`

```ts
import { problems, getProblem, categories } from "@function-renderer/leetcode";

const p = getProblem("two-sum")!;
const { result } = await run(p.spec, { catalog: p.catalog, initialState: p.sample.input });
```

每个 `Problem` 含 `num/title/slug/url/difficulty/category/description/python/solution/spec/catalog/sample`。
