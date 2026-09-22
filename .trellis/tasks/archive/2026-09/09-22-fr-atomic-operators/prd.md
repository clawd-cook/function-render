# fr-atomic-operators — 原子计算算子 + 协议直呈可执行文档

## Goal

两项调整:
1. **引擎新增「原子计算算子」**:除编排算子(call/seq/parallel/if/switch/for)外,值表达式层增加加减乘除、比较、逻辑、数组等**内置算子**,让协议自己就能计算 —— 简单题(如两数之和)不必再抽一个解法函数。编排算子 = 原子算子 + 已登记的复杂算子 组合渲染协议。
2. **文档直呈协议、可点击执行**:LeetCode 不再把「每题一个解法函数」收进 TS 包;每题在文档里**直接展示协议(spec JSON)**,可编辑并点击运行(复用 `@logic-renderer/runner`)。

## Background

- 现状:值表达式只有 `$state` + 字面量;`resolveArgs` 只解析 `$state`;算法逻辑必须写成注册函数由 `call` 调用。
- 用户反馈:(1) 不要把解法藏进包,协议直呈可执行;(2) 简单算术不该抽函数,应有内置原子算子;复杂算子(排序/哈希等)仍可登记走 `call`。

## Requirements

### R1 core:值表达式求值 `evaluate(expr, ctx)`(替换/扩展 `resolveArgs`)
- 字面量 / 数组 / 对象(递归);`{ "$state": "/ptr" }` 读状态。
- 算术:`$add`(变参)、`$sub`[a,b]、`$mul`(变参)、`$div`[a,b]、`$mod`[a,b]、`$neg` a。
- 比较(→bool):`$eq`/`$ne`/`$lt`/`$le`/`$gt`/`$ge`([a,b])。
- 逻辑:`$and`/`$or`(变参)、`$not` a。
- 集合:`$len` a、`$at`[arr,i]、`$slice`[arr,s,e?]、`$concat`(变参)、`$push`[arr,x](返回新数组)。
- 其它:`$min`/`$max`(变参)、`$if`[cond,then,else](三元值)。
- 非法/类型不符 → `FunctionRenderError(kind="validation")`(执行前 schema 校验为主)。

### R2 core:条件统一
- `if`/`switch`/`for` 的判别改为「对一个**值表达式**求值取真值」,复用 `evaluate`。保留对旧 `{$state, gt:...}` 条件语法的兼容(或迁移,见 Open Q)。

### R3 复杂算子仍走 `call`
- catalog 登记的复杂算子(如 `sort`)供协议 `call`;与原子算子混用。

### R4 文档:协议直呈 + 执行
- 移除「解法函数包」形态。每题的 **spec/输入/元数据** 作为 docs 数据;页面展示协议 JSON(高亮、可编辑)+ 运行按钮。
- 复杂算子放一个小 catalog(docs 内或轻量包),供协议 `call`。

### R5 用原子算子重写 LeetCode 首批为「纯协议」
- two-sum(嵌套 for + `$at`/`$add`/`$eq` + state 累积)、move-zeroes、maximum-subarray(for + `$max`/`$add` + state 累加器)等可纯协议表达;3sum 等用登记的 `sort` 复杂算子 + 协议。

### R6 测试 + 演示
- core 原子算子单测;重写题的 `run(spec)` 得期望;文档站构建通过;浏览器点击运行验证。

## Acceptance Criteria

- [ ] AC1 `evaluate` 支持上述原子算子并单测通过;非法表达式被校验拦截。
- [ ] AC2 `if/switch/for` 条件走统一值表达式(含真值语义)。
- [ ] AC3 two-sum 等题以**纯协议**(无专用解法函数)运行得正确结果。
- [ ] AC4 文档站每题直呈协议 JSON 且可点击运行;不再依赖「解法函数包」。
- [ ] AC5 `vp run -r test` / `vp run -r build` / `vitepress build` 全绿;新代码 `vp check` 干净。

## Open Questions(待确认)

- Q1 原子算子语法:`{ "$add": [a,b] }`($前缀 + 数组操作数)?
- Q2 条件统一是否**兼容**旧 `{$state,gt}` 语法,还是直接迁移到新值表达式?
- Q3 协议存放:(a) docs 内数据(不建解法函数包)+ 小复杂算子 catalog;是否**移除**已合并的 `@logic-renderer/leetcode`?
- Q4 范围:先用原子算子重写首批(2–3 题纯协议 + 1 题带 sort)打通,再扩?
