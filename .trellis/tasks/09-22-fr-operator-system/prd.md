# Func-Render 算子体系 — 可穷举 NodeType + 外部注册 Func

## Goal

把「函数渲染器」的能力切成两层，让 **算子集合永远可穷举**，同时允许 **业务函数按项目无限注册**：

- **算子（Operator / NodeType）**：引擎内置、写死在 Catalog 的固定节点类型；JSON Spec 的 `type` 字段。只负责控制流、数据变换、表达式运算、上下文操作。
- **业务函数（Func）**：外部注册到 FuncRegistry，**不是算子**。由唯一的 `callFunc` 算子触发。不同项目可注册不同函数；业务函数可以无限多，算子永远有限。

这解决「原子函数不可穷举」与「协议类型必须可穷举」的矛盾。对标 json-render：`type: "Button"` 是组件类型（算子），Button `onClick` 里调用的业务方法不是组件类型。

用户价值：AI / 人写 FlowSpec 时只学有限节点类型；新业务能力只注册函数，不污染算子 Catalog；引擎可统一执行、校验、dry-run、对副作用节点 rollback。

## Background / Confirmed Facts

以下事实来自仓库检查，不是推断。

### 已落地的两层模型（与本提案冲突，必须在设计中裁决）

- 父任务 `.trellis/tasks/09-22-function-renderer` 已定：JSON 编排树 + 共享 state + JSON Pointer；MVP 节点为 `call` / `seq` / `parallel` / `if`；zod 校验；fail-fast。
- 当前 `packages/core/src/schema.ts` 节点用**判别式字段**（`call`/`seq`/`parallel`/`if`/`switch`/`for`/`set`），**不是**统一 `{ type, params }`。
- 当前算术/比较/集合是**值表达式层**（`packages/core/src/expr.ts` 的 `$add`/`$eq`/`$at`…），不是节点类型。`evaluate(expr, ctx)` 在 `call.args` 与 `if`/`switch`/`for` 条件上求值。
- 当前业务与标准库函数都走 `call` + `Catalog`（`packages/catalog/src/functions.ts` 的 `standardCatalog` 含 `add`/`sub`/`mul`/`div`/`delay`/`sort`…）。`add` 同时存在于「值表达式 `$add`」和「catalog 函数 `add`」——正是本次要拆开的污染。
- 当前寻址是 JSON Pointer（`/input/id`），不是 Slot 路径（`$.input.id`）。
- 当前执行模型（`packages/runner/src/engine.ts`）：`validate → exec`，fail-fast，**无 rollback、无 sideEffect 标记、无 dry-run**。
- `09-22-fr-atomic-operators` 状态 `in_progress`：把原子计算放进值表达式，文档直呈协议。本任务若采纳「算术也是节点」，会修订该方向。

### 本轮已由用户锁定的语义

- 算子固定可穷举，写死在引擎 Catalog，不随业务增加。
- 业务能力不是算子，是外部注册函数，只通过 `callFunc` 调用。
- 算子只负责控制流、数据变换、表达式运算、上下文操作。
- 所有算子共用执行模型：`validate → run → 捕获异常 → 逆序 rollback（仅副作用节点）`。
- 纯算子（算术、数据变换、if、log）永远无副作用；可携带副作用的只有 `callFunc` 与 `sleep`；写 DB 的是业务函数，不是算子。
- rollback：仅当 `callFunc` 调到 `sideEffect: true` 的函数时记快照；异常时逆序只对这类节点触发函数 rollback。
- dry-run：跳过 `callFunc` 的副作用函数，只做参数校验与纯算子，输出中间变量，给 AI 生成 spec 预览。
- 循环强制 `maxIter`；`expr` 只允许简单表达式，禁止复杂业务逻辑。
- 高阶算子（`arrayMap` / `arrayReduce`）内部可嵌套完整算子树。

## Requirements

### R1 两层身份

- 引擎必须区分 **Operator Catalog**（固定 NodeType）与 **FuncRegistry**（外部函数）。
- 新增业务能力只能 `register(func)`，不能新增 OperatorType。
- Spec 的节点身份是 `type: OperatorType`，不是函数名。

### R2 统一 NodeSpec

- 所有算子共用结构：`{ type, params, outputTo? }`。
- `outputTo` 把节点返回值写入 Slot。
- 算子全集可穷举（见 R3）；非法 `type` 在 validate 阶段拒绝。

