# `then`

> **层**：L0 · **组**：Control · **对应 JS**：语句块 / 顺序执行

按数组顺序串行执行子节点，返回最后一个节点的结果。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `nodes` | NodeSpec[] | 必填 | 按顺序执行的子节点 |


## 示例

```json
{
  "type": "then",
  "params": {
    "nodes": [
      { "type": "set", "params": { "path": "$.a", "value": 1 } },
      { "type": "set", "params": { "path": "$.b", "value": 2 } }
    ]
  }
}
```


## 参见

- [`if`](/reference/statements/if)
- [`when`](/reference/statements/when)
- [`callFunc`](/reference/statements/callFunc)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
