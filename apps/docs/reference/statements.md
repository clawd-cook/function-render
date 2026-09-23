# 语句（NodeType）

spec 是一棵 JSON 树，每个节点 `{ "type", "params", "outputTo?" }`。`type` 属于封闭 **Operator Catalog**；项目不能 `registerOperator`。

渐进学习：[控制流](/guide/control-flow) · [循环](/guide/loops) · [函数](/guide/functions) · [集合](/guide/collections)。复杂度阶梯见 [设计理念](/guide/rationale)。

## Control

| type | 层 | 要点 |
|------|----|------|
| [`then`](/reference/statements/then) | L0 | `nodes` 顺序执行 |
| [`if`](/reference/statements/if) | L0 | `Boolean(evaluate(condition))` 选枝 |
| [`switch`](/reference/statements/switch) | L1 | `Object.is`；`match` 字面量 |
| [`tryCatch`](/reference/statements/tryCatch) | L1 | 失败写 `$.error`；body 禁 sideEffect callFunc |
| [`while`](/reference/statements/while) | L2 | 先判条件；**必须** `maxIter` |
| [`for`](/reference/statements/for) | L2 | 遍历数组；超 `maxIter` → run 错 |
| [`when`](/reference/statements/when) | L5 | 并行；默认 `waitAll` / `fastFail` |

## Invocation

| type | 层 | 要点 |
|------|----|------|
| [`callFunc`](/reference/statements/callFunc) | L0 | 唯一业务扩展点；`preview` 永不 `Func.run` |

## Data

| type | 层 | 要点 |
|------|----|------|
| [`get`](/reference/statements/get) | L0 | 读 Slot |
| [`set`](/reference/statements/set) | L0 | 写 Slot；`$.input` 只读 |
| [`arrayMap`](/reference/statements/arrayMap) | L4 | map 子树 |
| [`arrayFilter`](/reference/statements/arrayFilter) | L4 | filter |
| [`arrayReduce`](/reference/statements/arrayReduce) | L4 | reduce |

## Utility

| type | 层 | 要点 |
|------|----|------|
| [`log`](/reference/statements/log) | L5 | 内部 sink |
| [`assert`](/reference/statements/assert) | L5 | 条件假 → run 错 |
| [`sleep`](/reference/statements/sleep) | L5 | `preview` 跳过 |
| [`constant`](/reference/statements/constant) | L5 | 字面量（不求值） |
| [`expr`](/reference/statements/expr) | L5 | 求值一张 Expr |
