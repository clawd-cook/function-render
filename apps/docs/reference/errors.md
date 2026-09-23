# 错误

失败抛 `FunctionRenderError`：

| 字段 | 含义 |
|------|------|
| `phase` | `validate` \| `run` \| `rollback` |
| `path` | 出错节点路径 |
| `message` | 说明 |
| `funcKey` | 可选，调用相关 |

## 三相

| phase | 何时 |
|-------|------|
| `validate` | 结构非法、未知 type/atom、未注册 funcKey、缺 `maxIter`、tryCatch body 含 sideEffect callFunc 等；**尚未 walk** |
| `run` | 执行期失败（断言失败、除零、超 `maxIter`、Func 抛错等）；fail-fast |
| `rollback` | 补偿钩子失败；尽量播完其余帧再抛，`cause` 为原错误 |

## 补偿

仅 `preview === false` 且 `callFunc` 打到 `sideEffect: true` 且 `run` 已成功返回时入栈；后续失败**逆序**调用 `rollback`。

ExprAtom 与纯 NodeType 永不入栈。
