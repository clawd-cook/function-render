# `$div`

> **层**：L3 · **组**：算术 · **签名**：`[number, number] → number`

a ÷ b；除零 → phase: "run"。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$div": <operand> }`

## 示例

```json
{ "$div": [10, 2] }
```

## 注意

- 除数为 0 → `FunctionRenderError` `phase: "run"`。

## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
