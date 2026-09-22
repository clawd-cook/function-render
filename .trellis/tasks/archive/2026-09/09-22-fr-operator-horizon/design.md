# Design — horizon catalog（批次 2）

权威语义：`.trellis/tasks/archive/2026-09/09-22-fr-operator-system/design.md` §4–§7。  
本文件只写相对 v1 的实现落点与不变量；不重开身份辩论。

## Interface（不变）

```ts
validate(spec, { funcs }): FlowSpec
run(spec, { input, funcs, preview? }): Promise<{ state, result }>
```

扩表后调用方 Depth 增加：视界 NodeType / ExprAtom 进入封闭集；仍无项目级 `registerOperator`。

## 包落点

| 包 | 改动 |
|----|------|
| `packages/core` | 扩展 `NodeType` / schema / `V1_*` 命名为引擎当前封闭集；`evaluate` 实现新原子；`validate`：`maxIter`、tryCatch body 副作用扫描、Slot 规则 |
| `packages/runner` | `walk` 分发新 NodeType；`for`/`arrayMap`/`arrayReduce` 的 `itemKey` 绑定与恢复；`sleep` preview 跳过；`tryCatch` 写 `$.error` |
| `packages/catalog` | examples 示范；保留算法 Func；不把算术/一阶数据做成 Func |
| apps/docs | ≥1 纯协议题；guide 表；OnlineRunner 无需新 API |

## 关键不变量

1. `while`/`for`：缺 `maxIter` → validate；`for` 当 `items.length > maxIter` → run 错。
2. `arrayMap`/`arrayReduce`：默认 `maxIter = items.length`，仍硬顶。
3. `tryCatch.body` 子树：任一 `callFunc` 且对应 Func `sideEffect: true` → validate 失败；catch/finally 允许副作用。
4. `when`：默认 `waitAll=true`、`failStrategy=fastFail`；失败不聚合成成功。
5. `switch`：`match` 字面量，`Object.is` 与 `evaluate(input)` 比较。
6. `log`：内部 sink（测试可注入）；不导出到 `run` 返回值除非 `outputTo`。
7. `preview`：永不 `Func.run`；跳过 `sleep`。

## hosts/docs（D1）

- 不要求删 `twoSum`/`moveZeroes`/`maxSubarray` Func。
- 至少一题改为 `for` + Expr（建议 maximum-subarray 或 move-zeroes）。
- examples 覆盖 `for`/`when`/`switch`/`arrayMap`。

## 风险

- schema 判别式联合变大 → Zod/TS 复杂度；保持 `strictObject` + discriminatedUnion。
- `itemKey` 泄漏：迭代后必须恢复旧 Slot 值（design §3）。
- tryCatch 与全局 rollback 交互：未捕获失败仍走全局逆序 rollback（design §7）。

## 回滚

单 PR 内回退扩表提交即可；无数据迁移。无旧方言适配层可回退。
