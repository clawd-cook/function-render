# FlowSpec

**FlowSpec** 是 Function Renderer 的声明式编排方言：一份 JSON 树交给引擎，按**封闭 NodeType** 走控制流与数据变换；纯计算走**封闭 ExprAtom**；业务能力只经 **`callFunc` → 本次注入的 `funcs`**。

本节文档只讲这门方言本身——如何写协议、查算子、理解执行契约。浏览器外壳、LeetCode 题库、test262 仪表盘等宿主能力见站点其它栏目。

设计刻意对齐 [MDN JavaScript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript) 的信息架构：**教程循序渐进，参考按语法分类查阅**。

核心入口：

- [FlowSpec 指南](/guide/guide) — 按 JS 语法复杂度从 L0 读到集合高阶
- [参考](/reference/) — 语句 / 运算符 / 错误 / API 事实表

---

## 教程

### 基础语言指南

- [FlowSpec 指南](/guide/guide)
  - 面向已有 JS（或其它语言）经验的读者：语法与类型 → 控制流 → 循环 → 函数 → 表达式 → 集合。

### 中级

- [语言概览](/guide/overview)
  - 包分层、三层身份速览、L0 结算示例——从其它编排方案迁入时的地图。
- [三层身份与放置规则](/guide/identities)
  - NodeType / ExprAtom / Func 如何判定；禁止双挂。
- [语法与类型](/guide/grammar-and-types)
  - FlowSpec 形状、Slot、字面量与 Expr 规则（对应 JS Grammar and types）。

### 高级

- [设计理念：对齐 JS，渐进加复杂](/guide/rationale)
  - 为什么按 L0–L5 排能力、文档为何拆 Guide / Reference。
- [preview、rollback 与副作用](/guide/preview-rollback)
  - 安全预览保证、补偿栈入栈条件、与 `tryCatch` 的边界。

---

## 参考

浏览完整 [参考](/reference/) 文档。

- [语句和声明](/reference/statements)
  - 封闭 NodeType：`then` / `if` / `while` / `callFunc` / `arrayMap` …
- [表达式和运算符](/reference/operators)
  - 封闭 ExprAtom：`$add` / `$gt` / `$len` / `$lit` …
- [函数](/reference/statements/callFunc)
  - 唯一业务调用点；配合 [API](/reference/api) 中的 Func / `defineFunction`。
- [错误](/reference/errors)
  - `FunctionRenderError` 的 `validate` / `run` / `rollback` 三相。
- [API](/reference/api)
  - `@logic-renderer/core` · `runner` · `catalog` 对外表面。

复杂度阶梯与引擎源码一致：`NODE_COMPLEXITY` / `EXPR_COMPLEXITY`（见 [设计理念](/guide/rationale)）。
