# fr-node-service — `apps/node-service`

> 父任务:`../09-22-logic-renderer`。依赖 `runner` + `catalog`。与 react/vue **平级**。

## Goal

一个最小 Node HTTP 服务,演示函数渲染器:接收 JSON spec + 初始 state,用 `@logic-renderer/runner` + `@logic-renderer/catalog` 执行并返回结果。纯逻辑封装,证明「逻辑与框架无关」。

## Requirements

- **R1 `POST /run`**:body `{ spec, initialState? }` 或 `{ example, initialState? }`(用命名示例)→ `200 { ok:true, result, state }`。
- **R2 `GET /examples`**:返回 `examples` 的名称 + 描述(+ 可选 spec)。
- **R3 错误**:`FunctionRenderError` → `400 { ok:false, error:{ message, kind, path, fnName } }`;JSON 解析失败 → 400;未知路由 → 404;其它 → 500。
- **R4 运行**:`node --experimental-strip-types src/server.ts`(Node 22),端口 `PORT` 或 8787;复用 `standardCatalog`。
- **R5 测试**:启动服务,`curl` 验证 happy path、示例、fail-fast 错误、未知路由。

## Acceptance Criteria

- [ ] AC1 `curl POST /run` 跑 `math-pipeline` 返回 `result=142, state.total=142`。
- [ ] AC2 `POST /run { example:"greeting" }` 返回 `Hello, ADA!`。
- [ ] AC3 触发 fail-fast(除零?或未知函数)→ 400 且 `error.kind`/`path` 正确。
- [ ] AC4 `GET /examples` 返回 4 个示例;未知路由 404。
- [ ] AC5 `vp check apps/node-service` 干净。

## Out of Scope

- 鉴权、持久化、生产部署;UI(react/vue 负责)。

## Notes

- 依赖 `@logic-renderer/runner`/`@logic-renderer/catalog`(`workspace:*`,消费 dist,需先 `vp run -r build`)。
- 单文件 `src/server.ts` 仅用 bare specifier 导入,避免相对 `.ts` + strip-types 的坑;类型导入用 `import type`。
