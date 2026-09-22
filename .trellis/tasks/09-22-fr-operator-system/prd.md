# Func-Render 算子体系 — 可穷举 NodeType + 外部 Func

## Goal

把函数渲染器切成三层，让 **NodeType 与 ExprAtom 按引擎版本封闭可穷举**，业务函数按项目无限注入且不污染 Catalog：

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
- 新业务只进 `funcs`。项目不能 `registerOperator`。新 NodeType / ExprAtom 只能随 **引擎发版** 进入封闭表，并写 changelog。
- 节点身份是 `type`，不是 `funcKey`，也不是 `$mul`。
- **放置规则（R9）**：I/O 或项目语义 → Func；需要子 NodeSpec / 绑定循环 Slot / 改变控制流 → NodeType；纯同步值→值且无子节点 → ExprAtom。同一能力禁止同时出现在两张表。

### R2 NodeSpec

- 统一 `{ type, params, outputTo? }`。
- `outputTo` 把节点返回值写入 Slot。
- 未知 `type` 在 validate 拒绝。

### R3 封闭清单（视界 ≠ v1 必交付）

**v1 运行时验收（结算 demo）**：NodeType `then` `if` `set` `callFunc`；ExprAtom `$mul` `$add` `$gt`。

**视界 Catalog（设计承诺的封闭全集，后续引擎版本可实现，不作为 v1 门槛）**

- NodeType：Control `then` `when` `if` `switch` `while` `for` `tryCatch`；`callFunc`；Slot `get` `set`；高阶 `arrayMap` `arrayFilter` `arrayReduce`；Utility `log` `assert` `sleep` `constant` `expr`。
- ExprAtom：算术/比较/逻辑（见 design）；另按 R9 可纳入的一阶数据原子 `$len` `$at` `$concat` `$pick` `$omit` `$merge`。`$map` 禁止（有子图 → NodeType `arrayMap`）。
- 未知 `$xxx` 与中缀 `"$.a + $.b"` 校验失败。`add`/`mul` 退出 FuncRegistry 与 NodeType。
- `object`/`array` 不做 NodeType：字面量对象/数组已递归求值。

### R4 Slot / Expr

- 读：`$.path`；`$.input` 是入参。
- 写：`outputTo` 与 `set`。
- 计算只允许 ExprAtom 对象。`expr` 与 `if.condition` 也只吃这张表。

### R5–R7 执行 / preview / 校验

- `validate → run → 捕获 → 逆序 rollback`（只补偿已入栈的副作用帧）。
- 纯算子与全部 ExprAtom 无副作用。入栈条件：非 preview，且 `callFunc` 的 Func 标记 `sideEffect: true` 且 `run` 已成功。
- **`preview` 是安全保证，不是尽力而为**：`preview: true` **永不**调用任何 `Func.run`，也跳过 `sleep`。仍求值纯节点与 ExprAtom，仍用 `funcs` 做 `funcKey` 存在性与 `params` schema 校验。误标 `sideEffect` 不影响 preview 安全；它只影响 live 的 rollback 诚实性，责任在注入 `funcs` 的 host。
- `validate` **不执行** Func；**会读** registry 的键与 schema。AI「拒 spec」= 不跑 `run`，不是「不传 funcs」。
- Zod 校验 FlowSpec；缺 `maxIter`（`while`/`for`）、未注册 `funcKey` → validate 失败。
- **`tryCatch` 不进 v1**。视界实现时：`tryCatch.body` 内不得出现 `sideEffect: true` 的 `callFunc`（validate 用本次 `funcs` 检查）。catch/finally 可以。禁止「吞异常却留下未补偿副作用」。不采用「调用方自己补」作为默认。

### R8 硬切（有清单，不是口号）

- 唯一方言：`{ type, params }` + `$.path` + ExprAtom。旧判别式节点、`{ $state: "/ptr" }`、JSON Pointer 不适配、不编译。
- 仓内破坏面见 `research/hard-cut-inventory.md`：4 个 host、6 个 catalog examples、4 道 docs 题、三套包测试。无外部消费者。适配器成本高于重写这些 fixtures。
- 硬切的是 **方言**，不是「Catalog 永远不能在下一引擎版本增加 `$len`」。
- 实现期（后续任务）直接替换 core/runner/catalog 对外 Interface。本任务不改这些包。

## Acceptance Criteria

**文档已写入（≠ 人审通过）**

- [x] AC1 `design.md` 给出 Module 接口：入口、不变量、错误模式、顺序、性能；测试只穿过该接口。
- [x] AC2 v1 与视界清单分开；ExprAtom / NodeType 标明副作用与 `callFunc`/Slot 关系。
- [x] AC3 validate / run / rollback / preview 写清；preview 为安全保证；validate 不执行 Func 但读 registry。
- [x] AC4 算术 = 封闭 ExprAtom（Q2=C）。
- [x] AC5 结算 demo 是 v1 验收天花板，只需 `then`/`if`/`set`/`callFunc` + `$mul`/`$add`/`$gt`。
- [x] AC6 `implement.md` 给出后续实现清单；本任务不 `task.py start`。
- [x] AC7 硬切 + 仓内破坏清单写入 design / research。
- [x] AC8 放置规则（R9）与 Catalog「按版本封闭」写入 design。
- [x] AC9 `tryCatch`：v1 不含；视界下 body 禁止副作用 `callFunc`（validate）。

**人审（仍开放）**

- [x] AC10 用户确认本轮审查修订（放置规则、preview 安全、tryCatch、硬切清单、v1≠视界）。

验收方式：人审 artifact，不是跑测试。AC1–AC9 勾选表示「写进了文档」，只有 AC10 表示「审过了」。

## Out of Scope

- 本任务内的任何代码、Zod 落地、最小运行时。
- 可视化编辑器；字符串/日期/`isString` 扩展原子；liteflow 热刷新/分布式存储。
- 旧 spec 适配器、`compile/enact` Host、Result 风格 `apply`。

## Resolved Decisions

- **Q1** 旧方言不适配。
- **Q2** 算术/比较/逻辑 = 封闭 ExprAtom，禁止中缀。
- **Q3** 本任务只出设计。
- **接口** `run(spec, { input, funcs, preview? })`；Catalog **按引擎版本**密封；`funcs` 是值。
- **preview** 永不执行 `Func.run` / `sleep`（安全保证）。
- **v1 验收** = 结算子集；R3 视界 ≠ 一次交付。
- **tryCatch** 不进 v1；视界下 body 禁副作用 `callFunc`。
- **AC10**（2026-09-22）：用户确认上述四条，设计包可以归档或另开 runtime 任务。本任务仍不 `task.py start`。
