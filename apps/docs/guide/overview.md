# 概览

**Function Renderer** 是一个声明式的**函数执行引擎**：你把一份 JSON FlowSpec 交给引擎，它按**封闭 NodeType** 编排执行；业务能力只经 `callFunc` 注入的 **FuncRegistry**。算术与一阶数据变换走封闭 **ExprAtom**，不是业务函数。

设计借鉴：

- [json-render](https://github.com/vercel-labs/json-render)：catalog、值表达式、zod 参数校验。
- [LiteFlow](https://github.com/dromara/liteflow)：`THEN` / `IF` 等编排算子与共享上下文。

## 三层身份（不要混）

| 层 | 是什么 | 谁能扩展 |
|----|--------|----------|
| **Operator / NodeType** | Spec 的 `type`：控制流、Slot、`callFunc`、数组高阶… | 仅引擎发版（封闭表） |
| **ExprAtom** | `params` / `condition` 里的 `{ "$mul": […] }` 等 | 仅引擎发版（封闭表） |
| **Func** | 业务函数，只经 `callFunc` | 每次 `run` 注入的 `funcs` |

同一能力禁止同时出现在两张表（例如不要再把 `$add` 做成 catalog Func）。

## 分层包

| 包 | 职责 |
| ---- | ---- |
| `@logic-renderer/core` | NodeSpec / ExprAtom schema、Slot `$.path`、`validate`、错误 |
| `@logic-renderer/runner` | `run(spec, { input, funcs, preview? })` → `{ state, result }` |
| `@logic-renderer/catalog` | 示例业务 Func + 共享 FlowSpec（算术不在 catalog） |

## 核心概念

- **FlowSpec**：`{ type, params, outputTo? }` 节点树（见 [编排算子](/guide/operators)）。
- **funcs**：本次 `run` 的值，不是全局 `register()`。
- **Slot**：`$.input` 入参只读；`set` / `outputTo` 写其它路径。
- **preview**：`preview: true` 时**永不**调用 `Func.run`，并跳过 `sleep`（安全保证）。
- **rollback**：仅 `sideEffect: true` 且 `run` 已成功的 `callFunc` 入栈；失败后逆序补偿。

## 结算示例（编排 + Expr + 业务 Func）

```json
{
  "type": "then",
  "params": {
    "nodes": [
      {
        "type": "set",
        "params": {
          "path": "$.tax",
          "value": { "$mul": ["$.input.orderAmount", 0.06] }
        }
      },
      {
        "type": "set",
        "params": {
          "path": "$.totalAmount",
          "value": { "$add": ["$.input.orderAmount", "$.tax"] }
        }
      },
      {
        "type": "if",
        "params": {
          "condition": { "$gt": ["$.totalAmount", 1000] },
          "trueBranch": {
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
        }
      }
    ]
  }
}
```

`input: { "orderAmount": 2000, "merchantId": "m1" }` → `tax = 120`、`totalAmount = 2120`，并调用 `deductBalance`。

更短的算术管道示例见 catalog `examples.math-pipeline`。完整 NodeType / ExprAtom 表见 [编排算子](/guide/operators)，签名见 [API](/guide/api)。

去 [LeetCode 在线运行](/leetcode/) 试协议；其中「最大子数组和」已是纯协议（无 `callFunc`）。
