# Implement — 本任务只出设计；实现另开任务

## 本任务（09-22-fr-operator-system）

有序清单：

1. [x] `prd.md` 收敛（Q1/Q2/Q3 已折进 Goal / Requirements / Resolved）。
2. [x] `design.md`（Interface、三表、清单、执行、结算 demo、硬切）。
3. [x] 本文件：后续实现清单，本任务不写代码。
4. [ ] 用户评审三份 artifact。
5. [ ] **不要**对本任务 `task.py start`。评审通过后 `/trellis:finish-work` 或 `task.py archive`，实现用新任务。

验证（本任务）：通读 `prd.md` → `design.md` → 本文，确认无未决 Open Question，无「旧方言适配」残留。

回滚：只需改 markdown；工作树里本任务不应出现 `packages/**` 的实现 diff。

---

## 后续任务（建议新开，不在本任务 start）

建议 slug：`fr-operator-runtime`。依赖：本文 + `design.md`。父任务可挂回 `09-22-function-renderer`，但不要 start 父任务。

### 批次 0 — 换 Interface（破坏性）

- 重写 `packages/core`：`{ type, params }` NodeSchema；ExprAtom schema；Slot `$.path`；删除 `$state` / JSON Pointer 对外形态；`FunctionRenderError.phase`。
- 重写 `packages/runner`：`run(spec, { input, funcs, preview? })`；rollback 栈；preview 短路。
- 瘦身 `packages/catalog`：删除 `add`/`sub`/`mul`/`div`/`delay`；只留示例业务 Func（或结算 `deductBalance` mock）。
- 同步改 `apps/node-service` / `react` / `vue` / `docs` 的旧 spec。不做适配器。

### 批次 1 — 最小可跑（先于全量 Catalog）

NodeType：`then` `if` `set` `callFunc`（够结算）。  
ExprAtom：`$mul` `$add` `$gt`。  
单测穿过 `run` / `validate`：

- 结算 demo：`orderAmount=2000` → tax 120、total 2120、调用 `deductBalance`。
- `preview: true`：同样 Slot，不调 `run`。
- `deductBalance.run` 抛错：调用 `rollback` 一次。
- 未知 `type` / 未知 `$atom` / 未注册 `funcKey` → `phase: "validate"`。
- 中缀字符串不当成计算。

### 批次 2 — 补全 R3

Control 其余、Data、Utility。`while`/`for` 强制 `maxIter`。`arrayMap`/`arrayReduce` 嵌套。

### 验证命令（后续任务用）

```bash
vp check packages/core packages/runner packages/catalog
vp run --filter @logic-renderer/core test
vp run --filter @logic-renderer/runner test
vp run --filter @logic-renderer/catalog test
vp run -r test && vp run -r build
```

结算 demo 另用 runner 单测锁定，不必先开浏览器。三端 app 改完后再按各自 PRD 手测。

### 风险 / 回滚点

- 破坏所有现有 spec 与 `engine.test.ts`。后续任务应 **重写测试**，不要包一层翻译。
- `tryCatch` 与全局 rollback 栈的交互（见 design §7）必须有单测，否则补偿会 silently 错误。
- `packages/catalog` 的 `add` 删除会破 `examples.test.ts`：示例改为 `set` + `$add`。

### jsonl

本任务是设计-only，不 curate 给 implement/check 子代理的 jsonl（不会 start）。后续实现任务在 `task.py start` 前必须写入真实 `implement.jsonl` / `check.jsonl`：

- `.trellis/spec/guides/viteplus-ts-package-conventions.md`
- `.trellis/spec/guides/cross-layer-thinking-guide.md`
- `.trellis/tasks/09-22-fr-operator-system/design.md`
- `.trellis/tasks/09-22-fr-operator-system/prd.md`
