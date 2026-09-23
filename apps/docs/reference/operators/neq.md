# `$neq`

> **层**：L3 · **组**：比较 · **签名**：`[any, any] → boolean`

不等（`$eq` 的否定）。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$neq": <operand> }`

## 示例

```json
{ "$neq": ["$.a", "$.b"] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
