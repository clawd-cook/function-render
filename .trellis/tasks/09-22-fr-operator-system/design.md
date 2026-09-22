# Design — Func-Render 算子引擎

深化对象：一个 Module，对外只有 `run` / `validate`。Operator Catalog、Expr 求值、Slot、rollback、preview 都是 Implementation。真 seam 只有 FuncRegistry。

词汇：Module / Interface / Implementation / Seam / Adapter / Depth / Locality。域词：Operator / NodeType / ExprAtom / Func / FuncRegistry / NodeSpec / Slot / FlowSpec。

---

## 1. Module Interface

```ts
function validate(spec: unknown, options: { funcs: FuncRegistry }): FlowSpec;

function run(
  spec: unknown,
  options: { input: unknown; funcs: FuncRegistry; preview?: boolean },
): Promise<{ state: SlotSpace; result: unknown }>;
```

- `run` 先 `validate`。`preview` 默认 `false`。
- `funcs` 是值：每次调用自带一份表，没有 `register()`。
- 失败抛 `FunctionRenderError { phase: "validate" | "run" | "rollback"; path: string; message: string; funcKey?: string }`。
- 调用方与测试只穿过这两个入口。不断言 rollback 栈、不 import 分发表、不 new Engine。
- `validate` **不执行**任何 `Func.run`；**会读** `funcs` 的键与可选 `params` schema。AI「只拒 spec」= 只调 `validate`，不是「不传 registry」。

**调用方默认要学的（v1 Depth）**：`run` + `{ type, params }` + `then`/`if`/`set`/`callFunc` + `$mul`/`$add`/`$gt`。视界其余 NodeType / ExprAtom 不是 v1 必学面。

**不变量**

1. `type` ∈ **当前引擎版本**的 Operator Catalog。未知 type / 缺参 / `while|for` 无 `maxIter` / `funcKey ∉ funcs` → validate，零执行。项目不能扩表；引擎发版可以。
2. 只有 `callFunc` 读 `funcs`。`$mul` 不是 type，也不是 funcKey。
3. ExprAtom 与纯 NodeType 永不入 rollback 栈。
4. **preview 安全保证**：`preview === true` 时 **永不**调用 `Func.run`，也跳过 `sleep`。与 `sideEffect` 标记无关。误标 `sideEffect` 不破坏 preview；它只破坏 live rollback 的诚实性，责任在注入 `funcs` 的 host。
5. 副作用帧只在 `preview === false` 且 `callFunc` 打到 `sideEffect: true` 且 `run` 已成功返回时入栈。
6. `$.input` 只读。`input` 在 `run` 内 `structuredClone` 后封入 Slot。
7. Expr 不能调 Func、不能 I/O、不能中缀。

**顺序（调用方不驱动）**

`validate → walk → 捕获 → 若非 preview 则逆序 rollback 副作用帧 → 再抛`。

**错误**

- validate：抛，不 walk。
- run：fail-fast。`when` 默认 `fastFail`（任一子节点失败即失败）。
- rollback 钩子失败：`phase: "rollback"`，`cause` 为原错误；尽量播完其余帧再抛。
- 程序员把 `options` 传成非对象才允许抛普通 TypeError。

**性能（调用方必须知道）**

- validate O(节点 + 表达式叶)。Expr 同步、in-process。
- `run` 变 async 只因为 Func 或 `sleep`。
- walk 只计执行到的节点（未走的 `if` 枝不算）。
- `arrayMap` / `for` / `while` 受 `maxIter` 硬顶。
- preview 无 I/O（保证，不是尽力而为）；一次 `run` 一份 Slot，可并行多次 `run`。
- Func 若碰共享外部状态，重入由 Func 负责。

**删除测试**：删掉本 Module 后，每个 host 要重写校验、求值、控制流、preview、补偿。不是透传。

---

## 1b. 放置规则（ExprAtom vs NodeType vs Func）

未来字符串 / 日期 / `$len` 用这张表做 yes/no，不再重开身份辩论。

| 问 | 是 → 放哪 |
|----|-----------|
| 两项目会写出不同实现，或会碰 I/O / 时钟 / 网络 / DB？ | **Func**（只经 `callFunc`） |
| 需要子 `NodeSpec`，或绑定循环 Slot（`itemKey`），或改变控制流？ | **NodeType** |
| 纯、同步、值→值、无子节点？ | **ExprAtom** |

附加：

