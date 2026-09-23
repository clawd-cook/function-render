# `$and`

> **层**：L3 · **组**：逻辑 · **签名**：`any[] → boolean`

全真为真（对各操作数 Boolean）。

## 操作数

- 元数：≥0
- 写法：单键对象 `{ "$and": <operand> }`

## 示例

```json
{ "$and": [{ "$gt": ["$.a", 0] }, { "$lt": ["$.a", 10] }] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
