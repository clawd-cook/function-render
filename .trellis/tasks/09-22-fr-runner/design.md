# Design — fr-runner (`packages/runner`)

## Layout
```
packages/runner/
  package.json   # name @logic-renderer/runner; deps { "@logic-renderer/core": "workspace:*" }; devDeps 含 zod(catalog,仅测试用)
  tsconfig.json  # 照 core
  vite.config.ts # pack dts+exports,照 core
  README.md
  src/
    index.ts     # export { run } + 类型转出
    engine.ts    # run + exec + normalizeCatalog
  tests/
    engine.test.ts
```

## API
```ts
import {
  validate, resolveArgs, evaluateCondition, getByPath, setByPath, FunctionRenderError,
  type Catalog, type FunctionDef, type Node, type RunContext, type RunResult, type StateModel,
} from "@logic-renderer/core";

export interface RunOptions { catalog: Catalog; initialState?: StateModel; }
export function run(spec: unknown, options: RunOptions): Promise<RunResult>;
```

## 执行流程(engine.ts)
1. `const catalog = normalizeCatalog(options.catalog)`(`FnImpl` → `{ run }`)。
2. `const node = validate(spec, Object.keys(catalog))`（core:结构 + 未知函数校验;失败抛 `FunctionRenderError(kind="validation")`）。
3. `const state = structuredClone(options.initialState ?? {})`;`ctx = { state, get:(p)=>getByPath(state,p), set:(p,v)=>setByPath(state,p,v) }`。
4. `const result = await exec(node, "", catalog, ctx)`;`return { state, result }`。

`exec(node, path, catalog, ctx)`:
- `call`:`args = resolveArgs(node.args ?? {}, ctx)`;若 `def.params`:`safeParse`,失败 → `FunctionRenderError("validation", path, msg, {fnName, cause})`;成功用 `parsed.data`。`try { result = await def.run(args, ctx) } catch(e)`:非 `FunctionRenderError` 则包 `FunctionRenderError("call", path, msg, {fnName, cause:e})` 抛;否则透传。`node.out` → `ctx.set(out, result)`。返回 `result`。
- `seq`:`for i` 依次 `await exec(child, ` `${path}/seq/${i}` `)`;返回最后一次(空→`undefined`)。
- `parallel`:`Promise.all(node.parallel.map((c:Node,i:number)=>exec(c, `${path}/parallel/${i}`)))`;返回数组。
- `if`:`evaluateCondition(node.if, ctx)` → `then` 或 `else`(无 `else`→`undefined`)。

回调参数显式类型 `(c: Node, i: number)`(规避 TS7006,见 spec 约定)。

## 错误
- 复用 core 的 `FunctionRenderError`;`path` 用节点定位串(如 `/seq/1/then`)。
- `parallel` 用 `Promise.all`,首个 reject 即整体 reject(fail-fast,不聚合)。

## Trade-offs
- `run` 接收 `unknown` 并内部 `validate`,便于 apps 直接喂原始 JSON;若已是 `Node` 也能通过(结构相同)。
- runner 不直接依赖 zod(`params` 由 catalog 提供其 `safeParse`);zod 仅测试用。

## 依赖 / 注意
- 消费 `@logic-renderer/core` 的 `dist`(exports 指向 dist),需 core 已 `vp pack`。全仓 `vp run -r build` 会先建 core 再建 runner。
- 遵循 `.trellis/spec/guides/viteplus-ts-package-conventions.md`(`.ts` 扩展名、`export type`、回调显式类型等)。
