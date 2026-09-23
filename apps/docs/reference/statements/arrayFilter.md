# `arrayFilter`

> **层**：L4 · **组**：Data · **对应 JS**：Array.prototype.filter

绑定 itemKey 后求值 condition，保留为真的元素。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items` | Expr | 必填 | 求值后须为数组 |
| `itemKey` | string | 必填 | 当前元素 Slot |
| `condition` | Expr | 必填 | Boolean 判定 |


## 示例

```json
{
  "type": "arrayFilter",
  "params": {
    "items": "$.input.nums",
    "itemKey": "$.item",
    "condition": { "$gt": ["$.item", 0] }
  },
  "outputTo": "$.positives"
}
```


## 参见

- [`arrayMap`](/reference/statements/arrayMap)
- [`arrayReduce`](/reference/statements/arrayReduce)

- [语句总览](/reference/statements)
- [指南 · 索引集合](/guide/collections)