- 同一能力禁止同时出现在两张表（这才是对「`add` 双身份」的根治，不是「表永远不再加行」）。
- `$map` 禁止：有子图。用 `arrayMap`。
- `$len` / `$at` / `$concat` / `$pick` / `$dateAdd` 按上表是 ExprAtom，可在 **后续引擎版本** 加入视界，不必做成 Func 或 NodeType。
- `object` / `array` 不做 NodeType：字面量已递归求值。
- Catalog **按版本封闭**：v1 冻结为结算子集；视界清单是承诺过的扩展方向，进表 = 发版，不是项目 `register`。

**若做成「可版本化、偶尔扩展的封闭表」会失败吗？** 不会。要防的失败模式是：项目把 `deductBalance` 收成新 `type`，Catalog 再次不可穷举。引擎 v2 增加 `$len` 不触发该失败。硬切旧方言与「跨版本加原子」是两件事。

---

## 2. 三张封闭表 + 一张注入表

```
FlowSpec JSON
    │
    ▼
 Operator Catalog (密封, in-process)     Expr Catalog (密封, in-process)
    │                                         │
    │  type: then/if/set/callFunc/…           │  $mul / $gt / $and / …
    ▼                                         ▼
 walk + Slot                                      evaluate(expr)
    │
    └── callFunc ── seam ──► FuncRegistry (本次 run 的值)
                              生产 Adapter = 真业务 Func
                              测试 Adapter = 内存假 Func
```

假想 seam，不开 port：Operator Catalog、Expr Catalog、Slot、Zod、rollback 栈。一个 Adapter = 假想 seam。

后续实现落点（本任务不改代码）：

| 职责 | 包 |
|------|-----|
| NodeSpec / Expr schema、Slot、`evaluate`、`validate`、Error | `packages/core` 替换对外 Interface |
| `run`、preview 短路、rollback 栈 | `packages/runner` 替换 `run(spec,{catalog,initialState})` |
| 示例/业务 Func 只留真业务与 demo；删除 `add`/`sub`/`mul`/`div`/`delay` | `packages/catalog` |

---

## 3. 方言

### NodeSpec

```ts
type NodeSpec = {
  type: NodeType;
  params: Record<string, unknown>;
  outputTo?: string; // Slot 路径，"$.tax" 或 "tax"（后者视为 "$.tax"）
};

type FlowSpec = NodeSpec; // 根必须是一个节点；序列用 type:"then"
```

### Expr

一个 JSON 值，求值规则：

| 形状 | 含义 |
|------|------|
| 数字 / 布尔 / null | 字面量 |
| 字符串，匹配 `/^\$\.[A-Za-z_][\w.]*$/` | Slot 读 |
| 其它字符串 | 字面量（不是中缀；`"$.a + 1"` 是普通字符串，**不会**计算） |
| 数组 | 逐元 `evaluate` |
| 单键且键 ∈ Expr Catalog | ExprAtom，值先对每个操作数 `evaluate` 再运算 |
| 单键 `$lit` | 强制字面量（用来写出看起来像 Slot 的字符串） |
| 其它对象 | 字面量对象，递归求值各字段（用于 `object`/`args`） |

禁止：中缀、未知 `$xxx`、Expr 内 `callFunc`。`$if` 三元不进 v1（分支用 NodeType `if`）。`$map` 永不进 Expr（放置规则：有子图）。

### Slot

- 根空间：`{ input, …outputTo }`。`state` 就是这份空间。
- `$.input` 只读。
- `set` / `outputTo` 沿点号建中间对象。
- `for` / `arrayMap` / `arrayReduce` 的 `itemKey` / `accumKey`：迭代前写入，迭代后恢复旧值（避免泄漏）。

---

## 4. NodeType 清单

**v1 必交付**：`then` `if` `set` `callFunc`。其余是视界，实现任务批次 2，不挡「设计是否足够」。

副作用列：`none` | `sleep` | `callFunc*`（仅当目标 Func `sideEffect: true`；preview 下全部 `callFunc` 都不跑）。

### Control

