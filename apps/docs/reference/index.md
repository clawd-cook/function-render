# 参考

查阅用事实表。第一次接触方言请先读 [FlowSpec 落地页](/guide/) 或 [FlowSpec 指南](/guide/guide)。

本区对齐 MDN **Reference** 的分类方式：按语法构造分组，而不是按教程章节。

## 分类

- [语句和声明](/reference/statements)
  - 封闭 NodeType（控制流、调用、数据、工具），**每算子一页**
- [表达式和运算符](/reference/operators)
  - 封闭 ExprAtom，**每原子一页**
- [函数](/reference/statements/callFunc)
  - 业务扩展唯一点；注入面见 [API](/reference/api)
- [错误](/reference/errors)
  - `FunctionRenderError` 三相
- [API](/reference/api)
  - `validate` / `run` / catalog 包表面

复杂度阶梯 L0–L5：`NODE_COMPLEXITY` / `EXPR_COMPLEXITY`（`@logic-renderer/core`）。封闭集合以 `NODE_TYPES` / `EXPR_ATOMS` 为准。
