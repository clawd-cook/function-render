# `constant`

> **层**：L5 · **组**：Utility · **对应 JS**：字面量返回

直接返回 value，**不**作为 Expr 求值。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `value` | unknown | 必填 | 原样返回 |


## 示例

```json
{
  "type": "constant",
  "params": { "value": { "ok": true } }
}
```


## 参见

- [`expr`](/reference/statements/expr)
- [`set`](/reference/statements/set)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
