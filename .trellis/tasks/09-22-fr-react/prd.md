# fr-react — `apps/react`

> 父任务:`../09-22-function-renderer`。依赖 `runner` + `catalog`。与 node-service/vue **平级**。

## Goal

最小 React(Vite,vite-plus)应用,演示函数渲染器:示例下拉 + spec 文本框 + 初始 state 文本框 + Run,展示 `result`/`state` 或错误。复用**同一** `standardCatalog` 与 `examples`,与 node-service/vue 行为一致。

## Requirements

- **R1** 用 `vp create vite -- react --template react-ts` 脚手架(vite-plus 原生:`vp dev`/`vp build`,`@vitejs/plugin-react`)。
- **R2** `App.tsx`:选择 `examples` → 载入 spec/initialState 到文本框;Run → `JSON.parse` → `run(spec,{catalog:standardCatalog,initialState})` → 展示 `{result,state}`;`FunctionRenderError` 展示 `{message,kind,path,fnName}`。
- **R3** 依赖 `@function-renderer/runner`/`@function-renderer/catalog`(`workspace:*`)。
- **R4** 浏览器手测四示例 + 错误路径;`vp check apps/react` 干净;`vp run --filter react build` 绿。

## Acceptance Criteria

- [ ] AC1 页面载入含示例下拉/两个 JSON 文本框/Run/catalog 页脚。
- [ ] AC2 math-pipeline → 142;greeting → "Hello, ADA!";parallel-demo → [10,15]。
- [ ] AC3 未知函数 spec → Error 面板 `kind=validation`。
- [ ] AC4 `vp check apps/react` 干净;`vp run --filter react build` 绿。

## Out of Scope

- 可视化 trace、拖拽编辑;鉴权/持久化。

## Notes

- 消费 runner/catalog 的 dist(需先 `vp run -r build`)。
