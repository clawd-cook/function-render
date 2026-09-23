# 设计理念与理论依据

> 本页逐条说明 logic-render **每一处关键设计的「用意」与其「理论依据」**。
> 词表与行为以引擎实现为准(见 [概览](/guide/overview) 与 [编排算子](/guide/operators))。

一句话定位:**把"逻辑编排"当作数据而非代码**——一份可校验、可预览、可回滚、可移植的 JSON
`FlowSpec`,由引擎按**封闭词表**解释执行。下面的每个决定都服务于这个定位。

---

## 1. 三层身份:Operator / ExprAtom / Func 严格分离

**设计**:`type`(NodeType/Operator)与 `{ "$mul": … }`(ExprAtom)是**封闭表、只能引擎发版**;
业务能力(Func)**开放**,只经 `callFunc` 每次 `run` 注入。同一能力禁止跨表(`$add` 不得再做成 Func)。

**用意**:把"可枚举、需稳定的编排/求值原语"与"多变的业务副作用"彻底分开,得到一个**可预测、可审计**
的内核和一个**唯一**的扩展点。

**理论依据**:
- **关注点分离 / 稳定依赖原则**:稳定的抽象(编排词表)不应依赖易变的细节(业务)。
- **能力最小化(least privilege)**:项目"只能注入 `funcs`,不能 `registerOperator`",把可变性收敛到单一注入面,便于推理与安全审计。

---

## 2. 封闭词表 vs 开放注入:为什么"故意不让你加算子"

**设计**:新增 NodeType / ExprAtom = **引擎版本号 + changelog**;项目侧无法扩展控制流或表达式。

**用意**:让"一份 spec 的全部可能行为"始终可被一张有限表穷举,从而**可静态分析、可移植、可长期演进**。

**理论依据**:
- **封闭世界假设(closed-world)**:行为空间有界 ⇒ 校验器可完整判定合法性(未知 `type`/`$atom` 直接 `phase:"validate"` 拒绝)。
- **语言设计的"稳定内核 + 受控扩展"**:类比 SQL、正则、eBPF——内核封闭以换取可判定与安全,扩展点受限且显式。

---

## 3. 分层包与单向依赖(深模块)

**设计**:`@logic-renderer/core`(schema/`validate`/Slot/错误)← `@logic-renderer/runner`(`run()`)←
`@logic-renderer/catalog`(示例 Func + FlowSpec);对外只暴露 `validate` / `run`。

**用意**:解析与执行解耦;内核不被示例/业务污染;公开面小、易测试。

**理论依据**:
- **深模块(Ousterhout)**:窄接口(`run`/`validate`)包裹丰富实现,降低认知负荷。
- **无环依赖 + 稳定抽象**:`core` 不反向依赖执行层,保证底座稳定。

---

## 4. 控制流为什么恰是 `then / if / switch / while / for`

**设计**:封闭控制流集合 = 顺序 `then`、选择 `if`/`switch`、迭代 `while`/`for`(+ `tryCatch`)。

**用意**:用一组**完备且最小**的结构覆盖一切编排,其余都是可归约的人体工学糖(`switch`≈嵌套 `if`,
`for`≈`while`+计数)。

**理论依据**:
- **结构化程序定理(Böhm–Jacopini, 1966)**:任何带 `goto` 的可计算流程,都能只用**顺序 / 选择 / 迭代**等价表达。所以"`while/for/if` 就够了"不是巧合,而是它们构成控制流的**完备基**。
- 因此最小内核其实只需 `then + if + while + get/set`,其余 NodeType 是派生封装。

---

## 5. 无 `goto`、树形 spec、单入口单出口

**设计**:FlowSpec 是 `{ type, params, outputTo? }` 的 AST,节点嵌套组合,无跳转。

**用意**:任意子树可被**局部推理与复用**;执行路径显式可见。

