# Research — 现有实现 vs 本提案

## 现有实现（仓库事实）

| 概念 | 现状 | 文件 |
|------|------|------|
| 节点身份 | 判别式字段 `call`/`seq`/`parallel`/`if`/`switch`/`for`/`set` | `packages/core/src/schema.ts` |
| 算术/比较/集合 | 值表达式 `$add`/`$eq`/`$at`…，不是节点 | `packages/core/src/expr.ts` |
| 业务与标准库 | 一律 `call` + `Catalog` | `packages/catalog/src/functions.ts`、`packages/runner/src/engine.ts` |
| 寻址 | JSON Pointer `/input/id` | `packages/core/src/state.ts` |
| 执行 | `validate → exec`，fail-fast | `packages/runner/src/engine.ts` |
| 副作用 / rollback / dry-run | 无 | — |
| 污染点 | `add` 既是 `$add` 表达式，又是 catalog 函数 | `expr.ts` + `functions.ts` |

## 本提案

| 概念 | 提案 |
|------|------|
| 节点身份 | 统一 `{ type: OperatorType, params, outputTo? }` |
| 算子 | 固定 5 类，写死在引擎 Catalog |
| 业务函数 | FuncRegistry，只经 `callFunc` |
| 寻址 | Slot `$.path` |
| 执行 | `validate → run → catch → 逆序 rollback` |
| 副作用 | 仅 `callFunc(sideEffect)` + `sleep` |

## 依赖分类（codebase-design / DEEPENING）

- **In-process**：parse、expr、math、data、control — 纯计算，可直接加深。
- **Local-substitutable**：FuncRegistry 用内存假函数测引擎。
- **True external**：真实业务函数（DB/RPC）经 FuncRegistry 注入；测试给 mock adapter。
- **不该开的 seam**：不要为每个算子开 port。一个 adapter 是假想 seam；Operator Catalog 只有一个生产 adapter（内置表）时，不要做成可插拔插件总线。

## Q1 / Q2 已定

- Q1：旧方言不适配、不编译、不双栈。判别式节点与 JSON Pointer 不进本 Module。
- Q2=C：算术/比较/逻辑是封闭 ExprAtom（`{ "$mul": [...] }`），不是 NodeType，不是 Func。禁止中缀。`standardCatalog.add` 删除。
- Q3：本任务只出设计，不写代码、不 `task.py start`。
- 新方言：`{ type, params, outputTo? }` + Slot `$.path` + ExprAtom。

## 删除测试

若删掉「算子模块」，复杂度应回到每个 FlowSpec 调用方（控制流、求值、rollback、dry-run 各自重写）。若删掉后复杂度消失，说明只是对 `call` 的浅包装。
