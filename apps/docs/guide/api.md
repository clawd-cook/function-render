# API

## `@logic-renderer/runner`

```ts
import { run } from "@logic-renderer/runner";

const { state, result } = await run(spec, { input, funcs, preview });
```

| 项 | 说明 |
|----|------|
| `run(spec, options)` | 先 `validate`，再 walk；返回 `{ state, result }` |
| `options.input` | 克隆进 `state.input`（`$.input` 只读） |
| `options.funcs` | 本次注入的 FuncRegistry（必填对象） |
| `options.preview` | 默认 `false`；为 `true` 时**永不** `Func.run`，跳过 `sleep` |
| 失败 | `FunctionRenderError`，`phase`: `validate` \| `run` \| `rollback` |

副作用：仅 `sideEffect: true` 且 `run` 已成功的 `callFunc` 入 rollback 栈；后续失败逆序调用 `rollback`。

## `@logic-renderer/core`

```ts
import {
  validate,
  evaluate,
  getSlot,
  setSlot,
  FunctionRenderError,
  NODE_TYPES,
  EXPR_ATOMS,
} from "@logic-renderer/core";
```

- `validate(spec, { funcs }) => FlowSpec`：结构 + 未知 type/atom/funcKey / 缺 `maxIter` / tryCatch body 副作用；**不执行** Func。
- `evaluate(expr, { state })`：ExprAtom + Slot 读。
- `getSlot` / `setSlot`：Slot `$.path`（`$.input` 只读）。
- `NODE_TYPES` / `EXPR_ATOMS`：当前引擎封闭集合（只读）。

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
- `standardCatalog`：字符串工具、`sort`、结算 `deductBalance`、以及部分 LeetCode 算法 Func；**不含**算术（用 ExprAtom）。
- `examples`：`math-pipeline` / `greeting` / `conditional` / `settlement` / `sum-for` / `parallel-when` / `status-switch` / `double-arrayMap`。

## ExprAtom（封闭）

- 算术：`$add` `$mul` `$sub` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round`
- 比较/逻辑：`$gt` `$gte` `$lt` `$lte` `$eq` `$neq` `$and` `$or` `$not`
- 一阶数据：`$len` `$at` `$concat` `$pick` `$omit` `$merge`
- 强制字面量：`$lit`
- Slot 读：字符串匹配 `/^\$\.[A-Za-z_][\w.]*$/`；其它字符串是字面量（中缀不算）

完整 NodeType 表见 [编排算子](/guide/operators)。

## LeetCode 协议

题解在 `apps/docs/data/problems.ts`，浏览器用 runner + `standardCatalog` 在线运行。见 [LeetCode](/leetcode/)。
