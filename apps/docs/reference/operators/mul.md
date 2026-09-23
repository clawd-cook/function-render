# `$mul`

> **层**：L0 · **组**：算术 · **签名**：`number[] → number`

多目乘法，从 1 累乘。

## 操作数

- 元数：≥0 个 number
- 写法：单键对象 `{ "$mul": <operand> }`

## 示例

```json
{ "$mul": ["$.input.orderAmount", 0.06] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
