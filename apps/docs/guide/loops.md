# 循环与迭代

> 对应 MDN：[Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)。
> 复杂度：**L2**。有界迭代是硬约束——故意放弃无界图灵完备，换取必然停机。

## `while`（L2）

```json
{
  "type": "while",
  "params": {
    "condition": { "$lt": ["$.i", 10] },
    "body": {
      "type": "set",
      "params": {
        "path": "$.i",
        "value": { "$add": ["$.i", 1] }
      }
    },
    "maxIter": 100
  }
}
```

- 每轮**先**判条件再执行 body。
- **`maxIter` 必填**；缺省 → `phase: "validate"`。

## `for` — 遍历数组（L2）

类比 `for…of`：

```json
{
  "type": "for",
  "params": {
    "items": "$.input.nums",
    "itemKey": "$.item",
    "indexKey": "$.idx",
    "body": {
      "type": "set",
      "params": {
        "path": "$.sum",
        "value": { "$add": ["$.sum", "$.item"] }
      }
    },
    "maxIter": 1000
  }
}
```

- `items` 求值后必须是数组。
- `itemKey`（必填）/ `indexKey`（可选）绑定到 Slot，body 结束后恢复。
- 数组长度超过 `maxIter` → `phase: "run"`。

## 与集合高阶的分工

| 需求 | 用 |
| --- | --- |
| 副作用循环、可变累加、提前依赖 Slot | `while` / `for` |
| 纯 map / filter / fold 子图 | [集合](/guide/collections) 的 `arrayMap` 等 |

下一章：[函数（callFunc）](/guide/functions)。
