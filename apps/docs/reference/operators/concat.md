# `$concat`

> **层**：L3 · **组**：一阶数据 · **签名**：`(array | string)[] → array | string`

拼接数组或字符串。

## 操作数

- 元数：≥0
- 写法：单键对象 `{ "$concat": <operand> }`

## 示例

```json
{ "$concat": [["a"], ["b"]] }
```


## 参见

- [运算符总览](/reference/operators)
- [指南 · 表达式与运算符](/guide/expressions)
