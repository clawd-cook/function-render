# 编排算子

spec 是一棵 JSON 树,每个节点形如 `{ "type", "params", "outputTo?" }`。

当前引擎封闭 NodeType(v1 + 视界):`then` / `when` / `if` / `switch` / `while` / `for` / `tryCatch` / `callFunc` / `get` / `set` / `arrayMap` / `arrayFilter` / `arrayReduce` / `log` / `assert` / `sleep` / `constant` / `expr`。项目只能注入 `funcs`,不能 `registerOperator`。

## Control

| type | 要点 |
|------|------|
| `then` | `nodes` 顺序执行,返回最后结果 |
| `when` | 并行;`waitAll` 默认 true;`failStrategy` 默认 `fastFail` |
| `if` | `Boolean(evaluate(condition))` 选枝 |
| `switch` | `Object.is(evaluate(input), match)`;`match` 为字面量 |
| `while` | 每轮先判条件;**必须** `maxIter` |
| `for` | `items` 必须是数组;`itemKey` 绑定后恢复;超 `maxIter` → run 错 |
| `tryCatch` | body 失败写 `$.error` 并走 catch;`body` 内禁止 `sideEffect` callFunc |

## Invocation

### `callFunc` — 调用业务 Func

```json
{
  "type": "callFunc",
  "params": {
    "funcKey": "deductBalance",
    "args": { "merchantId": "$.input.merchantId", "amount": "$.totalAmount" }
  },
  "outputTo": "$.receipt"
}
```

- `args`:各值是 Expr(可含 Slot 读与 ExprAtom)。
- `outputTo`(可选):把返回值写入 Slot。
- `preview: true` 时求值并校验 schema,但**永不**调用 `Func.run`。

## Data

| type | 要点 |
|------|------|
| `get` | 读 Slot |
| `set` | 写 Slot;`$.input` 只读 |
| `arrayMap` | 对每个元素跑 body,收集返回值;默认 `maxIter = length` |
| `arrayFilter` | 绑定 `itemKey` 后求值 `condition` |
| `arrayReduce` | `init` + `accumKey` / `itemKey` 绑定与恢复 |

## Utility

| type | 要点 |
|------|------|
| `log` | 写内部 sink(测试可注入);不自动进 `run` 返回值 |
| `assert` | 条件假 → run 错 |
| `sleep` | `ms ≥ 0`;`preview` 跳过 |
| `constant` | 返回字面量(不求值) |
| `expr` | 求值一张 Expr |

## ExprAtom

| 组 | 原子 |
|----|------|
| 算术 | `$add` `$mul` `$sub` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round` |
| 比较/逻辑 | `$gt` `$gte` `$lt` `$lte` `$eq` `$neq` `$and` `$or` `$not` |
| 一阶数据 | `$len` `$at` `$concat` `$pick` `$omit` `$merge` |
| 字面量 | `$lit` |

字符串匹配 `/^\$\.[A-Za-z_][\w.]*$/` 才是 Slot 读;中缀如 `"$.a + 1"` 是普通字符串。`$div` 除零 → `phase: "run"`。`$map` 永不进 Expr,用 `arrayMap`。

## 错误

fail-fast。`FunctionRenderError.phase` 为 `validate` / `run` / `rollback`。副作用 Func 成功入栈后,后续失败会逆序调用 `rollback`。
