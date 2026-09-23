# `$eq`

> **层**：L3 · **组**：比较 · **签名**：`[any, any] → boolean`

深度相等（JSON.stringify 回退；优先 Object.is）。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$eq": <operand> }`

## 示例

```json
{ "$eq": ["$.status", "ok"] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
