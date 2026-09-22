# Research — 参考 API 映射(json-render / liteflow → function-renderer)

实现时可直接查阅以下子模块源文件(已本地检出)。本引擎**仅借鉴语义、自实现最小子集**,不作为 npm 依赖。

## json-render(TS,主要参考)
- `submodules/json-render/packages/core/src/state-store.ts`
  - `immutableSetByPath(root, pointer, value)`:JSON Pointer 写入 + 沿途创建(下一段数字→数组)+ `"-"` push。→ 我们实现**就地可变**版 `setByPath`。
  - `parseJsonPointer` / `createStateStore`(get/set/subscribe)。我们无需 subscribe。
- `submodules/json-render/packages/core/src/types.ts`
  - `getByPath(state, pointer)`、`DynamicValue`/`resolveDynamicValue`、`StateModel = Record<string, unknown>`。
  - Pointer 转义:`~1`→`/`,`~0`→`~`。
- `submodules/json-render/packages/core/src/visibility.ts`
  - 条件语法与求值:`{$state, eq/neq/gt/gte/lt/lte/not}`、数组隐式 AND、`{$and}`/`{$or}`、`boolean`。→ 我们取「无 `$item`/`$index`」子集做 `evaluateCondition`。
- `submodules/json-render/packages/core/src/actions.ts` + `packages/core/README.md`
  - `defineCatalog(schema, { components, actions })`:actions = 具名函数目录(带 description)。
  - 值表达式:`$state`(读)、`$computed`(调用注册函数,`args` 求值)、`$cond/$then/$else`、`$template`。→ MVP 仅取 `$state`(值)+ 条件表达式;`$computed`/`$template`/`$cond`(值)属后续增强。
  - `ActionBinding`:`{ action, params, onSuccess, onError }`,`ActionOnError = {set}|{action,params}`。→ 我们的节点级 `onError` 借此心智,本期仅设计预留。

## liteflow(Java,编排心智)
- `submodules/liteflow/README.md` / `README.zh-CN.md`:EL 算子 `THEN`(串行)、`WHEN`(并行)、`IF`/`SWITCH`(条件)、`FOR`/`WHILE`(循环),组件通过共享 context 传数据。
- `submodules/liteflow/liteflow-el-builder`:EL builder(我们不做字符串解析,仅取算子语义)。
- 映射:`THEN→seq`、`WHEN→parallel`、`IF→if`;`SWITCH/FOR/WHILE/retry` 列后续增强。

## 本仓脚手架样板
- `packages/utils/{package.json,tsconfig.json,vite.config.ts,src/index.ts,tests/index.test.ts}`:零依赖 TS 库,`vp pack` 打包、`vp test`(`vite-plus/test`)测试。新包照此建。
- 测试写法:`import { expect, test } from "vite-plus/test";`(见 `packages/utils/tests/index.test.ts`)。
