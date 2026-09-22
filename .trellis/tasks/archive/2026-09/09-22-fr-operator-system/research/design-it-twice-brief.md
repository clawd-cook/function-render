# Design-It-Twice 共享 brief

深化对象：**Func-Render 算子引擎**（Operator Catalog + FuncRegistry + 执行 + Slot）。

## 必须满足的约束

1. 算子（Operator / NodeType）固定可穷举；业务函数（Func）外部注册，不是算子。
2. 只有 `callFunc` 调用外部函数。
3. 算子只做控制流、数据变换、表达式运算、上下文操作。
4. 共享执行模型：`validate → run → 捕获异常 → 逆序 rollback（仅副作用节点）`。
5. 纯算子无副作用；副作用只来自 `callFunc`（函数标 `sideEffect`）和 `sleep`。
6. dry-run 跳过副作用函数，仍跑纯算子与参数校验。
7. 循环有 `maxIter`；`expr` 禁止复杂业务。
8. JSON Spec 参数化节点实例。
9. 对本仓已有 `packages/core|runner|catalog` 给出关系（演进 / 替换 / 适配），不要假装绿场。

## 词汇（必须原词，禁止替换）

来自 codebase-design：Module / Interface / Implementation / Depth / Seam / Adapter / Leverage / Locality。

来自本域：Operator / NodeType / Operator Catalog / Func / FuncRegistry / NodeSpec / Slot / callFunc / FlowSpec / dry-run / rollback / sideEffect。

不要用 component、service、API、boundary、signature（除非指 TS 关键字本身）。

## 依赖类别

- In-process：parse / expr / math / data / control
- Local-substitutable：内存 FuncRegistry
- True external：真实业务 Func，经 FuncRegistry 注入

规则：一个 adapter 是假想 seam；两个 adapter 才是真 seam。不要为每个算子开 port。

## 每个方案必须交付

1. **Interface**：入口、参数、不变量、调用顺序、错误模式、调用方必须知道的性能特征（不只是 TS 类型）。
2. **Usage**：结算 demo（税额 → 合计 → if → `callFunc deductBalance`）的调用代码 + 对应 FlowSpec 片段。
3. **Implementation 藏什么**：rollback 栈、表达式求值、算子分发、dry-run 短路藏在哪。
4. **Seam / Adapter**：真 seam 在哪；生产 adapter 与测试 adapter。
5. **Trade-offs**：哪里 leverage 高、哪里浅；locality 落在哪；与现状 (`call`/`seq`/`$add`/JSON Pointer) 怎么相处。

## 禁止

- 把业务函数做成新 OperatorType。
- 为「以后可能插件化」而设计只有一个 adapter 的算子插件总线。
- 只列算子表而不设计 Module 接口。
- 输出实现代码仓库；这是接口设计，给最小示意即可。
