# `set`

> **层**：L0 · **组**：Data · **对应 JS**：赋值

将 value（Expr）写入 Slot。`$.input` 只读。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 必填 | 目标路径；不可写 `$.input…` |
| `value` | Expr | 必填 | 求值后写入 |


## 示例

```json
{
  "type": "set",
  "params": {
    "path": "$.tax",
    "value": { "$mul": ["$.input.orderAmount", 0.06] }
  }
}
```


## 参见

- [`get`](/reference/statements/get)
- [`callFunc`](/reference/statements/callFunc)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/grammar-and-types)
