# preview、rollback 与副作用

> 高级专题。对应「执行语义」层，而不是某个单一 NodeType。

## preview

`run(spec, { …, preview: true })` 时：

- **永不**调用任何 `Func.run`
- **跳过** `sleep`
- 仍会 `validate`、求值 Expr / Slot、校验 `funcKey` 与可选 zod `params`

不保证与 live 在 `callFunc` / `outputTo` 处观察等价（preview 下副作用结果不会写入）。

## rollback 补偿

| 条件 | 是否入栈 |
| --- | --- |
| `preview === true` | 否 |
| `callFunc` 打到的 Func **没有** `sideEffect: true` | 否 |
| `Func.run` **自身抛错** | 否（尚未成功） |
| live + `sideEffect: true` + `run` **已成功返回** | 是 |

后续节点失败时，引擎**逆序**调用已入栈帧的 `rollback`。钩子失败 → `phase: "rollback"`，尽量播完其余帧。

ExprAtom 与纯 NodeType **永不**入栈。

## 与 `tryCatch` 的边界

[`tryCatch`](/reference/statements/tryCatch) 的 `body` 内禁止目标 Func 为 `sideEffect: true` 的 `callFunc`（validate 拒绝）。局部捕获与全局补偿栈刻意分开，避免语义纠缠。

## 相关

- 指南：[函数](/guide/functions)
- 参考：[callFunc](/reference/statements/callFunc) · [错误](/reference/errors) · [API](/reference/api)