| type | params | 副作用 | 行为 |
|------|--------|--------|------|
| `then` | `nodes: NodeSpec[]` | none | 顺序执行，返回最后结果；空数组 → `undefined` |
| `when` | `nodes: NodeSpec[]`; `waitAll?: boolean` (默认 true); `failStrategy?: "fastFail" \| "allSettled"` (默认 `fastFail`) | none | 并行。`fastFail` = 首个失败即失败。`allSettled` 等齐后若有失败再失败（仍不聚合为成功）。返回结果数组 |
| `if` | `condition: Expr`; `trueBranch: NodeSpec`; `falseBranch?: NodeSpec` | none | `Boolean(evaluate(condition))` 选枝；无 false 且条件假 → `undefined` |
| `switch` | `input: Expr`; `cases: { match: unknown; node: NodeSpec }[]`; `default?: NodeSpec` | none | `Object.is` 匹配 `evaluate(input)` 与 `match`（`match` 不求值，是字面量）。无中则 default |
| `while` | `condition: Expr`; `body: NodeSpec`; `maxIter: number` | none | 每轮先判条件。超 `maxIter` → run 错。缺 `maxIter` → validate 错 |
| `for` | `items: Expr`; `itemKey: string`; `indexKey?: string`; `body: NodeSpec`; `maxIter: number` | none | `items` 必须是数组。次数 = `min(items.length, maxIter)`，超长 → run 错 |
| `tryCatch` | `body: NodeSpec`; `catch: NodeSpec`; `finally?: NodeSpec` | none | **不进 v1**。视界：body 失败走 catch（`$.error`）。**validate 拒绝** body 子树里目标 Func `sideEffect: true` 的 `callFunc`。catch/finally 允许副作用（用于补偿）。不采用「吞了再靠调用方补」 |

### Invocation

| type | params | 副作用 | 行为 |
|------|--------|--------|------|
| `callFunc` | `funcKey: string`; `args: Record<string, Expr>` | callFunc* | 求值 args → 可选 `Func.params.parse` → **preview 则永不 `run`**，否则 `await run` → 成功且 sideEffect 且非 preview 则入栈 |

### Data（全 none；一阶 pick/merge 不在此列，见 Expr 视界）

| type | params | 行为 |
|------|--------|------|
| `get` | `path: string` | 读 Slot，返回值 |
| `set` | `path: string`; `value: Expr` | 写入并返回 value。**v1** |
| `arrayMap` | `items: Expr`; `itemKey: string`; `body: NodeSpec`; `maxIter?: number` | 对每个元素跑 body，收集返回值。默认 `maxIter = items.length`，仍硬顶 |
| `arrayFilter` | `items: Expr`; `itemKey: string`; `condition: Expr` | 绑定 `itemKey` 后求值 condition |
| `arrayReduce` | `items: Expr`; `itemKey: string`; `accumKey: string`; `init: Expr`; `body: NodeSpec`; `maxIter?: number` | body 的返回值成为下一轮 accum |

### Utility

| type | params | 副作用 | 行为 |
|------|--------|--------|------|
| `log` | `message: Expr`; `level?: "info" \| "warn" \| "error"` | none | 写入 Implementation 的 trace 列表（`run` 的 `state` 不自动含日志，除非 `outputTo`）。本期可 no-op + 测试可注入的内部 sink，不导出 |
| `assert` | `condition: Expr`; `message: string` | none | 条件假 → run 错 |
| `sleep` | `ms: number` | sleep | preview 跳过仍校验 `ms ≥ 0`；不 rollback |
| `constant` | `value`（字面量，不求值） | none | 返回 value |
| `expr` | `value: Expr` | none | 求值一张 Expr 并返回。禁止字符串中缀 |

---

## 5. ExprAtom 清单（不是节点，不是 Func）

操作数先 `evaluate`。类型不符 → run 阶段 `phase: "run"`（结构合法但值不行）；未知原子 → validate。

| 原子 | 操作数 | 结果 |
|------|--------|------|
| `$add` `$mul` | 1..n 数字 | 和 / 积 |
| `$sub` `$div` `$mod` `$pow` | [a, b] | 差 / 商 / 模 / 幂。`$div` 除零 → run 错 |
| `$abs` `$ceil` `$floor` `$round` | 1 数字 | 对应 Math |
| `$gt` `$gte` `$lt` `$lte` | [a, b] 数字 | bool |
| `$eq` `$neq` | [a, b] | 深比较 bool（对象用稳定 JSON；不保证 key 序） |
| `$and` `$or` | 1..n | 全真 / 任一真（不短路也可，本期不承诺短路） |
| `$not` | 1 | 取反 |

`$div` 不提供 `zeroHandler` 配置（少一个调用方要学的旋钮；除零就是错）。

**视界一阶数据原子**（不是 NodeType，按放置规则可进后续版本）：`$len` `$at` `$concat` `$pick` `$omit` `$merge`。不在 v1。`$map` 永不进。

---

## 6. Func

```ts
type Func =
  | ((args: Record<string, unknown>) => unknown)
  | {
      run: (args: Record<string, unknown>) => unknown;
      params?: ZodType;
      sideEffect?: boolean; // 默认 false
      rollback?: (args: Record<string, unknown>, result: unknown) => unknown;
    };

type FuncRegistry = Readonly<Record<string, Func>>;
```

