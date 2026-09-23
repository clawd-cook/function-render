# 概览

**Function Renderer** 把逻辑编排写成 JSON **FlowSpec**：引擎按**封闭 NodeType** 走控制流与数据变换；算术等纯计算走**封闭 ExprAtom**；业务能力只经 **`callFunc` → 本次注入的 `funcs`**。

设计原则见 [设计理念](/guide/rationale)：**对齐 JS 语法规范，按复杂度渐进**。本页只给地图；细节按 Guide 章节往下读，查表用 [参考](/reference/)。

## 怎么读本文档站

| 想… | 去 |
| --- | --- |
| 理解为什么这么分层 | [设计理念](/guide/rationale) |
| 从零学会写协议（渐进） | Guide：语法 → 控制流 → 循环 → 函数 → 表达式 → 集合 |
| 查某个 `type` / `$atom` / API | [参考](/reference/) |
| 在浏览器里改协议跑起来 | [LeetCode](/leetcode/) |

## 复杂度阶梯（与 Guide 章节一一对应）

```
L0  then · if · set · callFunc · $add/$mul/$gt/$lit
L1  switch · tryCatch
L2  while · for
L3  更多 ExprAtom
L4  arrayMap · arrayFilter · arrayReduce
L5  when · log · assert · sleep · constant · expr
```

## 三层身份（不要混）

| 层 | 是什么 | 谁能扩展 |
|----|--------|----------|
| **NodeType** | Spec 的 `type` | 仅引擎发版 |
| **ExprAtom** | `{ "$mul": […] }` 等 | 仅引擎发版 |
| **Func** | 业务函数 | 每次 `run` 的 `funcs` |

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

下一章：[语法与类型](/guide/grammar-and-types)。
