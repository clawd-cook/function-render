# Implement — fr-operator-runtime

依赖：`.trellis/tasks/09-22-fr-operator-system/design.md` + `research/hard-cut-inventory.md`。

## 批次 0 — 换 Interface（破坏性）

1. [ ] 重写 `packages/core`：`{ type, params }` NodeSchema；ExprAtom schema；Slot `$.path`；删除 `$state` / JSON Pointer 对外；`FunctionRenderError.phase`。
2. [ ] 重写 `packages/runner`：`run(spec, { input, funcs, preview? })`；rollback 栈；preview 短路。
3. [ ] 瘦身 `packages/catalog`：删除 `add`/`sub`/`mul`/`div`/`delay`；示例改为新方言；结算可 mock `deductBalance`。
4. [ ] 同步改 `apps/node-service` / `react` / `vue` / `docs` 的旧 spec 与 `run` 调用。不做适配器。
5. [ ] **重写**（非翻译）`packages/core|runner|catalog` 测试。

## 批次 1 — 最小可跑（v1 验收）

NodeType：`then` `if` `set` `callFunc`。ExprAtom：`$mul` `$add` `$gt`。

单测穿过 `run` / `validate`：

1. [ ] 结算 demo：`orderAmount=2000` → tax 120、total 2120、调用 `deductBalance`。
2. [ ] `preview: true`：同样 Slot；任何 `Func.run` 都不得被调用；`sleep` 跳过（若已实现）。
3. [ ] `deductBalance.run` 抛错：`rollback` 调用一次。
4. [ ] 未知 `type` / 未知 `$atom` / 未注册 `funcKey` → `phase: "validate"`。
5. [ ] 中缀字符串不当成计算。

## 批次 2 — 视界 Catalog（可选，不挡 v1）

其余 Control、`get`、`arrayMap`/`arrayFilter`/`arrayReduce`、Utility。`while`/`for` 强制 `maxIter`。`tryCatch`：validate 拒绝 body 内副作用 `callFunc`。一阶 `$len`/`$at`/… 不塞进本任务。

## 验证命令

```bash
vp check packages/core packages/runner packages/catalog
vp run --filter @logic-renderer/core test
vp run --filter @logic-renderer/runner test
vp run --filter @logic-renderer/catalog test
vp run -r test && vp run -r build
```

结算 demo 用 runner 单测锁定。三端 app 改完后可按各自 PRD 手测。

## 风险 / 回滚

- 破坏所有现有 spec 与 `engine.test.ts` → **重写测试**，不要包翻译层。
- `packages/catalog` 删 `add` 会破 `examples.test.ts`：示例改为 `set` + `$add`。
- 若批次 2 未做：文档/注释标明视界未实现即可，勿假实现 `tryCatch`。

## 本轮建议范围

优先完成 **批次 0 + 批次 1**（满足 AC1–AC7）。批次 2 仅在时间允许且 v1 已绿时推进。
