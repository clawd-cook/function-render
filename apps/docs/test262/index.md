# test262 · 一致性与基准

用 **logic-render** 的「配置 + render」把 TC39 [test262](https://github.com/tc39/test262) 的
`test/language` 用例建模为 FlowSpec 并执行,统计**通过率**与**覆盖率**,采集 `run()` 渲染
**基准**,由每日 GitHub Actions 定时刷新,趋势随时间累积。

> 路线 C:不追求一次性 100%。语料库为**精选可表达**用例(应全通过);覆盖率 = 语料库覆盖的真实
> 用例数 / `test/language` 全量,随迭代增长。新增用例见
> [`packages/test262`](https://github.com/clawd-cook/logic-render/tree/main/packages/test262)。

<Test262Dashboard />
