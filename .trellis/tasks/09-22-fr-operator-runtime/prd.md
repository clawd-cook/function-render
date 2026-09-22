# Func-Render operator runtime — 硬切方言 + v1 结算验收

## Goal

按已审设计（`.trellis/tasks/09-22-fr-operator-system/`）落地 **硬切后的算子引擎**：

- 对外 Interface：`validate(spec, { funcs })` / `run(spec, { input, funcs, preview? })`
- NodeSpec：`{ type, params, outputTo? }`；Slot：`$.path`；ExprAtom 封闭表
- v1 运行时：NodeType `then` `if` `set` `callFunc`；ExprAtom `$mul` `$add` `$gt`
- 结算 demo + preview 安全保证 + rollback；同步改仓内 host / fixtures / 测试

权威设计：`09-22-fr-operator-system/design.md`。本 PRD 只写实现期需求与验收，不重开身份辩论。

## Background

- 设计任务 AC10 已通过；该任务明确 **不** `task.py start`，实现开本任务。
- 现状仍是旧方言：判别式节点 + `$state`/JSON Pointer + `run(spec,{catalog,initialState})`；`add` 双身份。
- 破坏面见 `09-22-fr-operator-system/research/hard-cut-inventory.md`。无外部消费者；不适配、不编译旧 spec。

## Requirements

### R1 Interface 硬切

- `packages/core`：新 NodeSchema / ExprAtom schema / Slot `$.path`；删除对外 `$state` 与 JSON Pointer 形态；`FunctionRenderError.phase`。
- `packages/runner`：`run(spec, { input, funcs, preview? })`；rollback 栈；preview 短路。
- `packages/catalog`：删除 `add`/`sub`/`mul`/`div`/`delay`；示例业务 Func 或结算 mock `deductBalance`。
- Host（node-service / react / vue / docs）与 examples / problems 全部改写为新方言。

### R2 v1 Catalog（结算子集）

- NodeType：`then` `if` `set` `callFunc`（本批次必交付）。
- ExprAtom：`$mul` `$add` `$gt`。
- 未知 `type` / 未知 `$atom` / 未注册 `funcKey` → `phase: "validate"`。
- 中缀字符串不当成计算。

### R3 执行语义

- `validate → walk → 捕获 → 非 preview 则逆序 rollback → 再抛`。
- `preview: true`：**永不**调用任何 `Func.run`，跳过 `sleep`；仍求值纯节点与 ExprAtom；仍用 `funcs` 做存在性与 schema 校验。
- 副作用帧：非 preview 且 `callFunc` 目标 `sideEffect: true` 且 `run` 已成功。
- `validate` 不执行 Func，但读 registry 键与 schema。

### R4 视界（本任务可选批次，不挡 v1）

- 其余 Control / Slot `get` / `arrayMap|Filter|Reduce` / Utility；`while`/`for` 强制 `maxIter`。
- `tryCatch`：validate 拒绝 body 内副作用 `callFunc`。
- 一阶 `$len`/`$at`/… 不塞进本任务 v1。

## Acceptance Criteria

- [ ] AC1 `validate` / `run` 对外签名与 `design.md` §1 一致；测试只穿过这两入口。
- [ ] AC2 结算 demo：`orderAmount=2000` → tax 120、total 2120、调用 `deductBalance`。
- [ ] AC3 `preview: true`：相同 Slot 结果路径可算；**任何** `Func.run` 不被调用。
- [ ] AC4 `deductBalance.run` 抛错：对应 `rollback` 被调用一次。
- [ ] AC5 未知 type / 未知 `$atom` / 未注册 `funcKey` → `phase: "validate"`。
- [ ] AC6 仓内 hard-cut 清单路径全部切到新方言；旧判别式/`$state` 测试已删除或重写（无适配层）。
- [ ] AC7 `vp check`（相关包）与 core/runner/catalog 测试通过；仓库 `vp run -r test` / `build` 绿或仅剩已登记的非本任务失败。

## Out of Scope

- 旧 spec 适配器；可视化编辑器；字符串/日期扩展原子；liteflow 分布式特性。
- 对本设计再开身份辩论（放置规则以 system 任务为准）。

## Dependencies

- 设计包：`.trellis/tasks/09-22-fr-operator-system/`（`prd.md` / `design.md` / `implement.md` / `research/`）。
