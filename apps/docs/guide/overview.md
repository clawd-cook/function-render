# 概览

**Function Renderer** 是一个声明式的**函数执行引擎**:你把一段 JSON 编排 spec 输入引擎,它解析为对「已注册函数(catalog)」的编排调用并执行,产出结果。纯逻辑、与框架无关。

设计借鉴:

- [json-render](https://github.com/vercel-labs/json-render):`catalog`(函数目录)、`$state` 表达式、JSON Pointer 状态、zod 参数校验。
- [LiteFlow](https://github.com/dromara/liteflow):`THEN` / `WHEN` / `IF` 等编排算子与共享上下文。

## 分层

| 包                           | 职责                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `@function-renderer/core`    | 解析层:zod schema/类型、JSON Pointer 共享状态、表达式、校验、错误。   |
| `@function-renderer/runner`  | 执行层:`run(spec, { catalog, initialState })` → `{ state, result }`。 |
| `@function-renderer/catalog` | 函数目录工具 + 标准函数(含 `sort` 等复杂算子)+ 共享示例。             |

> LeetCode 题解不再单独成包:每题的**协议(spec)**直接放在文档站里、在浏览器在线运行(见 [LeetCode](/leetcode/))。

## 核心概念

- **spec**:一棵 JSON 编排树(节点见[编排算子](/guide/operators))。
- **catalog**:一组具名函数(可带 zod 参数 schema)。
- **共享 state**:单一可变对象,用 JSON Pointer(如 `/user/id`)寻址;`args` 用 `{ "$state": "/ptr" }` 读,`call` 节点可用 `out` 写回。
- **结果**:`run` 返回最终 `state` 与顶层节点的 `result`。

## 一个例子

```json
{
  "seq": [
    {
      "call": "mul",
      "args": { "a": { "$state": "/a" }, "b": { "$state": "/b" } },
      "out": "/product"
    },
    { "call": "add", "args": { "a": { "$state": "/product" }, "b": 100 }, "out": "/total" }
  ]
}
```

初始 state `{ "a": 6, "b": 7 }` → `result = 142`,`state.total = 142`。

去 [LeetCode 在线运行](/leetcode/) 试试真实算法题。
