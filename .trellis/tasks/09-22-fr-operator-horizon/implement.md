# Implement — fr-operator-horizon

依赖：本任务 `prd.md` / `design.md`；权威语义见 archive `09-22-fr-operator-system/design.md`。

## 批次 H0 — ExprAtom 扩表

1. [x] `packages/core`：扩展封闭原子集 + `evaluate`（算术/比较/逻辑/一阶数据）
2. [x] 单测：`$div` 除零、`$eq` 深比较、`$len`/`$at`/`$concat`/`$pick`/`$omit`/`$merge`、未知原子 validate

## 批次 H1 — Control + Utility

1. [x] schema + validate：`when` `switch` `while` `for` `tryCatch`；`assert` `sleep` `constant` `expr` `log`；`while`/`for` 强制 `maxIter`
2. [x] runner walk 实现上述节点；`sleep` preview 跳过；`tryCatch` + `$.error`；tryCatch body 副作用扫描
3. [x] 单测主路径 + validate 拒绝用例

## 批次 H2 — Data 高阶

1. [x] `get` `arrayMap` `arrayFilter` `arrayReduce`；itemKey/accumKey 绑定与恢复；maxIter 硬顶
2. [x] 单测 map/filter/reduce + for 与 arrayMap 对照

## 批次 H3 — D1 fixtures + docs + code-spec

1. [x] catalog examples：`for`/`when`/`switch`/`arrayMap` 各 ≥1
2. [x] docs ≥1 纯协议题 + guide 表
3. [x] 更新 `.trellis/spec/logic-renderer/backend/operator-runtime-api.md`

## 验证

```bash
vp check packages/core packages/runner packages/catalog
vp run --filter @logic-renderer/core test
vp run --filter @logic-renderer/runner test
vp run --filter @logic-renderer/catalog test
vp run -r test && vp run -r build
```

## 风险 / 回滚点

- H1 tryCatch 与 rollback：先写「body 副作用 → validate 失败」单测再实现。
- H2 itemKey 泄漏：测迭代后 Slot 恢复。
- 全量失败时按批次回退；不要留半截 schema。

## jsonl（start 前）

- `.trellis/spec/logic-renderer/backend/operator-runtime-api.md`
- `.trellis/spec/logic-renderer/backend/index.md`
- `.trellis/spec/guides/viteplus-ts-package-conventions.md`
- `.trellis/spec/guides/cross-layer-thinking-guide.md`
- `.trellis/tasks/archive/2026-09/09-22-fr-operator-system/design.md`
