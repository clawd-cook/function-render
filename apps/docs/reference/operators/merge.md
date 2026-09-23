# `$merge`

> **层**：L3 · **组**：一阶数据 · **签名**：`object[] → object`

浅合并对象（后者覆盖前者）。

## 操作数

- 元数：≥0
- 写法：单键对象 `{ "$merge": <operand> }`

## 示例

```json
{ "$merge": [{ "a": 1 }, { "b": 2 }] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
