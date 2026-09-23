# `if`

> **层**：L0 · **组**：Control · **对应 JS**：if…else

对 condition 求值后用 Boolean() 选枝执行。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `condition` | Expr | 必填 | 求值后转布尔 |
| `trueBranch` | NodeSpec | 必填 | 真枝 |
| `falseBranch` | NodeSpec | 可选 | 假枝 |


## 示例

```json
{
  "type": "if",
  "params": {
    "condition": { "$gt": ["$.totalAmount", 1000] },
    "trueBranch": { "type": "constant", "params": { "value": "big" } },
    "falseBranch": { "type": "constant", "params": { "value": "small" } }
  }
}
```


## 参见

- [`switch`](/reference/statements/switch)
- [`then`](/reference/statements/then)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