裸函数 = 纯。`rollback` 缺省且 `sideEffect: true`：入栈，补偿时 no-op（仍算补偿过，避免「有副作用却无法声明补偿」卡死；调用方应显式给钩子）。

---

## 7. 执行模型

```
validate(spec, { funcs })
  未知 type / 未知 $atom / 缺 maxIter / 缺 funcKey
  → throw validate, state 未建

structuredClone(input) → $.input
walk(root):
  纯节点 / ExprAtom     → 计算，写 outputTo
  sleep                 → preview? skip : 真睡
  callFunc              → 求值+parse args
                          preview? 永不 run
                          else run; 成功 && sideEffect → push 帧

catch:
  preview? 直接抛（无帧）
  else 逆序 await frame.rollback(args, result); 再抛
```

`tryCatch` **不进 v1**。视界不变量（也是 PRD 验收，不是尖角注释）：

- `validate`：若 `tryCatch.body` 子树含 `callFunc` 且对应 Func `sideEffect: true` → validate 失败。
- 因此 catch 只处理纯计算 / `assert` / 除零 / 无副作用 `callFunc` 的失败。
- catch/finally 里允许副作用 `callFunc`（补偿或降级写入）。
- 未捕获的失败仍走全局逆序 rollback。

---

## 8. 结算 demo（无需新算子）

```json
{
  "type": "then",
  "params": {
    "nodes": [
      {
        "type": "set",
        "params": {
          "path": "$.tax",
          "value": { "$mul": ["$.input.orderAmount", 0.06] }
        }
      },
      {
        "type": "set",
        "params": {
          "path": "$.totalAmount",
          "value": { "$add": ["$.input.orderAmount", "$.tax"] }
        }
      },
      {
        "type": "if",
        "params": {
          "condition": { "$gt": ["$.totalAmount", 1000] },
          "trueBranch": {
            "type": "callFunc",
            "params": {
              "funcKey": "deductBalance",
              "args": {
                "merchantId": "$.input.merchantId",
                "amount": "$.totalAmount"
              }
            },
            "outputTo": "$.receipt"
          }
        }
      }
    ]
  }
}
```

```ts
await run(spec, {
  input: { orderAmount: 2000, merchantId: "m1" },
  funcs: {
    deductBalance: {
      sideEffect: true,
      params: z.object({ merchantId: z.string(), amount: z.number() }),
      run: ({ merchantId, amount }) => db.debit(merchantId, amount),
      rollback: ({ merchantId, amount }) => db.credit(merchantId, amount),
    },
  },
});
// preview: true → slots.tax === 120, totalAmount === 2120, 不调 debit
```

---

## 9. 与现状的硬切

| 现状 | 之后 |
|------|------|
| `{ call, seq, parallel, if }` | `{ type, params }`；`seq→then`，`parallel→when`，`call→callFunc` |
| `{ $state: "/ptr" }` / JSON Pointer | `$.path` |
| `$add` 同时是表达式与 catalog 函数 | `$add` 只当 ExprAtom；`standardCatalog.add` 删除 |
| `run(spec, { catalog, initialState })` | `run(spec, { input, funcs, preview? })` |
| 无 rollback / preview | 见 §7 |
| 旧 demo / docs spec | 仓内约 15 份 spec + 4 host，见 `research/hard-cut-inventory.md`。无外部消费者。后续任务重写，不挂适配器 |

`packages/core` 的 `evaluate` 可作 Implementation 起点（原子表已接近），但对外不再导出 `$state` 旧条件形态。测试不得绕过 `run`/`validate` 去打内部求值器——内部求值可以有单测，那是 Module 的内部 seam，不是对外 Interface。

---

## 10. 取舍

**Depth（诚实）**：v1 调用方学会 `run` + 四个 NodeType + 三个原子 + `callFunc`，就得到结算、preview 安全、副作用补偿。视界 Catalog 是封闭视界，不是 v1 Interface 必学面。Math 做成 20 个 NodeType、自由中缀、`compile/enact` 仍否。

**浅处**：`validate` 与 `run` 第一步重复——留给 AI 拒 spec；它仍要 registry，只是不执行 Func。`sideEffect` 诚实性仍是 host 的 live 责任（preview 已不再依赖它）。

**Locality**：方言、执行、补偿集中在 core+runner。业务只住在 `funcs`。改 `$div` 除零策略改一处；新业务零改 Catalog。

**本任务边界**：契约到此。Zod 代码、最小运行时、文档站重写，见 `implement.md` 的后续任务，不在本任务执行。
