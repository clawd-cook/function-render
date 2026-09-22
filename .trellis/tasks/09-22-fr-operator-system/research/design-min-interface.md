# Design — Min Interface: one verb, `apply`

深化对象：Func-Render 算子引擎。约束是 **把 Interface 压到 1 个入口**。validate / run / rollback / dry-run / Slot / callFunc 全部变成 Job 上的数据与 Outcome 上的事实，而不是方法。

与现状的根本差别：今天的 `run(spec, { catalog })` 把业务与算术塞进同一个 Catalog，调用方还要懂判别式节点、`$add`、JSON Pointer。本方案 **只认一份 `{ type, params, outputTo? }` + `$.path` 方言**，算术沉进 params 表达式，FuncRegistry 是唯一注入值。

---

## 1. Interface

**唯一入口**

```ts
function apply(job: Job): Promise<Outcome>
```

```ts
type Intent = "preview" | "commit";

type Job = {
  spec: unknown;          // FlowSpec JSON；非法则 Outcome.issues，不抛
  input: unknown;         // 写入 Slot `$.input`，apply 内 structuredClone
  funcs: FuncRegistry;    // 值，不是 register() 生命周期
  intent: Intent;         // preview = dry-run；commit = 真跑 + 失败补偿
};

type Func = {
  run: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  rollback?: (args: Record<string, unknown>, result: unknown) => unknown | Promise<unknown>;
  sideEffect?: boolean;   // 默认 false；true 才进 rollback 栈 / preview 跳过 run
  params?: ZodType;       // 有则 validate + 每次调用前校验已求值 args
};

type FuncRegistry = Readonly<Record<string, Func>>;

type Outcome = {
  ok: boolean;
  intent: Intent;
  result: unknown;                 // 根节点返回值；失败则为失败前最后值
  slots: Record<string, unknown>;  // 完整 Slot 空间（含 $.input 与 outputTo）
  issues: Issue[];                 // 空 = 成功；validate / 运行 / rollback 同源
  compensated: boolean;            // commit 失败且已逆序调过 rollback
};

type Issue = { phase: "validate" | "run" | "rollback"; path: string; message: string };
```

调用方 **不必** 调用 validate、run、rollback、dry-run、getSlot、callFunc、register。这些不是入口。

**不变量**

- Operator Catalog 封在 Implementation 里，不可注入、不可增长。未知 `type` 只在 validate 失败。
- 只有 NodeType `callFunc` 会碰 `job.funcs`。其它算子是 in-process。
- 纯算子永不记 rollback 帧。帧只来自 `callFunc` 且对应 Func `sideEffect: true` 且 `intent === "commit"` 且 `run` 已成功返回。
- `sleep` 在 preview 被跳过（仍校验 params）；commit 真睡；**不** rollback。
- `$.input` 只读（再 `set`/`outputTo` 写它 → validate 或 run Issue）。
- 循环节点缺 `maxIter`、`callFunc.funcKey` 未注册、表达式超 `expr` 白名单 → validate 失败，**零执行**。
- `apply` 对 FlowSpec / Func 失败 **永不抛**。只有 `job` 不是对象这类程序员错误才抛。

**调用顺序（调用方无序，引擎有序）**

调用方只调一次 `apply`。引擎固定：`validate →（ok 则）walk → 捕获 → 若 commit 则逆序 rollback 副作用帧`。preview 在 walk 时对副作用 `callFunc`：求值并校验 args，**不**调 `Func.run`，不记帧。

**调用方必须知道的性能**

- 无流式、无部分提交：一次 `apply` 一个 Outcome。
- validate 与 spec 节点数成正比；walk 与**执行**节点数成正比（未走的 `if` 枝不算）。
- `arrayMap` / `arrayReduce` / `for` / `while` 受 `maxIter` 硬顶，超限 = run Issue，然后走补偿。
- preview 不触发 I/O；commit 的耗时 = 纯算 + 每个副作用 Func + `sleep`。
- 每次 apply 自带一份 Slot，可并行多次 `apply`；Func 若碰共享外部状态，重入由 Func 自己负责。

**调用方必须会写的方言（Interface 的一部分，不是第二入口）**

- FlowSpec 根是一个 NodeSpec：`{ type, params, outputTo? }`。序列用 `then`。
- Slot 读写：params 里的字符串 `` `$.a.b` `` 由引擎求值；`outputTo: "tax"` 写入 `$.tax`。
- 算术 / 比较 / 逻辑 **不是** 调用方要记的 NodeType，而是 params 里的单行 `expr`（白名单：`+ - * / %`、比较、`&& || !`、字面量、Slot 读）。复杂业务进 Func，不进 `expr`。
- 业务只经 `{ type: "callFunc", params: { funcKey, args }, outputTo? }`。

（R3 其余 Control / Data / Utility 仍是密封 Catalog 里的 `type` 字符串，不是方法。本期调用方写结算只需 `then` / `if` / `expr` / `callFunc`。）

---

## 2. Usage