### R3 五类算子（引擎内置，本期清单）

1. **Control**：`then` / `when` / `if` / `switch` / `while` / `for` / `tryCatch`
2. **Invocation**：`callFunc`（唯一调用外部函数的算子）
3. **Math**：`add` `sub` `mul` `div` `mod` `pow` `abs` `ceil` `floor` `round`；比较 `gt` `gte` `lt` `lte` `eq` `neq`；逻辑 `and` `or` `not`
4. **Data**：`get` `set` `object` `array` `arrayMap` `arrayFilter` `arrayReduce` `merge` `pick` `omit`
5. **Utility**：`log` `assert` `sleep` `constant` `expr`

### R4 Slot 表达式

- 统一 `$.path`：`$.input` 为流程入参；节点通过 `outputTo` 写入 `$.xxx`。
- 算子 params 中的字符串表达式由引擎求值读 Slot。
- `expr` 算子只做单行轻量求值，禁止承载复杂业务。

### R5 执行模型与副作用

- 统一：`validate → run → 捕获异常 → 逆序 rollback（仅副作用节点）`。
- 纯算子可无限重试、可 dry-run。
- 仅 `callFunc`（且函数 `sideEffect: true`）与 `sleep` 进入副作用轨道。
- 业务函数可声明 `rollback` 钩子；引擎在补偿时调用，算子自身不写 DB。

### R6 dry-run

- dry-run 跳过副作用 `callFunc`，仍校验其参数、执行纯算子、产出中间 Slot，用于预览 / AI spec 校验。

### R7 校验

- FlowSpec 必须能被 schema（拟用 Zod，与现有 core 一致）校验。
- 未知 `type`、缺参、循环无 `maxIter`、`callFunc` 指向未注册 `funcKey` → validate 失败。

### R8 与现有仓库的关系（Q1 已定）

- **新方言是唯一一等公民**：`{ type, params, outputTo? }` + `$.path`。
- **不做旧方言适配**：`{ call, seq, parallel, if }`、`$add`、JSON Pointer `/pointer` 不进本 Module 的 Interface，也不做读入时编译。
- 现有 `packages/core|runner|catalog` 与旧 demo/docs spec 在实现期直接替换或废弃，不挂兼容层。
- 不得在未评审设计前改这些包。

## Acceptance Criteria

- [ ] AC1 `design.md` 给出 Operator Catalog 与 FuncRegistry 的模块接口：入口、不变量、错误模式、排序约束、性能特征；测试只穿过该接口。
- [ ] AC2 算子清单（R3）每个 type 有：能力、params 契约、副作用分类、JSON 示例、与 `callFunc`/Slot 的关系。
- [ ] AC3 执行模型写清：validate / run / 异常 / rollback / dry-run 各自对纯算子与副作用 `callFunc` 做什么、不做什么。
- [ ] AC4 明确「算术/数据」放在节点层还是值表达式层（或分层），并说明为何比另一方案更深（leverage + locality）。
- [ ] AC5 结算 demo FlowSpec（税额 → 合计 → 阈值 `if` → `callFunc deductBalance`）能被设计契约完整解释，无需新增算子。
- [ ] AC6 `implement.md` 给出有序落地清单与验证命令；本任务在用户评审前不 `task.py start`。
- [ ] AC7 design 写明硬切：旧方言不适配、不并存；实现期直接替换 core/runner/catalog 的对外 Interface。

## Out of Scope

- 可视化流程编辑器、拖拽画布。
- 字符串 / 日期 / `isString` 等扩展算子（可选方向，不进本期 Catalog）。
- liteflow 热刷新、分布式规则存储。
- 在本任务未完成设计评审前实现完整引擎或全量 Zod Schema 代码。

## Resolved Decisions

- **Q1**：旧方言不需要适配。新 `{ type, params }` + `$.path` 是唯一 Interface；旧 `{ call, seq, $add, /pointer }` 不编译、不双栈。

## Open Questions

- **Q2（阻塞）** params / `if.condition` 里的「表达式」能有多强：只允许 `$.path` + 字面量，还是允许中缀 `"$.amount > 1000"`，还是算术全部沉进 `expr`、不再做 Math 节点？
- **Q3** 本期落地形态：只出设计；还是设计后跟 Zod Schema；还是跟最小运行时（`then`/`if`/`callFunc`/`add` + 结算 demo）？
