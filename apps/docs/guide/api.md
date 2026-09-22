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

## 原子计算算子(值表达式)

`args`、`if`/`switch`/`for` 的判别、`set` 的值都是**值表达式**,由 `evaluate` 求值,支持:

- 读取:`{ "$state": "/ptr" }`
- 算术:`$add` `$sub` `$mul` `$div` `$mod` `$neg`
- 比较:`$eq` `$ne` `$lt` `$le` `$gt` `$ge`
- 逻辑:`$and` `$or` `$not`
- 集合:`$len` `$at` `$slice` `$concat` `$push`
- 其它:`$min` `$max` `$if`(三元,惰性)

配合 `set` 赋值节点与 `for`/`if`,简单算法(如两数之和)可**完全用协议表达**,无需专门的解法函数;排序/哈希等复杂算子仍登记在 catalog 里用 `call` 调用。

## LeetCode 协议

LeetCode 题解不再单独成包,而是作为**协议**直接放在文档站(`apps/docs/data/problems.ts`),在浏览器用 `@function-renderer/runner` + `@function-renderer/catalog` 在线运行。见 [LeetCode](/leetcode/)。
