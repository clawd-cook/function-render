# Design-It-Twice 对比与推荐

三份稿：`design-min-interface.md`、`design-common-caller.md`、`design-max-flexibility.md`。Q1 已定（旧方言不适配），对比时丢掉任何 Legacy / `fromLegacy` 适配器。

## 三份 Interface（顺序读）

### 1. 最小入口 — `apply(job) → Outcome`

一个动词。`intent: "preview" | "commit"` 和 `Outcome.issues` 是数据，不是方法。失败不抛。算术走中缀 `expr` 字符串。真 seam 只有 `Job.funcs`。

### 2. 默认调用方 — `run(spec, { input, funcs })`

host 一行。数组根 = 隐式 `then`。`preview` 默认真跑。失败抛 `FunctionRenderError`。算术是 params 里的封闭原子 `{ "$mul": [...] }`。另留 `validate` 给 AI 只校验。

### 3. 最大弹性 — `compile → inspect → enact`

Plan 不透明 IR。Host / mode / rollback / whenUnmet 都是 knobs。算术是 ExprDialect 原子。为「两套方言、HTTP 整图」开了 Host 与 Dialect seam。Q1 已否掉 Dialect 第二 adapter，Host 目前也只有一个真实消费方（in-process）。

## 按 Depth / Locality / Seam

| | Depth | Locality | Seam |
|---|---|---|---|
| `apply` | 最高：学会 1 个入口就有校验/预览/补偿/Slot | 全在 `apply` 体内 | 只有 FuncRegistry（真） |
| `run` | 高：默认路径几乎为零配置；`validate` 稍浅（与 `run` 第一步重复） | 执行+rollback 在 runner；求值在 core | 只有 FuncRegistry（真） |
| `compile/enact` | 入口变宽：3 个方法 + 3 组策略枚举；leverage 摊到 knobs 上 | 方言/补偿/Host 拆开，改一处不够 | Host、Dialect 在 Q1 之后各只剩 1 个 adapter → 假想 seam |

## 三份都同意的（可直接收进 design）

- Operator Catalog 封闭，不可注入。
- 只有 `callFunc` 碰 Func；`add` 退出 `standardCatalog`。
- 真 seam 是 FuncRegistry（生产 vs 内存）。
- 执行顺序 `validate → walk → 捕获 → 逆序 rollback` 藏在 Implementation。
- 旧判别式节点 / JSON Pointer 不进 Interface（与 Q1 一致）。max-flex 的 LegacyExpr、common-caller 的 `fromLegacy` **作废**。

## 三份都把 Math 移出 NodeType（Q2 未决）

- min：中缀字符串（PRD Q2 的 B）
- common / max-flex：封闭 `$mul` / `$gt` 原子（PRD Q2 的 C）
- 用户原稿：Math 是 NodeType（PRD Q2 的 A）

## 推荐（接口形状，先于 Q2）

**以 common-caller 为底，收 min 的「funcs 是值、Catalog 密封、无 register()」。丢掉 max-flex 的 Plan/Host/Dialect。**

- 对外：`run(spec, { input, funcs, preview? }) → { state, result }`，失败抛错（与现 runner 一致，apps 已按这个写）。
- `validate(spec, { funcs })` 可留作 AI 预览的第二入口，不算第三套执行器。
- 不做 `apply` 的 Result 风格：三端 demo 和现测试都按 throw。
- 不做 compile/enact：本期没有第二个 Host adapter，开 port 是假想 seam。

Q2 已定 **C**：算术/比较/逻辑是封闭 ExprAtom，不是 NodeType，不是 Func，禁止中缀。
