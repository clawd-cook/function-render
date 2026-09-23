# `arrayReduce`

> **层**：L4 · **组**：Data · **对应 JS**：Array.prototype.reduce

init + accumKey / itemKey 绑定；body 返回新累加值。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items` | Expr | 必填 | 求值后须为数组 |
| `itemKey` | string | 必填 | 当前元素 Slot |
| `accumKey` | string | 必填 | 累加器 Slot |
| `init` | Expr | 必填 | 初始累加值 |
| `body` | NodeSpec | 必填 | 返回下一累加值 |
| `maxIter` | number | 可选 | 默认 length |


## 示例

```json
{
  "type": "arrayReduce",
  "params": {
    "items": "$.input.nums",
    "itemKey": "$.item",
    "accumKey": "$.acc",
    "init": 0,
    "body": {
      "type": "expr",
      "params": { "value": { "$add": ["$.acc", "$.item"] } }
    }
  },
  "outputTo": "$.sum"
}
```


## 参见

- [`arrayMap`](/reference/statements/arrayMap)
- [`for`](/reference/statements/for)

- [语句总览](/reference/statements)
- [指南 · 索引集合](/guide/collections)
