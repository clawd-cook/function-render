# 函数渲染器 (function renderer) — 父任务 / 需求总纲

## Goal

在本 Vite+ / TypeScript monorepo 中实现「函数渲染器」:一个**声明式函数执行引擎**及其模块化拆分与多端演示应用。输入一份 JSON 编排 spec,解析为对「已注册函数(catalog)」的编排调用并执行,维护共享状态,产出结果。引擎为纯逻辑;UI/服务为其演示与集成载体。

借鉴(仅参考语义,不作运行时依赖):`submodules/json-render`(defineCatalog、`$state`/条件表达式、JSON Pointer state、zod 参数 schema、onError 心智)与 `submodules/liteflow`(`THEN`/`WHEN`/`IF` 编排算子、共享上下文)。

## Background / Confirmed Facts(已定核心语义)

- 输入 = **JSON 编排树**(canonical),不自研 EL 字符串解析器。
- 数据模型 = **单一共享 state + JSON Pointer 寻址**;`args` 用 `$state` 读,`call.out` 写回返回值。
- MVP 算子(可任意嵌套):`call` / `seq`(串行,THEN) / `parallel`(并行,WHEN) / `if`(条件,IF)。
- 错误 = **fail-fast**:任一 `call` 抛错即中止,抛 `FunctionRenderError`(节点路径 + 函数名 + cause);`parallel` 任一分支失败即整体失败。
- 校验/类型 = **zod ^4.3.6**(与 json-render 一致,经仓库 `catalog:`):函数 `params?: z.ZodType`(`args` 由 `z.infer` 推导 + 运行时 parse);spec/`Condition`/`DynamicValue` 用 zod schema(`z.lazy` 递归)执行前校验。
- 不引入 `@json-render/core`;zod 是唯一新增运行时依赖(引擎侧)。

## Architecture / Deliverables(本轮新增:模块化拆分 + 多端应用)

### Packages(库)
- **`packages/core`** — `@function-renderer/core`,**解析层**:类型 + zod schema(`Node`/`Condition`/`DynamicValue`,`z.infer` 反推类型)+ spec 解析/校验(`parse`/`validate`)+ 表达式(`resolveArgs`/`evaluateCondition`)+ JSON Pointer state(`getByPath`/`setByPath`)+ `FunctionRenderError`。依赖 `zod`。**不含执行、不含 UI。**
- **`packages/runner`** — `@function-renderer/runner`,**执行层**:`run(spec, { catalog, initialState })`、engine(`call`/`seq`/`parallel`/`if`、fail-fast)、`RunContext`。依赖 `core`。
- **`packages/catalog`** — `@function-renderer/catalog`(拟定的「别的模块」,待确认):`defineCatalog` + `FunctionDef`(`params: zod`)+ 一组示例/标准函数,供三个 app 复用。依赖 `core`(类型)。
- 现有 `packages/utils`:保留不动(与本功能无关)。

### Apps(应用 —— 三者平级、互不依赖)
函数渲染器**本身只是与框架无关的纯逻辑**(在 core/runner/catalog 中)。node-service / react / vue 是**同一套通用逻辑在三个框架下的平级宿主**,彼此独立、可互换,仅提供框架外壳 + 最小胶水,并复用**同一份** `catalog` 与示例 spec(保证三端行为一致)。
- **`apps/node-service`** — Node HTTP 服务:`POST /run { spec, input }` → `{ result, state }`(用 `runner` + `catalog`,`node:http` 或轻框架)。
- **`apps/react`** — React 演示:输入 spec(JSON)+ input,运行并展示 `result`/`state`(用 `runner` + `catalog`;`vp create vite -- --template react-ts`)。
- **`apps/vue`** — Vue 演示:同上(`vue-ts` 模板)。
- 现有 `apps/website`:**保留不动**(环境 demo)。

### 依赖方向
`core` ← `runner` / `catalog` ← { `node-service`, `react`, `vue` 三者平级 }。每个 app 仅依赖 `runner`(执行)+ `catalog`(函数与示例),**app 之间无依赖**。通用性靠「逻辑全在库、app 只做框架外壳」保证。

