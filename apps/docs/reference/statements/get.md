# `get`

> **层**：L0 · **组**：Data · **对应 JS**：读变量

读取 Slot 路径的值并作为节点结果返回。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 必填 | 如 `$.tax` |


## 示例

```json
{
  "type": "get",
  "params": { "path": "$.tax" }
}
```


## 参见

- [`set`](/reference/statements/set)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/grammar-and-types)
