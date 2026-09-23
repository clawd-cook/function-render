# 参考

查阅用事实表。若你是第一次接触引擎，请先走 [指南](/guide/overview)（按 JS 语法复杂度渐进）。

| 章节 | 内容 |
| --- | --- |
| [语句（NodeType）](/reference/statements) | 封闭控制流 / 调用 / 数据 / 工具 — **每算子一页** |
| [运算符（ExprAtom）](/reference/operators) | 封闭表达式原子 — **每原子一页** |
| [错误](/reference/errors) | `FunctionRenderError` 三相 |
| [API](/reference/api) | `validate` / `run` / catalog |

复杂度阶梯 L0–L5 与引擎源码一致：`NODE_COMPLEXITY` / `EXPR_COMPLEXITY`（`@logic-renderer/core`）。封闭集合以 `NODE_TYPES` / `EXPR_ATOMS` 为准。
