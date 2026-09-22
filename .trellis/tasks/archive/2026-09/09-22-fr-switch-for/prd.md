# fr-switch-for — `switch` / `for` 控制流算子(增强)

> 在已合并的 MVP(`call`/`seq`/`parallel`/`if`)基础上,新增两个 liteflow 风格控制流算子。跨 `core`(schema/types/validate)+ `runner`(engine)+ `catalog`(示例)。

## Goal

给函数渲染器新增 `switch`(多路分支)与 `for`(遍历/循环)两个 JSON 节点,扩展 core 与 runner,并加示例在 node/react/vue 端到端演示(三端无需改代码,示例自动出现在下拉里)。

## Requirements

- **R1 `switch` 节点**:`{ switch: DynamicValue, cases: Record<string, Node>, default?: Node }`。求值 `switch`→`String(v)` 作为 key,命中 `cases[key]` 则执行,否则执行 `default`(无则 `undefined`)。result = 选中节点 result。
- **R2 `for` 节点**:`{ for: DynamicValue, as?: string, indexAs?: string, body: Node }`。求值 `for`:数组→逐元素;数字 n→范围 0..n-1(item=index)。每次迭代:`as` 存在则 `ctx.set(as, item)`、`indexAs` 存在则写 index,**顺序** `await exec(body)`,收集结果。result = 各次 body result 数组。
- **R3 core**:`schema.ts`(NodeSchema 增两变体,`z.strictObject`)、类型 `Node` 增两成员、`validate.ts` 递归进 `cases`/`default`/`body`。
- **R4 runner**:`engine.ts` 的 `exec` 处理 `switch`/`for`;沿用 fail-fast 与 `path`(如 `/switch/cases/double`、`/for/body`)。
- **R5 catalog**:新增示例 `switch-demo`、`for-demo`(仅用 `standardCatalog`)。
- **R6 测试**:core(schema/validate)+ runner(switch 命中/默认、for 数组/数字/顺序/收集、嵌套、fail-fast)+ catalog(两示例经 runner 跑通)。

## Acceptance Criteria

- [ ] AC1 `switch` 命中/默认/无默认→undefined,均正确;`path` 定位正确。
- [ ] AC2 `for` 对数组与数字均正确迭代,`as`/`indexAs` 写回 state,收集结果数组顺序正确。
- [ ] AC3 非法 `switch`/`for`(缺 body、cases 非对象等)被 `validate` 拦截为 `FunctionRenderError(kind="validation")`。
- [ ] AC4 `for` 中某次 body 抛错 → fail-fast(`FunctionRenderError`)。
- [ ] AC5 `switch-demo`/`for-demo` 经 runner 跑通;三端 app 下拉出现并可运行(浏览器 + curl 各验证一个)。
- [ ] AC6 `vp run -r test` / `vp run -r build` 全绿;新增代码 `vp check` 干净。

## Out of Scope

- `while`(条件循环)、`retry`、节点级 `onError`、EL 字符串 DSL、值表达式增强(留后续)。

## Notes

- 新算子字段刻意不使用 `then`(用 `cases`/`default`/`body`),避免 no-thenable。
- 依赖 core→runner→catalog 的既有构建顺序(改 core 后需 `vp run -r build` 再跑依赖方)。
