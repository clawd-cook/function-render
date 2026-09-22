# 编排算子

spec 是一棵 JSON 树,每个节点**有且仅有一个**判别键。

## `call` — 调用函数

```json
{
  "call": "twoSum",
  "args": { "nums": { "$state": "/nums" }, "target": { "$state": "/target" } },
  "out": "/result"
}
```

- `args`:参数对象,支持 `{ "$state": "/ptr" }` 从共享 state 读取;其余为字面量。
- `out`(可选):把返回值写回该 JSON Pointer。
- 若该函数在 catalog 里声明了 zod `params`,调用前会校验参数。

## `seq` — 串行

```json
{ "seq": [ NodeA, NodeB ] }
```

顺序执行,`result` 为最后一个子节点的结果。

## `parallel` — 并行

```json
{ "parallel": [ NodeA, NodeB ] }
```

`Promise.all` 语义,`result` 为各子节点结果数组。

## `if` — 条件

```json
{ "if": { "$state": "/flag" }, "then": NodeA, "else": NodeB }
```

条件语法:`{ "$state": "/p" }`(真值)、比较 `eq/neq/gt/gte/lt/lte`、`not`、数组隐式 AND、`{ "$and": [...] }`、`{ "$or": [...] }`。

## `switch` — 多路分支

```json
{ "switch": {"$state":"/op"},
  "cases": { "double": NodeA, "square": NodeB },
  "default": NodeC }
```

对 `switch` 求值 → 以 `String(值)` 命中 `cases[key]`,否则走 `default`。

## `for` — 遍历 / 循环

```json
{ "for": {"$state":"/items"}, "as": "/n", "indexAs": "/i", "body": Node }
```

`for` 求值为**数组**逐元素、或**数字 n** 作 `0..n-1`;每次把 item / index 写到 `as` / `indexAs`,顺序执行 `body` 并收集结果数组。

## 错误(fail-fast)

任一 `call` 抛错即中止,抛出 `FunctionRenderError`(含 `kind`、`path` 节点定位、`fnName`、`cause`);`parallel` 任一分支失败即整体失败;非法参数为 `kind: "validation"`。
