# 设计理念：对齐 JS，渐进加复杂

> 一句话：**DSL 的学习曲线与 JS 语法规范同构**——先能写「顺序 + 分支 + 赋值 + 调函数」，再补循环、表达式、集合与并发。
> 词表以引擎实现为准；本章只说明**层次怎么排、为什么这样排**。

---

## 为什么对齐 JS，而不是另造一门「工作流语言」

写 JSON FlowSpec 的人，几乎都已经会 JS。若编排原语的名字、职责、出现顺序与
[MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
一致，读者可以把已有心智模型**平移**过来，而不是同时学两套语法。

| JS（你已经会的） | FlowSpec（本引擎） |
| --- | --- |
| 语句块 / 顺序 | `then` |
| `if` / `switch` / `try…catch` | `if` / `switch` / `tryCatch` |
| `while` / `for…of` | `while` / `for` |
| 函数调用 | `callFunc`（业务能力） |
| 表达式与运算符 | ExprAtom（`$add`、`$gt`…） |
| `Array.map` / `filter` / `reduce` | `arrayMap` / `arrayFilter` / `arrayReduce` |
| 变量读写 | Slot：`set` / `get` / `$.path` |

**刻意不做的事**：自造中缀表达式、开放的「任意算子注册」、图灵完备的无界循环。
封闭词表 + 有界迭代，是为了让一份 spec **可穷举、可校验、必然停机**——这是对「像 JS」的约束，不是对「像 JS」的否定。

---

## 渐进式复杂度：先基础，后复杂

引擎能力按**使用频率与认知依赖**分层。下层不依赖上层；学完 L0 就能跑结算 demo，
其余层按需开启。这与 JS 先学语句再学异步、模块、元编程同一逻辑。

```
L0  基础可运行     then · if · set · callFunc · $add/$mul/$gt/$lit
L1  控制流补全     switch · tryCatch
L2  循环           while · for（必带 maxIter）
L3  表达式加宽     更多算术 / 比较 / 逻辑 / 一阶数据原子
L4  集合高阶       arrayMap · arrayFilter · arrayReduce
L5  并发与工具     when · log · assert · sleep · constant · expr
```

| 层 | 对应 JS Guide 章节感 | 你能完成什么 |
| --- | --- | --- |
| **L0** | Grammar + 最简 control + Functions | 读写 Slot、分支、注入业务 Func；结算类协议 |
| **L1** | Control flow & error handling | 多路匹配、捕获失败写 `$.error` |
| **L2** | Loops and iteration | 条件循环、数组遍历（有硬顶） |
| **L3** | Expressions and operators | 纯计算留在表达式里，不塞进 Func |
| **L4** | Indexed collections | 批量变换 / 过滤 / 折叠 |
| **L5** | 进阶（并发、诊断） | 并行 `when`、日志断言、预览友好工具节点 |

**实现顺序也按这张表**：v1 先落地 L0；视界 Catalog 再补 L1–L5。文档站 Guide 的章节顺序与此相同——
先读完 [语法与类型](/guide/grammar-and-types) 到 [函数](/guide/functions)，再往下翻。

---

## 三层身份：仍然严格分离（但按「何时需要」出现）

渐进不等于混层。任何能力只进一张表：

| 层 | 是什么 | 何时学 | 谁能扩展 |
| --- | --- | --- | --- |
| **NodeType** | Spec 的 `type`（控制流、Slot、调用、数组高阶…） | L0 起，按 Guide 逐章 | 仅引擎发版 |
| **ExprAtom** | `{ "$mul": […] }` 等纯值运算 | L0 最少集 → L3 加宽 | 仅引擎发版 |
| **Func** | 业务副作用 / 多变实现 | L0 即用，经 `callFunc` | 每次 `run` 注入 `funcs` |

判定口诀（与实现一致）：

1. 两项目会写出不同实现，或碰 I/O / 网络 / DB → **Func**
2. 需要子节点、改控制流、绑定循环 Slot → **NodeType**
3. 纯、同步、值→值 → **ExprAtom**

同一能力禁止双挂（例如不要再把 `$add` 做成 catalog Func）。

---

## 文档站为什么也拆成 Guide + Reference

直接照抄 MDN 的信息架构：

Guide 讲「先学什么」；Reference 讲「这一项完整语义是什么」。文档站侧栏与 [MDN JavaScript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript) 同构：

| MDN | 本站 |
| --- | --- |
| 教程 → 指南 / 中级 / 高级 | [FlowSpec 落地页](/guide/) 侧栏同名分组 |
| 参考 → 语句 / 运算符 / … | [参考](/reference/) |

设计理念（本页）只回答「为什么按 JS 分层」。

---

## 与「理论清单」式理念页的区别

本页**不**展开结构化程序定理、Saga、初始代数等推导。那些可以作为实现注释或研究笔记，
但不是面向使用者的入门叙事。

使用者需要记住的只有三条：

1. **像写 JS 一样想编排**——语句 / 表达式 / 函数调用分层清晰。
2. **先 L0 后视界**——基础跑通再加循环、集合、并发。
3. **业务永远走 `callFunc`**——算子表封闭可穷举，扩展面唯一。

下一步：[FlowSpec](/guide/) → [指南目录](/guide/guide)。
