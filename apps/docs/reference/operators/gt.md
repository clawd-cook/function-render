# `$gt`

> **层**：L0 · **组**：比较 · **签名**：`[any, any] → boolean`

大于（数值比较）。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$gt": <operand> }`

## 示例

```json
{ "$gt": ["$.totalAmount", 1000] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
