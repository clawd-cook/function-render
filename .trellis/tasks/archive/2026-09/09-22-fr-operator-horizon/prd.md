# Func-Render horizon catalog — 批次 2 NodeType + ExprAtom

## Goal

在 v1 结算运行时上，**一次交付**设计视界封闭 Catalog，使协议能表达循环 / 并行 / 数组高阶 / 工具节点与一阶数据原子；项目仍只能注入 `funcs`。hosts/docs 做示范性改写（非 Hot100 全量纯协议）。

## Background

- v1：`then` `if` `set` `callFunc` + `$add` `$mul` `$gt` `$lit`；`validate`/`run`/`preview`/`rollback`。
- 权威设计：`.trellis/tasks/archive/2026-09/09-22-fr-operator-system/design.md` §4–§5、§7。
- 合约基线：`.trellis/spec/logic-renderer/backend/operator-runtime-api.md`（本任务结束扩写视界）。

## Confirmed facts

- Operator / Expr 按引擎版本封闭；本任务 = 扩表，不是 `registerOperator`。
- `$map` 永不进 Expr；用 `arrayMap`。`object`/`array` 不做 NodeType。
- `tryCatch`：validate 拒绝 body 内目标 Func `sideEffect: true` 的 `callFunc`。
- `while`/`for` 缺 `maxIter` → validate 失败；`for` 超长 → run 错。
- `preview` 永不 `Func.run`，跳过 `sleep`。

## Requirements

### R1 NodeType（视界全表）

| 组 | types |
|----|--------|
| Control | `when` `switch` `while` `for` `tryCatch`（保留 `then` `if`） |
| Data | `get` `arrayMap` `arrayFilter` `arrayReduce`（保留 `set`） |
| Utility | `log` `assert` `sleep` `constant` `expr` |
| 保留 | `callFunc` |

params / 语义以 design §4 为准。

### R2 ExprAtom（视界全表）

- 算术：`$sub` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round` + 已有 `$add` `$mul`
- 比较/逻辑：`$gte` `$lt` `$lte` `$eq` `$neq` `$and` `$or` `$not` + 已有 `$gt`
- 一阶数据：`$len` `$at` `$concat` `$pick` `$omit` `$merge`
- 保留 `$lit`。`$div` 除零 → `phase: "run"`。

### R3 不变量

- 测试只穿过 `validate` / `run`；中缀字符串不当成计算。
- 副作用帧规则与 v1 相同。

### R4 hosts / docs（D1）

- catalog `examples`：含 `for` / `when` / `switch` / `arrayMap` 各 ≥1。
- docs：至少 1 题（move-zeroes **或** maximum-subarray）改为纯协议；`twoSum` 可保留 Func。
- guide 文档补视界节点 / 原子表。

## Acceptance Criteria

- [ ] AC1 视界 NodeType / ExprAtom 均可 validate+run；缺 `maxIter`、tryCatch body 副作用 `callFunc` → `phase: "validate"`
- [ ] AC2 单测覆盖 Control/Data/Utility 主路径、新 ExprAtom、preview 跳过 sleep、tryCatch 规则
- [ ] AC3 `vp check packages/core packages/runner packages/catalog` + 包测试绿；`vp run -r test` / `build` 不因本任务回归
- [ ] AC4 更新 `operator-runtime-api.md`（视界清单，不再「仅 v1」）
- [ ] AC5 D1：examples 四处示范 + docs ≥1 纯协议题 + guide 表更新

## Out of Scope

- 旧方言适配；可视化编辑器；liteflow；`$dateAdd` 等字符串/日期原子；Hot100 全量纯协议；去掉 `twoSum` 等算法 Func。

## Resolved Decisions

- **切片 = A**：视界全表，单任务，implement 内分批。
- **hosts/docs = D1**：引擎必达 + 示范性改写。
