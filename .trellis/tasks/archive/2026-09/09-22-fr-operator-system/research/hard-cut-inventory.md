# Hard-cut 破坏清单（仓内，2026-09-22）

未发现外部 npm 消费者（包版本 `0.0.0` / `private`）。硬切成本 = 重写下列仓内调用点与 fixtures，不是迁移线上流量。

## Host（4）

| 路径 | 旧 Interface |
|------|----------------|
| `apps/node-service/src/server.ts` | `run(spec, { catalog: standardCatalog, initialState })` |
| `apps/react/src/App.tsx` | 同上 |
| `apps/vue/src/App.vue` | 同上 |
| `apps/docs/.vitepress/theme/OnlineRunner.vue` | 同上 |

`apps/node-service/README.md` 示例：`{"call":"add","args":{"a":1,"b":2}}`。

## 共享 fixtures

| 路径 | 数量 | 方言 |
|------|------|------|
| `packages/catalog/src/examples.ts` | 6（math-pipeline / greeting / conditional / parallel / switch / for） | `seq`/`call`/`$state`/`out` |
| `apps/docs/data/problems.ts` | 4（two-sum、move-zeroes、maximum-subarray、sort） | `seq`/`for`/`set`/`$state`/`$add`/`$at`；1 题 `call: sort` |
| `packages/catalog/src/functions.ts` | `add` `sub` `mul` `div` `concat` `upper` `lower` `length` `delay` `now` `sort` | 与 `$add` 双身份 |

## 测试 / 文档

- `packages/core/tests/validate.test.ts`、`packages/runner/tests/engine.test.ts`、`packages/catalog/tests/{examples,functions}.test.ts`
- `packages/core/README.md`、`packages/runner/README.md`、`packages/catalog/README.md`

## 结论

约 15 份 spec + 4 个 host 胶水 + 一套 catalog 函数。适配器的长期双栈成本高于一次性重写。硬切在本仓成立；「永久冻死 Catalog、永远不能加 `$len`」并不被这份清单所要求。
