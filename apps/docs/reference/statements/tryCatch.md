# `tryCatch`

> **层**：L1 · **组**：Control · **对应 JS**：try…catch…finally

body 失败时写入 $.error 并走 catch；可选 finally。body 内禁止 sideEffect callFunc。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `body` | NodeSpec | 必填 | 受保护子树 |
| `catch` | NodeSpec | 必填 | 失败后执行 |
| `finally` | NodeSpec | 可选 | 无论成败执行 |


## 示例

```json
{
  "type": "tryCatch",
  "params": {
    "body": { "type": "assert", "params": { "condition": false, "message": "boom" } },
    "catch": { "type": "set", "params": { "path": "$.handled", "value": true } }
  }
}
```

## 注意

- validate：body 内目标 Func 为 `sideEffect: true` 的 `callFunc` → `phase: "validate"`。
- catch / finally 可以使用 sideEffect callFunc。

## 参见

- [`assert`](/reference/statements/assert)
- [`callFunc`](/reference/statements/callFunc)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
