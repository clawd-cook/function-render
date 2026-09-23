# `$gte`

> **层**：L3 · **组**：比较 · **签名**：`[any, any] → boolean`

大于等于。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$gte": <operand> }`

## 示例

```json
{ "$gte": ["$.a", 0] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
