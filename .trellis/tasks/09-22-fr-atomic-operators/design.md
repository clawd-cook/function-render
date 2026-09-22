# Design — fr-atomic-operators

## A. core:值表达式 `evaluate`(expr.ts 重写)

统一的值求值函数 `evaluate(expr, ctx)`;`resolveArgs(argsObj, ctx)` = 对 args 对象逐值 `evaluate`;`evaluateCondition(expr, ctx)` = `Boolean(evaluate(expr, ctx))`(兼容旧条件)。

对象判别规则:
1. **单键已知算子** → 算子求值(见下)。
2. 否则含 `$state` 键(可带比较键 eq/ne/gt/ge/lt/le/not)→ **旧式条件**,返回 bool(向后兼容 PR #2 的 if/switch/for 条件)。
3. 否则 **字面量对象** → 递归 `evaluate` 各值。
数组 → 逐元素 `evaluate`;基本类型 → 原样。

算子(operand 为数组的先对每个元素 `evaluate`;`$state` 的 operand 是指针字符串,不求值):
- 读:`$state`/`$get`("/ptr")。
- 算术:`$add`(变参和)、`$sub`[a,b]、`$mul`(变参积)、`$div`[a,b]、`$mod`[a,b]、`$neg` a。
- 比较→bool:`$eq`/`$ne`(深比较)、`$lt`/`$le`/`$gt`/`$ge`[a,b](数值)。
- 逻辑:`$and`(变参,全真)、`$or`(变参,任一真)、`$not` a。
- 集合:`$len` a、`$at`[arr,i]、`$slice`[arr,s,e?]、`$concat`(变参,数组拼接)、`$push`[arr,x](返回新数组)。
- 其它:`$min`/`$max`(变参数值)、`$if`[cond,then,else](**惰性**:只求值选中分支)。
- 未知 `$`算子或操作数非法 → `FunctionRenderError(kind="validation", ...)`。

## B. core:schema / 类型
- 新增宽松 `ValueSchema`(z.lazy union:primitive|array|record),`Node` 的 `call.args`、`if.if`、`switch.switch`、`for.for` 均用 `ValueSchema`(值表达式)。算子的具体合法性由运行时 `evaluate` 校验(抛 `FunctionRenderError`)。
- 移除对 `DynamicValueSchema`/`ConditionSchema` 的强依赖(保留导出别名以兼容,或直接替换)。`Node` 结构判别键与 `seq/parallel/if/switch/for/call` 不变。
- 导出 `evaluate`、`Value` 类型。

## C. runner:engine
- `call`:`resolveArgs(node.args, ctx)`(现在走 evaluate,支持原子算子)。
- `if`/`switch`/`for`:`evaluate(node.if/switch/for, ctx)`;`if` 取真值、`switch` 取 `String(值)`、`for` 数组/数字。
- 其余不变(fail-fast、path)。

## D. catalog:复杂算子
- 在 `standardCatalog` 增一个复杂算子 `sort`(`{ items, order? }` → 新数组),供协议 `call`(如 3sum 排序)。其余标准函数保留。

## E. 文档:协议直呈 + 执行(移除解法函数包)
- **移除 `packages/leetcode`**(解法函数包)。
- 新增 `apps/docs/data/problems.ts`:每题 `{ num,title,slug,url,difficulty,category,description, spec(协议 Node), input(默认输入), expected, catalog?(该题需要的复杂算子名,取自 standardCatalog) }`。协议**用原子算子 + 编排 + 必要的复杂算子**表达。
- `ProblemView.vue`:展示题面 + **协议 JSON(可编辑)** + 运行按钮(复用 runner);展示默认输入。运行 catalog = `standardCatalog`(含 sort 等复杂算子)。
- `OnlineRunner.vue`:输入(JSON)+ 协议(可编辑)→ `run(protocol,{catalog:standardCatalog, initialState:input})` → 结果/状态/错误。
- config sidebar / leetcode index / [slug].paths.ts 改为读取 `apps/docs/data/problems.ts`。
- docs 依赖改为 `@function-renderer/runner` + `@function-renderer/catalog`(不再依赖 leetcode 包)。

## F. 首批「纯协议」题(用原子算子)
- **two-sum**:`seq`[ 初始化 result=null; `for` i over range(len(nums)): `for` j: `if` (i<j 且 nums[i]+nums[j]==target 且 result 未定) then set result=[i,j] ]。用 `$at`/`$add`/`$eq`/`$lt`/`$and`/`$state`。
- **move-zeroes**:for 收集非零 + 补零(用 `$concat`/`$push`/`$eq`/`$if`)或登记 `sort`? 纯协议:seq 先 for 累积非零到 /nz,再 for 补零。
- **maximum-subarray**:for over nums:`cur = $max[num, $add[cur,num]]`;`best=$max[best,cur]`(state 累加器)。
- **3sum**:`call sort` 复杂算子 + 协议双指针?双指针需 while/break —— 较难纯协议;首批 3sum 可先用登记的复杂算子 `threeSum`(演示"复杂算子仍可登记"),或延后。→ 首批先做 two-sum/move-zeroes/maximum-subarray 三题纯协议 + 保留一个用复杂算子 `sort` 的小示例。

## 测试
- core `expr.test`:各原子算子 + 旧条件兼容 + `$if` 惰性 + 错误。
- runner:现有用例仍绿(条件统一后兼容)。
- docs:`vitepress build` 通过;浏览器点击运行 two-sum(纯协议)得正确结果。

## 兼容/回滚
- 移除 leetcode 包会改 docs 依赖;回滚 = 恢复该包 + 依赖。
- 条件统一保持对旧 `{$state,gt}` 兼容,PR #2 的 switch/for/if 用例不回归。
