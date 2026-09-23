# `switch`

> **层**：L1 · **组**：Control · **对应 JS**：switch

用 Object.is(evaluate(input), match) 匹配分支；match 为字面量。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `input` | Expr | 必填 | 被比较的值 |
| `cases` | { match, node }[] | 必填 | match 字面量；node 子节点 |
| `default` | NodeSpec | 可选 | 未匹配时执行 |


## 示例

```json
{
  "type": "switch",
  "params": {
    "input": "$.input.status",
    "cases": [
      { "match": "ok", "node": { "type": "constant", "params": { "value": 1 } } }
    ],
    "default": { "type": "constant", "params": { "value": 0 } }
  }
}
```


## 参见

- [`if`](/reference/statements/if)
- [`then`](/reference/statements/then)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
