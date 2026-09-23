# `expr`

> **层**：L5 · **组**：Utility · **对应 JS**：求值表达式语句

对 params.value 做 Expr 求值并作为节点结果。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `value` | Expr | 必填 | 可含 Slot 与 ExprAtom |


## 示例

```json
{
  "type": "expr",
  "params": { "value": { "$add": ["$.a", "$.b"] } },
  "outputTo": "$.sum"
}
```


## 参见

- [`set`](/reference/statements/set)
- [`constant`](/reference/statements/constant)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
