# `arrayMap`

> **层**：L4 · **组**：Data · **对应 JS**：Array.prototype.map

对每个元素跑 body，收集返回值。默认 maxIter = length。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items` | Expr | 必填 | 求值后须为数组 |
| `itemKey` | string | 必填 | 当前元素 Slot |
| `body` | NodeSpec | 必填 | 映射子树；其结果入输出数组 |
| `maxIter` | number | 可选 | 默认 length；超长 → run 错 |


## 示例

```json
{
  "type": "arrayMap",
  "params": {
    "items": "$.input.nums",
    "itemKey": "$.item",
    "body": {
      "type": "expr",
      "params": { "value": { "$mul": ["$.item", 2] } }
    }
  },
  "outputTo": "$.doubled"
}
```


## 参见

- [`arrayFilter`](/reference/statements/arrayFilter)
- [`arrayReduce`](/reference/statements/arrayReduce)
- [`for`](/reference/statements/for)

- [语句总览](/reference/statements)
- [指南 · 索引集合](/guide/collections)
