# 概览

**Function Renderer** 是一个声明式的**函数执行引擎**:你把一段 JSON FlowSpec 输入引擎,它按封闭 NodeType 编排执行,业务能力只经 `callFunc` 注入的 FuncRegistry。

设计借鉴:

- [json-render](https://github.com/vercel-labs/json-render):catalog、值表达式、zod 参数校验。
- [LiteFlow](https://github.com/dromara/liteflow):`THEN` / `IF` 等编排算子与共享上下文。

## 分层

| 包                        | 职责                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| `@logic-renderer/core`    | 解析层:NodeSpec / ExprAtom schema、Slot `$.path`、`validate`、错误。              |
| `@logic-renderer/runner`  | 执行层:`run(spec, { input, funcs, preview? })` → `{ state, result }`。            |
| `@logic-renderer/catalog` | 示例业务 Func + 共享 FlowSpec 示例(算术是 ExprAtom,不在 catalog)。                |

## 核心概念

- **FlowSpec**:`{ type, params, outputTo? }` 节点树(见[编排算子](/guide/operators))。
- **funcs**:本次 `run` 注入的 FuncRegistry(不是全局 `register`)。
- **Slot**:`$.input` 为入参(只读);`set` / `outputTo` 写入其它路径。
- **ExprAtom**:`$add` / `$mul` / `$gt` / `$len` 等封闭原子(不是 NodeType,不是 Func)。见[编排算子](/guide/operators)。

## 一个例子

```json
{
  "type": "then",
  "params": {
    "nodes": [
      {
        "type": "set",
        "params": { "path": "$.product", "value": { "$mul": ["$.input.a", "$.input.b"] } }
      },
      {
        "type": "set",
        "params": { "path": "$.total", "value": { "$add": ["$.product", 100] } }
      }
    ]
  }
}
```

`input: { "a": 6, "b": 7 }` → `result = 142`,`state.total = 142`。

去 [LeetCode 在线运行](/leetcode/) 试试。
