# 函数：callFunc 与 Func

> 对应 MDN：[Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)。
> 复杂度：**L0**（核心扩展点）。业务能力**不是** NodeType，只经本算子调用。

## 为什么只有一个「调用」算子

算子表必须可穷举；业务函数可以无限多。因此：

- NodeType 里只有 **`callFunc`** 负责调外部能力；
- 具体实现放在每次 `run` 注入的 **`funcs`**（FuncRegistry）里。

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

- `args` 各值是 Expr（可含 Slot 与 ExprAtom）。
- `outputTo` 可选，写入返回值。
- `funcKey ∉ funcs` → `phase: "validate"`。

## Func 长什么样

```ts
defineFunction({
  params: z.object({ /* … */ }), // 可选，调用前 zod 校验
  sideEffect: true,               // 可选；影响 rollback 入栈
  async run(args, ctx) { /* … */ },
  async rollback(args, ctx) { /* … */ }, // sideEffect 时建议提供
});
```

## preview 与 rollback

| 模式 | 行为 |
| --- | --- |
| `preview: true` | **永不**调用 `Func.run`；仍求值 args、做 schema 校验 |
| live + `sideEffect: true` 且 `run` 成功 | 入 rollback 栈；后续失败**逆序**调 `rollback` |

纯计算请用 ExprAtom 或 `set`，不要做成 Func。算术已从 catalog 移除。

下一章：[表达式与运算符](/guide/expressions)。