**理论依据**:
- **结构化编程(Dijkstra,《Go To Statement Considered Harmful》1968)**:只用嵌套块、单入口单出口,消除任意跳转带来的状态爆炸。
- 树形 AST ⇔ 结构化控制流,天然适配递归下降的解释器。

---

## 6. 有界迭代:**主动放弃图灵完备,换取"必然终止"**

**设计**:`while` **必须**声明 `maxIter`;`for` 只遍历有限数组、超限即 `run` 错。

**用意**:每份协议**保证停机**、资源可预算、可安全地在线运行与批量校验。

**理论依据**:
- `while` + 无限循环 + 可变状态 = 图灵完备,但停机不可判定。加上界后,引擎变为**全的(total)**、必然终止。
- **全函数式编程(D. Turner, *Total Functional Programming*)** 与 **原始递归**:有界迭代 ≈ 原始递归层次,恒停机。
- 同类工程取舍:eBPF 校验器、Dhall 等"故意不图灵完备"的语言。**用表达力换可判定性与安全**。

---

## 7. 数组高阶算子 = 折叠 / 态射

**设计**:`arrayMap` / `arrayFilter` / `arrayReduce` 在**有限**数组上迭代(默认 `maxIter = length`)。

**用意**:把"遍历"收敛为受控的结构化递归,而非开放的自递归。

**理论依据**:
- 对应函数式的 **map / filter / fold(catamorphism)**——**有限数据结构上的结构化递归**,同样是全的、必然终止。
- 折叠是"消费一个代数数据结构"的规范形式,组合性好、易于并行/优化。

---

## 8. ExprAtom = 一个封闭的"全运算代数"

**设计**:`$add/$sub/$mul/$div/$mod/$pow/…`、`$gt/$eq/$and/$not/…`、`$len/$at/$concat/$pick/$merge/…`、`$lit`——
一组**无副作用、必然终止**的一阶运算;`$div` 除零 → `phase:"run"`。

**用意**:把纯计算(算术/布尔代数/一阶数据变换)与副作用彻底分层,让表达式可被安全求值与预览。

**理论依据**:
- **代数(algebra)视角**:封闭运算集合 + 值域 = 一个可组合的全代数;布尔部分即布尔代数。
- **无隐式表达式语言**:只有匹配 `^\$\.[A-Za-z_][\w.]*$` 才是 Slot 读,`"$.a + 1"` 只是字符串——**杜绝隐式解析**,一切求值显式且封闭。

---

## 9. Slot 状态模型:共享上下文、`$.input` 只读

**设计**:统一 Slot 空间 `{ input, …outputTo }`;`$.input` 只读,`set`/`outputTo` 写其它路径,`$.path` 读。

**用意**:节点间通过**显式命名的共享状态**通信,数据流清晰、可追踪。

**理论依据**:
- 借鉴 **LiteFlow** 的共享上下文思想。
- **命令式核心的最小要素 = 可变存储 + 顺序 + 分支 + 循环**;Slot 提供其中的"可变存储",与 §4 的控制流合起来即结构化命令式内核。输入只读是**引用透明性**的务实折中。

---

## 10. 程序即数据 + 解释器:`run` 是折叠,`preview` 是"另一种解释"

**设计**:spec 是数据,`run(spec, …)` 是对 AST 的一次解释;`preview: true` 时**求值+校验但绝不调用 `Func.run`**、跳过 `sleep`。

**用意**:同一份协议可被**多种方式解释**——真实执行、安全预览、(未来)静态成本分析。

**理论依据**:
- **初始代数语义 / free monad / tagless-final**:把**语法(数据)与语义(解释器)解耦**,即可为同一语法挂接**多个解释器**。
- `preview` 在理论上就是给同一 AST 换了个 **denotation**(语义域):把"有副作用的调用"解释为"只做形状校验的空操作"。这是"程序即数据"最直接的红利。

---

## 11. 校验先行:`validate` 早于 `run`

