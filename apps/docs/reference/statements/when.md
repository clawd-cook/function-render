# `when`

> **层**：L5 · **组**：Control · **对应 JS**：Promise 并行 / Promise.all 感

并行执行子节点。默认 waitAll=true、failStrategy=fastFail。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `nodes` | NodeSpec[] | 必填 | 并行子节点 |
| `waitAll` | boolean | 可选 | 默认 true |
| `failStrategy` | "fastFail" | "allSettled" | 可选 | 默认 fastFail |


## 示例

```json
{
  "type": "when",
  "params": {
    "nodes": [
      { "type": "constant", "params": { "value": 1 } },
      { "type": "constant", "params": { "value": 2 } }
    ],
    "waitAll": true
  }
}
```

## 注意

- `waitAll: false` 时失败者仍可能写 Slot / 入 rollback 栈；有副作用时优先默认。

## 参见

- [`then`](/reference/statements/then)
- [`callFunc`](/reference/statements/callFunc)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