```ts
const funcs: FuncRegistry = {
  deductBalance: {
    sideEffect: true,
    params: z.object({ amount: z.number(), userId: z.string() }),
    run: ({ amount, userId }) => db.debit(userId, amount),
    rollback: ({ amount, userId }) => db.credit(userId, amount),
  },
};

const spec = {
  type: "then",
  params: {
    steps: [
      { type: "expr", params: { src: "$.input.amount * 0.06" }, outputTo: "tax" },
      { type: "expr", params: { src: "$.input.amount + $.tax" }, outputTo: "total" },
      {
        type: "if",
        params: {
          cond: "$.total > $.input.threshold",
          then: {
            type: "callFunc",
            params: {
              funcKey: "deductBalance",
              args: { amount: "$.total", userId: "$.input.userId" },
            },
            outputTo: "receipt",
          },
        },
      },
    ],
  },
};

// AI / 测试预览：校验 + 纯算 + 跳过扣款
const preview = await apply({ spec, input, funcs, intent: "preview" });
// preview.ok, preview.slots.tax, preview.slots.total；receipt 不存在；compensated === false

// 生产：失败则逆序 rollback deductBalance
const receipt = await apply({ spec, input, funcs, intent: "commit" });
```

测试同一条 Interface：换一份内存 `funcs`（`run` / `rollback` 记数组），断言 `Outcome`。不要测 rollback 栈。

---

## 3. Implementation 藏什么

全部藏在 `apply` 体内，不导出：

- **Operator Catalog**：写死的 NodeType 分发表（`then`/`if`/`callFunc`/`expr`/`sleep`/…）。不是 seam。
- **Slot 机器**：`$.path` 解析、只读 `$.input`、`outputTo` 写入、params 字符串求值。
- **`expr` 求值器**：白名单 AST；复用并改写现有 `packages/core/src/expr.ts`，**对外不再导出** `$add` / `$state`。
- **validate**：Zod FlowSpec + Catalog 成员检查 + `maxIter` + `funcKey ∈ funcs` + `expr` 白名单。preview 与 commit 共用。
- **dry-run 短路**：walk 到副作用 `callFunc` / `sleep` 时的跳过。
- **rollback 栈**：commit 下成功副作用帧的逆序回放；rollback 钩子抛错追加 `phase: "rollback"` Issue，仍尽量播完。
- **与旧方言的翻译器**：**不存在**。旧 `{ call, seq, $add, /pointer }` 不是本 Module 的 Interface。

---

## 4. Seam / Adapter

**真 seam（两个 Adapter）**：`Job.funcs`。

| Adapter | 谁给 | 用途 |
|---|---|---|
| 生产 | 项目注册的真实 Func（DB / RPC） | `intent: "commit"` |
| 测试 | 内存对象：`run`/`rollback` 推记录 | 同一 `apply`，断言 Outcome |

**假想 seam，不开 port**：Operator Catalog（只有内置一张表）、Slot、expr、rollback 栈、Zod。一个 Adapter = 假想 seam。

依赖类别：parse / expr / math / control = **in-process**，直接加深。FuncRegistry = **local-substitutable**（内存）对引擎、**true external**（真业务）对生产。测试用内存 Adapter，不 mock `apply` 内部。

---

## 5. Trade-offs

**Leverage 高**：学会 `apply` + `intent` 两个词，就得到校验、纯跑、真跑、补偿、Slot 快照、callFunc 隔离。N 个调用方、M 个测试穿过同一条 Interface。删除测试：删掉本 Module 后，每个调用方要重写 validate/walk/补偿/preview——复杂度扩散，不是 pass-through。

**浅的地方**：`intent` 只有两档，没有「只 validate 不求值」第三档。需要纯 schema 时也走 `preview`（会跑纯算）。这是刻意的：第三档会变成第三个入口，摊薄 Depth。`Outcome.issues` 把三类失败压成一个形状，调用方用 `phase` 区分，丢了「抛异常 vs 返回值」的类型钉子。

**Locality**：执行模型、dry-run 规则、Slot 语义、算子分发只住在 `apply` 的 Implementation。改 rollback 策略改一处。Func 作者只编 `run`/`rollback`/`sideEffect`，不碰引擎。

**与现状相处（Q1 = 替换，不做适配层）**

- **替换** `packages/runner` 的 `run()`：它成为 `apply` 的 Implementation，不再是对外 Interface。
- **替换** spec 方言：`call`/`seq`/`parallel`/`if` 判别式 + JSON Pointer **退出** Interface。并存会让调用方学两套，Interface 变浅。旧 JSON 用仓外一次性迁移脚本，不挂在 Module 上。
- **拆** `packages/catalog`：`add`/`sub`/`mul`/`div` 退出 FuncRegistry，沉入 `expr`（消灭「既是 `$add` 又是 catalog `add`」的污染）。`delay` → 算子 `sleep`。`sort`/`concat` 等纯变换进密封 Data 算子或 `expr`，不进 funcs。
- **内化** `packages/core` 的 `evaluate` / `validate` / `state`：Slot 版求值器与 schema 留在 Implementation；测试不许 import 它们来绕过 `apply`。

**Q2（本方案拍板）**：算术做 **params 表达式**，不做 20 个 NodeType。理由：Interface 包含方言；20 个 `type: "add"` 是浅 Interface。结算 demo 用 `expr` + `if` + `callFunc` 即可，Depth 更高。若评审强制 R3 数学节点，仍不新增入口——只是密封 Catalog 多几条 `type`，`apply` 不变。
