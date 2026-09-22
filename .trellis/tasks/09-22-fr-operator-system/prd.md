# Func-Render 算子体系 — 可穷举 NodeType + 外部 Func

## Goal

把函数渲染器切成三层，让 **NodeType 与 ExprAtom 永远可穷举**，业务函数按项目无限注入且不污染 Catalog：

- **算子（Operator / NodeType）**：写死在 Operator Catalog；Spec 的 `type`。负责控制流、数据变换、上下文、唯一的 `callFunc`。
- **表达式原子（ExprAtom）**：写死在 Expr Catalog；出现在 `params` / `condition`，形如 `{ "$mul": [...] }`。算术、比较、逻辑在这里。不是 NodeType，不是 Func。
- **业务函数（Func）**：每次 `run` 注入的 FuncRegistry。只经 `callFunc` 触发。

对标 json-render：`type: "Button"` 是组件类型；`onClick` 里的业务方法不是类型；`$mul` 是内置值表达式，不是 Button。

本任务 **只出设计**：`prd.md` / `design.md` / `implement.md`。不改 `packages/core|runner|catalog`，不 `task.py start`。实现另开任务。

## Background

仓库现状（检查所得）：

- 节点是判别式字段 `call`/`seq`/`parallel`/`if`/`switch`/`for`/`set`（`packages/core/src/schema.ts`），不是 `{ type, params }`。
- 算术在值表达式层 `$add`（`packages/core/src/expr.ts`），同时 `standardCatalog` 又注册了 `add`（`packages/catalog/src/functions.ts`）——身份污染。
- 寻址是 JSON Pointer `/input/id`；执行是 `validate → exec`、fail-fast，无 rollback / dry-run（`packages/runner/src/engine.ts`）。
- `09-22-fr-atomic-operators` 已把计算放进表达式；本设计保留「算术不是节点」，但节点信封与寻址硬切到新方言。

## Requirements

### R1 三层身份

- Operator Catalog、Expr Catalog、FuncRegistry 三者分离。
- FuncRegistry 是本次 `run` 的值，不是全局 `register()` 生命周期。
- 新业务只进 `funcs`；不能新增 NodeType 或 ExprAtom。
- 节点身份是 `type`，不是 `funcKey`，也不是 `$mul`。

### R2 NodeSpec

- 统一 `{ type, params, outputTo? }`。
- `outputTo` 把节点返回值写入 Slot。
- 未知 `type` 在 validate 拒绝。

### R3 封闭清单

**NodeType**：Control `then` `when` `if` `switch` `while` `for` `tryCatch`；Invocation `callFunc`；Data `get` `set` `object` `array` `arrayMap` `arrayFilter` `arrayReduce` `merge` `pick` `omit`；Utility `log` `assert` `sleep` `constant` `expr`。

**ExprAtom**：`$add` `$sub` `$mul` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round`；`$gt` `$gte` `$lt` `$lte` `$eq` `$neq`；`$and` `$or` `$not`。Slot 读是字符串 `$.path`。未知 `$xxx` 与中缀 `"$.a + $.b"` 校验失败。`add`/`mul` 退出 FuncRegistry 与 NodeType。

### R4 Slot / Expr

- 读：`$.path`；`$.input` 是入参。
- 写：`outputTo` 与 `set`。
- 计算只允许 ExprAtom 对象。`expr` 与 `if.condition` 也只吃这张表。

### R5–R7 执行 / dry-run / 校验

- `validate → run → 捕获 → 逆序 rollback`（只补偿副作用节点）。
- 纯算子与全部 ExprAtom 无副作用。副作用轨道只有 `callFunc`（Func `sideEffect: true`）与 `sleep`。
- `preview: true` 跳过副作用 `callFunc.run` 与 `sleep`，仍求值并校验 args，仍跑纯算子。
- Zod 校验 FlowSpec；缺 `maxIter`（`while`/`for`）、未注册 `funcKey` → validate 失败。

### R8 硬切

- 唯一方言：`{ type, params }` + `$.path` + ExprAtom。
- 旧判别式节点、`{ $state: "/ptr" }`、JSON Pointer 不适配、不编译。
- 实现期（后续任务）直接替换 core/runner/catalog 对外 Interface。本任务不改这些包。

## Acceptance Criteria

- [x] AC1 `design.md` 给出 Module 接口：入口、不变量、错误模式、顺序、性能；测试只穿过该接口。
- [x] AC2 NodeType 与 ExprAtom 分表，标明副作用与和 `callFunc`/Slot 的关系。
- [x] AC3 执行模型写清 validate / run / rollback / preview。
- [x] AC4 算术 = 封闭 ExprAtom（Q2=C）。
- [x] AC5 结算 demo 无需新算子即可被契约解释。
- [x] AC6 `implement.md` 给出后续实现清单；本任务不 `task.py start`。
- [x] AC7 硬切策略写进 design。

验收方式：人审三份 artifact，不是跑测试。

## Out of Scope

- 本任务内的任何代码、Zod 落地、最小运行时。
- 可视化编辑器；字符串/日期/`isString` 扩展原子；liteflow 热刷新/分布式存储。
- 旧 spec 适配器、`compile/enact` Host、Result 风格 `apply`。

## Resolved Decisions

- **Q1** 旧方言不适配。
- **Q2** 算术/比较/逻辑 = 封闭 ExprAtom，禁止中缀。
- **Q3** 本任务只出设计。
- **接口** `run(spec, { input, funcs, preview? })`；Catalog 密封；`funcs` 是值。
