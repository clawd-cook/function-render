# 三层身份与放置规则

> 中级专题。判定「这个能力进哪张表」时用本页，避免把业务做成 NodeType、或把子图塞进 ExprAtom。

## 三张表

| 层 | 是什么 | 谁能扩展 |
| --- | --- | --- |
| **NodeType** | Spec 的 `type`（控制流、Slot、调用、数组高阶…） | 仅引擎发版 |
| **ExprAtom** | `{ "$mul": […] }` 等纯值运算 | 仅引擎发版 |
| **Func** | 业务副作用 / 多变实现 | 每次 `run` 的 `funcs` |

同一能力**禁止双挂**（例如不要再把 `$add` 做成 catalog Func）。

## 放置口诀

1. 两项目会写出不同实现，或碰 I/O / 网络 / DB / 时钟 → **Func**（只经 [`callFunc`](/reference/statements/callFunc)）
2. 需要子 `NodeSpec`、改控制流、绑定循环 Slot（`itemKey`）→ **NodeType**
3. 纯、同步、值→值、无子节点 → **ExprAtom**

附加：

- `$map` 禁止进 Expr（有子图）→ 用 [`arrayMap`](/reference/statements/arrayMap)
- `object` / `array` 不做 NodeType：字面量已递归求值
- 新行进封闭表 = **引擎版本 + changelog**，不是项目 `registerOperator`

## 与复杂度阶梯

L0 只要求你会用 `then` / `if` / `set` / `callFunc` + `$add` / `$mul` / `$gt` / `$lit`。其余 NodeType / ExprAtom 按 [设计理念](/guide/rationale) 的 L1–L5 再学。

参见：[语言概览](/guide/overview) · [语法与类型](/guide/grammar-and-types) · [参考总览](/reference/)
