# Implement (父级) — 跨子任务编排

> 各子任务的实现清单在各自 `.trellis/tasks/09-22-fr-*/implement.md`。本文件只定义**批次、跨子验收与集成**。

## 批次(节奏,非严格依赖 —— 三个 app 平级)

- **批次 1(库,顺序)**:`fr-core` → 然后 `fr-runner` 与 `fr-catalog`(可并行)。
  - 产出:`packages/core`、`packages/runner`、`packages/catalog` 三库 + 各自 Vitest 单测;`vp run -r test`/`vp run -r build` 绿。
- **批次 2(应用,平级、可任意顺序)**:`fr-node-service`、`fr-react`、`fr-vue`,各自接入**同一** `runner`+`catalog`。
  - 每个 app 独立验收(node-service:`curl`;react/vue:浏览器手测录屏)。

## 每个子任务进入实现前

- 该子任务已具备自己的 `prd.md`(复杂者含 `design.md`+`implement.md`),`implement.jsonl`/`check.jsonl` 已有真实条目;经 review 后 `task.py start <子任务>`。

## 跨子集成验收(父级)

- [ ] 三库 API 契约一致(core 导出的类型被 runner/catalog/apps 正确消费)。
- [ ] 同一示例 spec 在 node-service(curl)与 react/vue(浏览器)得到**一致** result/state(通用性)。
- [ ] 全仓 `vp run -r test` / `vp run -r build` 绿;新代码 `vp check` 干净(全仓 check 的既有历史 md/json 格式问题不在本任务范围)。

## 依赖 / 回滚

- 库→app 单向;三个 app 互不依赖。回滚 = 删除对应目录。
- 注意:全仓 `vp check` 因既有历史 md/json 会非零退出;判定以新增代码路径的 lint/type 结果为准,勿改无关历史文件。

## 顺序总览

`fr-core` →(`fr-runner` ∥ `fr-catalog`)→(`fr-node-service` ∥ `fr-react` ∥ `fr-vue`)