**设计**:`run` 内部先 `validate`(zod schema),结构非法即 `phase:"validate"` 抛出,绝不进入执行。

**用意**:把"结构错误"与"运行错误"分开,尽早失败、错误可定位(带 `path`)。

**理论依据**:
- **让非法状态不可表示 / 解析而非校验(parse, don't validate)**:先把不可信输入解析为可信的内部结构,后续执行可假定其良构。
- 与 §2 封闭世界呼应:合法性可完整判定。

---

## 12. 错误三相 + 逆序回滚:Saga / 补偿事务

**设计**:`FunctionRenderError.phase ∈ {validate, run, rollback}`;fail-fast;只有 `sideEffect:true` 且**已成功**的
`callFunc` 入栈,后续失败时**逆序**调用其 `rollback`(`tryCatch` 的 body 内禁止 sideEffect callFunc)。

**用意**:在没有分布式事务的前提下,为副作用提供**可预测的补偿语义**。

**理论依据**:
- **Saga / 补偿事务(Garcia-Molina & Salem, 1987)**:长流程用"正向操作 + 逆向补偿"替代全局锁。
- 逆序补偿 = 栈式 undo,契合结构化执行的后进先出特性。
- 副作用被隔离在唯一边界(`callFunc`),带有**代数效应 / effect handler** 的味道:纯内核 + 外部注入的效应解释。

---

## 13. 值表达式 + zod 参数校验(借鉴 json-render)

**设计**:`callFunc.args` 各值是 Expr(可含 Slot 读与 ExprAtom);Func 可声明 `params`(zod)在调用前校验。

**用意**:调用点的数据装配声明化;业务函数的输入契约显式、可校验。

**理论依据**:
- 借鉴 **json-render** 的 catalog / 值表达式 / zod 校验。
- **契约式设计(Design by Contract)**:在效应边界处强制前置条件。

---

## 影响来源

- **[json-render](https://github.com/vercel-labs/json-render)**:catalog、值表达式、zod 参数校验。
- **[LiteFlow](https://github.com/dromara/liteflow)**:`THEN`/`IF` 等编排算子与共享上下文。

## 取舍一览

| 设计 | 用意 | 理论依据 |
| --- | --- | --- |
| 三层身份分离 | 可预测内核 + 唯一扩展点 | 关注点分离 / 最小权限 |
| 封闭词表 | 行为可穷举、可判定 | 封闭世界假设 |
| 分层包、窄接口 | 稳定底座、易测 | 深模块 / 无环依赖 |
| `then/if/switch/while/for` | 完备最小控制流 | 结构化程序定理(Böhm–Jacopini) |
| 树形、无 goto | 局部可推理 | 结构化编程(Dijkstra) |
| 有界迭代(`maxIter`) | 必然终止、可预算 | 全函数式 / 原始递归 |
| `arrayMap/filter/reduce` | 受控遍历 | 折叠 / catamorphism |
| ExprAtom 封闭代数 | 纯计算与副作用分层 | 代数 / 布尔代数 |
| Slot、`$.input` 只读 | 清晰数据流 | 共享上下文 + 引用透明折中 |
| spec=数据、`run`=解释器、`preview` | 多解释复用 | 初始代数 / free monad |
| `validate` 先行 | 尽早失败、可定位 | parse, don't validate |
| 错误三相 + `rollback` | 可预测补偿 | Saga / 补偿事务 |
| 值表达式 + zod | 声明式装配 + 契约 | json-render / Design by Contract |

## 一句话总结

> 用**封闭且可枚举的编排/表达式词表**保证可预测与安全,用**唯一的 Func 注入点**开放业务扩展,再以
> **Slot 状态 + 校验先行 + preview + 逆序回滚**构成一套**确定性、必然终止、可移植**的执行契约——
> 每一处"减法"(无 goto、有界迭代、封闭词表)都是有理论支撑的工程取舍。
