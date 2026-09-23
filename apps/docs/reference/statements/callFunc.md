# `callFunc`

> **层**：L0 · **组**：Invocation · **对应 JS**：函数调用

唯一业务扩展点：按 funcKey 查本次注入的 funcs。

## 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `funcKey` | string | 必填 | 须 ∈ funcs |
| `args` | Record<string, Expr> | 可选 | 默认 {}；各值先求值 |

可选节点字段 `outputTo`：把返回值写入 Slot。

## 示例

```json
{
  "type": "callFunc",
  "params": {
    "funcKey": "deductBalance",
    "args": {
      "merchantId": "$.input.merchantId",
      "amount": "$.totalAmount"
    }
  },
  "outputTo": "$.receipt"
}
```

## 注意

- `preview: true`：**永不**调用 `Func.run`；仍校验 funcKey 与 params schema。
- live 且 `sideEffect: true` 且 `run` 成功 → 入 rollback 栈；后续失败逆序 `rollback`。
- `Func.run` 自身抛错 → **不**入栈。

## 参见

- [`set`](/reference/statements/set)
- [`if`](/reference/statements/if)
- [`expr`](/reference/statements/expr)

- [语句总览](/reference/statements)
- [指南 · 函数](/guide/functions)
