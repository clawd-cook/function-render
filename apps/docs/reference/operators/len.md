# `$len`

> **层**：L3 · **组**：一阶数据 · **签名**：`array | string → number`

长度。

## 操作数

- 元数：单个 Expr（string | array）
- 写法：单键对象 `{ "$len": <operand> }`

## 示例

```json
{ "$len": "$.input.nums" }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
