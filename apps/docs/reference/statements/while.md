# `while`

> **层**：L2 · **组**：Control · **对应 JS**：while

每轮先判条件再执行 body。maxIter 必填，保证有界。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `condition` | Expr | 必填 | 每轮开始前求值 |
| `body` | NodeSpec | 必填 | 循环体 |
| `maxIter` | number | 必填 | 硬顶；缺省 → validate 失败 |


## 示例

```json
{
  "type": "while",
  "params": {
    "condition": { "$lt": ["$.i", 3] },
    "body": {
      "type": "set",
      "params": { "path": "$.i", "value": { "$add": ["$.i", 1] } }
    },
    "maxIter": 100
  }
}
```


## 参见

- [`for`](/reference/statements/for)
- [`arrayMap`](/reference/statements/arrayMap)

- [语句总览](/reference/statements)
- [指南 · 循环与迭代](/guide/loops)
