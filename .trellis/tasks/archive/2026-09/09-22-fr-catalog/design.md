# Design — fr-catalog (`packages/catalog`)

## Layout
```
packages/catalog/
  package.json   # name @logic-renderer/catalog; deps { core: workspace:*, zod: catalog: }; devDeps { runner: workspace:* , ... }
  tsconfig.json / vite.config.ts / README.md  # 照 core
  src/
    index.ts     # 汇出
    define.ts    # defineFunction / defineCatalog
    functions.ts # standardCatalog(std lib)
    examples.ts  # examples(共享示例 spec)
  tests/
    functions.test.ts  # std 函数 + defineFunction 推导
    examples.test.ts    # 用 runner 跑每个示例
```

## define.ts
```ts
import type { z } from "zod";
import type { Catalog, FunctionDef, RunContext } from "@logic-renderer/core";

export function defineFunction<S extends z.ZodType>(def: {
  params: S;
  run: (args: z.infer<S>, ctx: RunContext) => unknown;
}): FunctionDef<S> {
  return def;
}
export function defineCatalog<C extends Catalog>(catalog: C): C {
  return catalog;
}
```
- `defineFunction` 捕获 `S`,使 `run` 的 `args` = `z.infer<S>`(修复裸 `Catalog` 的参数类型丢失)。
- `defineCatalog` 恒等,保留字面量键类型。

## functions.ts(standardCatalog)
用 `defineFunction` + zod:`add/sub/mul/div`(`{a:number,b:number}`)、`concat`(`{values:string[]}`)、`upper/lower`(`{value:string}`)、`length`(`{value:string|array}`)、`delay`(`{ms:number, value?:unknown}` async 返回 `value`)、`now`(`{}` 返回 `Date.now()`)。`export const standardCatalog = { ... } satisfies Catalog;`

## examples.ts
```ts
// oxlint-disable unicorn/no-thenable -- `then` 是 if 节点字段名
import type { Node } from "@logic-renderer/core";
export interface ExampleSpec { description: string; spec: Node; initialState?: Record<string, unknown>; }
export const examples = { "math-pipeline": {...}, "greeting": {...}, "conditional": {...} } satisfies Record<string, ExampleSpec>;
```
- 示例只用 `standardCatalog` 的函数,覆盖 `seq`/`parallel`/`if` + `$state`/`out`。

## 测试
- `examples.test.ts`:`for (const [name, ex] of Object.entries(examples)) { const {state,result} = await run(ex.spec, { catalog: standardCatalog, initialState: ex.initialState }); expect(...) }`。
- `functions.test.ts`:逐个断言 std 函数;`defineFunction` 推导用一个带类型的 run 体现(编译期)。

## 依赖 / 注意
- 消费 core/runner 的 `dist`,需先 `vp run -r build`。
- 遵循 `.trellis/spec/guides/viteplus-ts-package-conventions.md`。
