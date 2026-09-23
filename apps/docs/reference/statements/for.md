# `for`

> **层**：L2 · **组**：Control · **对应 JS**：for…of

遍历数组；绑定 itemKey（及可选 indexKey），body 后恢复。超 maxIter → run 错。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items` | Expr | 必填 | 求值后须为数组 |
| `itemKey` | string | 必填 | 当前元素 Slot 路径 |
| `indexKey` | string | 可选 | 当前下标 Slot 路径 |
| `body` | NodeSpec | 必填 | 循环体 |
| `maxIter` | number | 必填 | 硬顶 |


## 示例

```json
{
  "type": "for",
  "params": {
    "items": "$.input.nums",
    "itemKey": "$.item",
    "indexKey": "$.idx",
    "body": {
      "type": "set",
      "params": { "path": "$.sum", "value": { "$add": ["$.sum", "$.item"] } }
    },
    "maxIter": 1000
  }
}
```


## 参见

- [`while`](/reference/statements/while)
- [`arrayMap`](/reference/statements/arrayMap)
- [`arrayReduce`](/reference/statements/arrayReduce)

- [语句总览](/reference/statements)
- [指南 · 循环与迭代](/guide/loops)
