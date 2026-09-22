# Design — fr-core (`packages/core`)

## Layout
```
packages/core/
  package.json      # name "@logic-renderer/core", type module; deps: { zod: "catalog:" }; scripts 照 packages/utils
  tsconfig.json     # 照 utils
  vite.config.ts    # pack: dts(tsgo) + exports(照 utils)
  README.md
  src/
    index.ts        # 汇出
    errors.ts       # FunctionRenderError
    types.ts        # StateModel / Catalog / FunctionDef / FnImpl / RunContext / RunResult
    state.ts        # parsePointer / getByPath / setByPath
    schema.ts       # zod: DynamicValueSchema / ConditionSchema / NodeSchema + z.infer 类型
    expr.ts         # resolveArgs / evaluateCondition
    validate.ts     # validate(specJson, fnNames?)
  tests/
    state.test.ts
    expr.test.ts
    validate.test.ts
```

## Types & Schema (types.ts / schema.ts)
```ts
// schema.ts
export const DynamicValueSchema: z.ZodType<DynamicValue> = z.lazy(() =>
  z.union([ z.string(), z.number(), z.boolean(), z.null(),
    z.object({ $state: JsonPointer }),
    z.array(DynamicValueSchema),
    z.record(z.string(), DynamicValueSchema) ]));

const Comparison = { eq: z.unknown().optional(), neq: z.unknown().optional(),
  gt: z.number().optional(), gte: z.number().optional(),
  lt: z.number().optional(), lte: z.number().optional(), not: z.literal(true).optional() };
export const ConditionSchema: z.ZodType<Condition> = z.lazy(() => z.union([
  z.boolean(),
  z.object({ $state: JsonPointer, ...Comparison }),
  z.array(ConditionSchema),                 // 隐式 AND
  z.object({ $and: z.array(ConditionSchema) }),
  z.object({ $or: z.array(ConditionSchema) }),
]));
export const NodeSchema: z.ZodType<Node> = z.lazy(() => z.union([
  z.object({ call: z.string(), args: z.record(z.string(), DynamicValueSchema).optional(), out: JsonPointer.optional() }).strict(),
  z.object({ seq: z.array(NodeSchema) }).strict(),
  z.object({ parallel: z.array(NodeSchema) }).strict(),
  z.object({ if: ConditionSchema, then: NodeSchema, else: NodeSchema.optional() }).strict(),
]));
export type DynamicValue = /* 见 union 手写类型,或 z.infer 反推 */;
export type Condition = ...; export type Node = ...;
```
- `JsonPointer = z.string().refine(isJsonPointer, "invalid JSON Pointer")`(空串或以 `/` 开头)。
- `.strict()` 保证节点判别唯一、拒绝多余键(如同一对象同时含 `call` 和 `seq`)。
- 递归类型用显式 `z.ZodType<T>` + 手写 `T`(zod4 对 lazy 联合的 infer friendlier;若 infer 稳定亦可 `z.infer`)。

## types.ts(非 schema 类型)
```ts
export type StateModel = Record<string, unknown>;
export interface RunContext { get(ptr: string): unknown; set(ptr: string, v: unknown): void; state: StateModel; }
export interface RunResult { state: StateModel; result: unknown; }
export interface FunctionDef<S extends z.ZodType = z.ZodType> {
  params?: S; run: (args: z.infer<S>, ctx: RunContext) => unknown | Promise<unknown>;
}
export type FnImpl = (args: any, ctx: RunContext) => unknown | Promise<unknown>;
export type Catalog = Record<string, FunctionDef | FnImpl>;
```
（`defineCatalog`/`run` 的实现分别在 catalog/runner;core 只给类型基座,避免循环依赖。）

## State (state.ts)
- `parsePointer(ptr): string[]`：空串→`[]`;否则以 `/` 分段,每段 `~1`→`/`、`~0`→`~`。
- `getByPath(state, ptr)`：逐段深入,遇缺失/类型不符返回 `undefined`。
- `setByPath(state, ptr, value)`：**就地可变**,沿途缺失时按「下一段是否纯数字」建 `[]` 或 `{}`;末段为 `-` 且当前是数组则 push;数组段用下标。借鉴 json-render `immutableSetByPath`,改为就地写。

## Expressions (expr.ts)
- `resolveArgs(value, ctx)`：`Array` 递归 map;对象:若「恰含且仅含 `$state` 键」→ `ctx.get(value.$state)`;否则递归其各值(字面量对象);其它原样返回。
- `evaluateCondition(cond, ctx)`：
  - `boolean` → 原值;数组 → 全部 AND;`{$and}` → 全 AND;`{$or}` → 任一 OR。
  - `{$state, ...cmp}`：`v = ctx.get($state)`;无比较键 → `Boolean(v)`;`not:true` → `!v`;`eq/neq` 深比较或严格等;`gt/gte/lt/lte` 数值比较。语义对齐 json-render `visibility.ts`(去除 `$item`/`$index`)。

## Validate (validate.ts)
- `validate(specJson: unknown, fnNames?: Iterable<string>): Node`
  1. `const r = NodeSchema.safeParse(specJson)`;失败 → 取首个 issue,`throw new FunctionRenderError("validation", pointerFromIssuePath(issue.path), issue.message)`。
  2. 若给 `fnNames`:递归遍历 AST,对每个 `call` 检查 `fnNames` 含之,否则 `throw FunctionRenderError("validation", path, "unknown function: "+name)`。
  3. 返回 `r.data`。
- 供 runner 复用(runner 传入 `Object.keys(catalog)`)。

## Errors (errors.ts)
```ts
export class FunctionRenderError extends Error {
  kind: "validation" | "call"; path: string; fnName?: string;
  constructor(kind, path, message, opts?: { fnName?: string; cause?: unknown }) {
    super(message, { cause: opts?.cause }); this.name = "FunctionRenderError";
    this.kind = kind; this.path = path; this.fnName = opts?.fnName;
  }
}
```

## Trade-offs
- 就地可变 state(无 UI 订阅需求),比 json-render 不可变结构共享更简单。
- 递归 zod schema 用显式 `z.ZodType<T>` + 手写 T,规避 zod4 lazy-union infer 的不稳定。
- core 只出类型基座、不实现 `defineCatalog`/`run`,避免 core↔runner/catalog 循环依赖。

## Reference
- `submodules/json-render/packages/core/src/state-store.ts`(`immutableSetByPath`/`parseJsonPointer`)、`types.ts`(`getByPath`)、`visibility.ts`(条件)。
- 脚手架:`packages/utils/{package.json,tsconfig.json,vite.config.ts}`。