## Proposed Task Tree(父 + 子,待确认)

- 父:`09-22-function-renderer`(持有本总纲、跨子验收、集成 review;不直接实现)。
- 子(各自可独立规划/实现/验收/归档;依赖写进各自 artifacts):
  1. `core`(packages/core)——无前置
  2. `runner`(packages/runner)——依赖 core
  3. `catalog`(packages/catalog)——依赖 core
  4. `node-service`(apps/node-service)——依赖 runner+catalog
  5. `react`(apps/react)——依赖 runner+catalog
  6. `vue`(apps/vue)——依赖 runner+catalog
- 依赖仅为「库→app」纵向:先做 `core`,再做 `runner`/`catalog`(可并行)。**三个 app(4/5/6)互为平级、互不依赖**,库就绪后可按任意顺序实现,验收标准各自独立。
- 实现批次(仅为推进节奏,非依赖):先 `core`→`runner`→`catalog` 打通并单测;随后三个 app 作为平级项各自接入同一 runner+catalog。

## Requirements(总纲,细化落到子任务)

- **R1 core**:zod schema + 类型;`parse(specJson)`→ 校验通过的 `Node`,非法输入抛 `FunctionRenderError(kind="validation")`;`resolveArgs`/`evaluateCondition`;JSON Pointer state 读写;`FunctionRenderError`。
- **R2 runner**:`run(spec,{catalog,initialState})` 按 `call`/`seq`/`parallel`/`if` 语义执行,维护共享 state,返回 `{ state, result }`;fail-fast 与 `call` 参数 `params.parse`。
- **R3 catalog**:`defineCatalog` 归一化 `FnImpl | { params?, run }`;标准/示例函数集(如 `add`/`fetchJson`/`delay` 等),供 apps 使用。
- **R4 node-service**:HTTP 端点跑 spec,返回结果/错误(错误映射为 4xx/5xx + 可读消息);可 `curl` 验证。
- **R5 react / R6 vue**:最小 UI —— spec 文本框 + input + Run,展示 result/state 与错误;能在浏览器手测跑通一个示例 spec。
- **R7 质量**:各库有 Vitest 单测;`vp run -r test`/`vp run -r build` 全绿;新代码 `vp check` 无 lint/类型错误;端到端(node-service `curl` + react/vue 浏览器)可演示。

## Acceptance Criteria(父级,汇总子任务)

- [ ] AC1 `core` 能解析/校验 spec 与表达式并单测通过。
- [ ] AC2 `runner` 四算子语义 + 嵌套 + fail-fast 单测通过。
- [ ] AC3 `catalog` 提供可复用函数集并被 apps 引用。
- [ ] AC4 `node-service` `POST /run` 端到端返回正确 result/state(curl 证据)。
- [ ] AC5 `react`、`vue` 各能在浏览器手测跑通示例 spec(录屏证据)。
- [ ] AC6 `vp run -r test` / `vp run -r build` 全绿;新代码 `vp check` 干净。

## Out of Scope

- 可视化流程编辑器(拖拽画布);AI/LLM 生成 spec。
- liteflow 的热刷新/分布式规则存储。
- 后续增强:`switch`/`for`/`while`/`retry`、节点级 `onError` 链、EL 字符串糖层、`$computed`/`$template`/`$cond` 值表达式。

## Resolved Decisions

- Q-A 已定:「别的模块」= `packages/catalog`(`defineCatalog` + 标准函数 + 共享示例 spec);保持三库,不再细拆。
- Q-B 已定:apps 职责如上;现有 `apps/website` 保留不动。
- Q-C 已定:「父任务 + 6 子任务」。**三个 app 平级、互不依赖**,均只依赖 `runner`+`catalog`,复用同一份 catalog/示例;不存在 node-service 优先或 app 间依赖。库→app 为唯一纵向依赖。

## Open Questions

- 无阻塞项。
