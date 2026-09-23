# `log`

> **层**：L5 · **组**：Utility · **对应 JS**：console.log 感

写内部 sink（测试可注入）；不自动进入 run 返回值。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `message` | Expr | 必填 | 求值后记录 |
| `level` | "info" | "warn" | "error" | 可选 | 日志级别 |


## 示例

```json
{
  "type": "log",
  "params": { "message": "$.input.msg", "level": "info" }
}
```


## 参见

- [`assert`](/reference/statements/assert)
- [`expr`](/reference/statements/expr)

- [语句总览](/reference/statements)
- [指南 · 控制流](/guide/control-flow)
