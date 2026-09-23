# `$pick`

> **层**：L3 · **组**：一阶数据 · **签名**：`[object, string[]] → object`

挑选字段。

## 操作数

- 元数：恰好 2
- 写法：单键对象 `{ "$pick": <operand> }`

## 示例

```json
{ "$pick": ["$.input", ["id", "name"]] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
