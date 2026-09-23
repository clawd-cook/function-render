# `$lit`

> **层**：L0 · **组**：字面量 · **签名**：`any → any`

强制字面量：操作数**不**再做 Slot / Expr 求值。

## 操作数

- 元数：任意
- 写法：单键对象 `{ "$lit": <operand> }`

## 示例

```json
{ "$lit": "$.not.a.slot" }
```

## 注意

- 用于需要字面量字符串恰好长得像 `$.path` 的场景。

## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
