# Design (父级) — 跨模块架构总览

> 各子任务的详细设计在各自 `.trellis/tasks/09-22-fr-*/design.md`。本文件只定义**边界、共享契约、依赖与通用性**。

## 1. 模块边界与依赖

```
packages/core     解析层(纯逻辑):types + zod schema + parse/validate + expr + state + errors
      ▲
      ├── packages/runner    执行层:run(spec,{catalog,initialState}) + engine(call/seq/parallel/if) + RunContext
      └── packages/catalog   函数目录:defineCatalog + FunctionDef(zod params) + 标准函数 + 共享示例 spec
                    ▲
   ┌────────────────┼────────────────┐   ← 三者平级、互不依赖
apps/node-service   apps/react     apps/vue
 (POST /run)        (最小 UI)       (最小 UI)
```

- 唯一纵向依赖:`core ← runner`、`core ← catalog`、`{runner,catalog} ← 各 app`。
- 三个 app 互不依赖、可互换;逻辑全在库,app 只做框架外壳 + 最小胶水。
- 现有 `packages/utils` / `apps/website` 保持不动。

## 2. 共享契约(跨模块类型 —— 由 `core` 定义并导出,其余模块只消费)

- `StateModel = Record<string, unknown>`;JSON Pointer 读写 `getByPath`/`setByPath`。
- `DynamicValue`(`$state` 值表达式)/ `Condition`(`$state`+比较/`$and`/`$or`/隐式 AND)/ `Node`(`call`/`seq`/`parallel`/`if`)—— 均由 `core` 的 zod schema 定义,类型用 `z.infer` 反推。
- `FunctionRenderError { kind: "validation"|"call"; path; fnName?; cause }` —— 由 `core` 定义,runner/apps 复用。
- `Catalog` / `FunctionDef<S extends z.ZodType>{ params?: S; run(args: z.infer<S>, ctx): ...}` / `RunContext{ get,set,state }` —— 类型基座在 `core`;`defineCatalog` 实现在 `catalog`;`run` 实现在 `runner`。
- 运行时依赖:仅 `zod ^4.3.6`(经仓库 `catalog:`),被 core/runner/catalog 复用。

## 3. 执行语义(runner,契约摘要;详见 fr-runner/design.md)

`run(spec, { catalog, initialState }) → Promise<{ state, result }>`:先 `core.validate(spec, catalogNames)`,再 `structuredClone` 初始 state,递归 `exec(node,path)`:`call`(求值 args → `params.parse` → `run` → 可选 `out` 写回)/`seq`(串行,返回末项)/`parallel`(`Promise.all`,返回数组)/`if`(条件选分支)。fail-fast:任一 `call` 抛错包成 `FunctionRenderError(kind="call")` 上抛;`parallel` 任一分支失败即整体失败。

## 4. 通用性保证(apps)

- 三个 app 复用**同一** `catalog`(含标准函数与示例 spec),UI 仅负责:接收 spec(JSON)+ input → 调 `runner.run` → 展示 `result`/`state`/错误。
- node-service 暴露 `POST /run {spec,input} → {result,state}`;react/vue 提供等价的浏览器交互。三端对相同 spec 应产生相同 result/state(通用性验收)。

## 5. 兼容 / 回滚

- 纯新增 packages/apps;`pnpm-workspace.yaml` 已含 `packages/*`、`apps/*`,自动纳入。`catalog:` 增加 `zod`。
- 回滚:删除对应新增目录即可;库→app 单向依赖,无环、无跨包副作用。

## 6. Reference Map(借鉴出处)

- JSON Pointer/state:`submodules/json-render/packages/core/src/state-store.ts`、`.../types.ts`。
- 条件求值:`.../core/src/visibility.ts`。
- catalog/值表达式/onError 心智:`.../core/src/actions.ts`、`core/README.md`。
- 编排算子心智:`submodules/liteflow/README*.md`、`liteflow-el-builder`。
- 库脚手架样板:`packages/utils/*`;app 脚手架:`vp create vite -- --template react-ts|vue-ts`。
