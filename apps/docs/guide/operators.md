# 编排算子

spec 是一棵 JSON 树,每个节点形如 `{ "type", "params", "outputTo?" }`。

v1 交付:`then` / `if` / `set` / `callFunc`。其余 NodeType(如 `when` / `for` / `tryCatch`)属视界,尚未实现。

## `callFunc` — 调用业务 Func

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

## `then` — 串行

```json
{ "type": "then", "params": { "nodes": [NodeA, NodeB] } }
```

顺序执行,`result` 为最后一个子节点的结果;空数组 → `undefined`。

## `if` — 条件

```json
{
  "type": "if",
  "params": {
    "condition": { "$gt": ["$.input.score", 59] },
    "trueBranch": NodeA,
    "falseBranch": NodeB
  }
}
```

`Boolean(evaluate(condition))` 选枝;无 `falseBranch` 且条件假 → `undefined`。

## `set` — 写 Slot

```json
{
  "type": "set",
  "params": { "path": "$.tax", "value": { "$mul": ["$.input.orderAmount", 0.06] } }
}
```

写入并返回求值后的 `value`。`$.input` 只读。

## 错误

fail-fast。`FunctionRenderError.phase` 为 `validate` / `run` / `rollback`。副作用 Func 成功入栈后,后续失败会逆序调用 `rollback`。
