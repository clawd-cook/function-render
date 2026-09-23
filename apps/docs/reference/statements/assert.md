# `assert`

> **层**：L5 · **组**：Utility · **对应 JS**：断言

condition 为假 → phase: "run"。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `condition` | Expr | 必填 | Boolean 判定 |
| `message` | string | 必填 | 失败文案（字面量字符串） |


## 示例

```json
{
  "type": "assert",
  "params": {
    "condition": { "$gt": ["$.totalAmount", 0] },
    "message": "amount must be positive"
  }
}
```


## 参见

- [`tryCatch`](/reference/statements/tryCatch)
- [`if`](/reference/statements/if)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
