# Design — operator runtime 实现

权威设计全文：`.trellis/tasks/09-22-fr-operator-system/design.md`。  
硬切清单：`.trellis/tasks/09-22-fr-operator-system/research/hard-cut-inventory.md`。  
放置规则 / preview / tryCatch / v1≠视界：以该 design 为准；本文件只定实现落点与边界。

## Module Interface（实现必须对齐）

```ts
function validate(spec: unknown, options: { funcs: FuncRegistry }): FlowSpec;

function run(
  spec: unknown,
  options: { input: unknown; funcs: FuncRegistry; preview?: boolean },
): Promise<{ state: SlotSpace; result: unknown }>;
```

- 失败：`FunctionRenderError { phase: "validate" | "run" | "rollback"; path: string; message: string; funcKey?: string }`
- 测试与 host **只**穿过这两个入口；不 import 分发表、不 new Engine。

## 包落点

| 包 | 职责 |
|----|------|
| `packages/core` | NodeSpec / ExprAtom schema、Slot `$.path`、`evaluate`、`validate`、Error；删 `$state`/JSON Pointer 对外形态 |
| `packages/runner` | `run`、walk、preview 短路、rollback 栈 |
| `packages/catalog` | 示例/业务 Func；删 `add`/`sub`/`mul`/`div`/`delay`；可提供结算 `deductBalance` mock |
| apps（4 hosts） | 改用新 `run` 签名与新方言 fixtures |

## v1 vs 视界

- **v1 必交付**：`then` `if` `set` `callFunc` + `$mul` `$add` `$gt` + 结算 demo / preview / rollback 单测。
- **视界（批次 2，不挡 AC）**：其余 NodeType / ExprAtom / `tryCatch` 规则 — 见 system `design.md` §4–§5、§7。

## 硬切原则

- 无适配器、无 compile 旧→新。重写 fixtures 与测试。
- Catalog **引擎版本封闭**：项目不能 `registerOperator`；`funcs` 是每次 `run` 的值。

## 不变量（实现自检）

1. 未知 type / 未知 `$atom` / 缺 `funcKey` → validate，零执行。
2. 只有 `callFunc` 读 `funcs`。
3. ExprAtom 与纯 NodeType 永不入 rollback 栈。
4. `preview === true` → 永不 `Func.run`、跳过 `sleep`。
5. `$.input` 只读；`input` 入 Slot 前 `structuredClone`。
