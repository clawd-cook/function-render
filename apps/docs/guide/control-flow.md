# 控制流与错误处理

> 对应 MDN：[Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)。
> 复杂度：**L0**（`then` / `if`）→ **L1**（`switch` / `tryCatch`）。

## `then` — 顺序（L0）

```json
{
  "type": "then",
  "params": {
    "nodes": [
      { "type": "set", "params": { "path": "$.a", "value": 1 } },
      { "type": "set", "params": { "path": "$.b", "value": 2 } }
    ]
  }
}
```

按数组顺序执行，返回最后一个节点的结果。类比 JS 语句块。

## `if` — 分支（L0）

```json
{
  "type": "if",
  "params": {
    "condition": { "$gt": ["$.totalAmount", 1000] },
    "trueBranch": { "type": "callFunc", "params": { "funcKey": "deductBalance", "args": {} } },
    "falseBranch": { "type": "log", "params": { "message": "skip", "level": "info" } }
  }
}
```

`Boolean(evaluate(condition))` 选枝；`falseBranch` 可选。

## `switch` — 多路匹配（L1）

```json
{
  "type": "switch",
  "params": {
    "input": "$.input.status",
    "cases": [
      { "match": "ok", "node": { "type": "constant", "params": { "value": 1 } } },
      { "match": "fail", "node": { "type": "constant", "params": { "value": 0 } } }
    ],
    "default": { "type": "constant", "params": { "value": -1 } }
  }
}
```

用 `Object.is(evaluate(input), match)` 比较；`match` 为**字面量**（不求值）。

## `tryCatch` — 捕获（L1）

```json
{
  "type": "tryCatch",
  "params": {
    "body": { "type": "assert", "params": { "condition": false, "message": "boom" } },
    "catch": { "type": "set", "params": { "path": "$.handled", "value": true } }
  }
}
```

- body 失败时写入 `$.error`，再走 `catch`；可选 `finally`。
- **validate**：`body` 内禁止目标 Func 为 `sideEffect: true` 的 `callFunc`（避免与全局 rollback 语义纠缠）。

完整参数表：[语句参考](/reference/statements)。循环见下一章。

下一章：[循环与迭代](/guide/loops)。
