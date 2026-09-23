# 语言概览

> 中级。从其它语言或编排方案迁入时，先读本页建立地图；系统学习请走 [FlowSpec 指南](/guide/guide)。

**Function Renderer** 把逻辑编排写成 JSON **FlowSpec**：引擎按封闭 **NodeType** 解释执行；算术等纯计算走封闭 **ExprAtom**；业务只经 **`callFunc` → funcs`**。

## 怎么读

| 想… | 去 |
| --- | --- |
| 按章节学会写协议 | [FlowSpec 指南](/guide/guide) |
| 理解为什么这么分层 | [设计理念](/guide/rationale) |
| 查某个 `type` / `$atom` | [参考](/reference/) |
| 在浏览器里改协议跑起来 | [LeetCode](/leetcode/) |

## 复杂度阶梯（L0–L5）

```
L0  then · if · set · callFunc · $add/$mul/$gt/$lit
L1  switch · tryCatch
L2  while · for
L3  更多 ExprAtom
L4  arrayMap · arrayFilter · arrayReduce
L5  when · log · assert · sleep · constant · expr
```

详解见 [设计理念](/guide/rationale)；身份判定见 [三层身份](/guide/identities)。

## 分层包

| 包 | 职责 |
| ---- | ---- |
| `@logic-renderer/core` | schema、`validate`、Slot、Expr 求值、错误 |
| `@logic-renderer/runner` | `run(spec, { input, funcs, preview? })` |
| `@logic-renderer/catalog` | 示例 Func + FlowSpec（算术不在 catalog） |

## 结算示例（L0 即够）

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

下一步：[FlowSpec 指南](/guide/guide) 或 [语法与类型](/guide/grammar-and-types)。
