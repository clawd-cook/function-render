# 索引集合

> 对应 MDN：[Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections)。
> 复杂度：**L4**。类比 `Array.prototype.map` / `filter` / `reduce`，但是**节点树**形式的高阶算子。

## `arrayMap`

对每个元素跑 `body`，收集返回值。默认 `maxIter = length`。

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

## `arrayFilter`

绑定 `itemKey` 后求值 `condition`，保留为真的元素。

## `arrayReduce`

`init` + `accumKey` / `itemKey` 绑定与恢复；`body` 返回新的累加值。

## 与 `for` 的选择

| | `for` | `arrayMap` 等 |
| --- | --- | --- |
| 心智 | 命令式循环 | 声明式变换 |
| 典型用途 | 累加副作用、复杂控制 | 纯映射 / 过滤 / 折叠 |
| 复杂度层 | L2 | L4 |

一阶字段运算（`$len` / `$at` / `$pick`…）仍在 [表达式](/guide/expressions)，不做 NodeType。

并发与工具节点见 [语句参考](/reference/statements) 的 Utility / `when`；API 见 [API](/reference/api)。
