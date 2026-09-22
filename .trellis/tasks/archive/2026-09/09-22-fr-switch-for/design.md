# Design — fr-switch-for

## core / schema.ts
`Node` 类型新增:
```ts
| { switch: DynamicValue; cases: Record<string, Node>; default?: Node }
| { for: DynamicValue; as?: string; indexAs?: string; body: Node }
```
`NodeSchema` union 增两 `z.strictObject`:
```ts
z.strictObject({ switch: DynamicValueSchema, cases: z.record(z.string(), NodeSchema), default: NodeSchema.optional() }),
z.strictObject({ for: DynamicValueSchema, as: JsonPointer.optional(), indexAs: JsonPointer.optional(), body: NodeSchema }),
```
- 判别键:`switch` / `for`。strict 保证不与其它变体混淆。

## core / validate.ts (checkCalls)
递归:
- `switch`:遍历 `Object.entries(node.cases)` → `checkCalls(caseNode, `${path}/switch/cases/${key}`)`;`default` → `${path}/switch/default`。
- `for`:`checkCalls(node.body, `${path}/for/body`)`。

## runner / engine.ts (exec)
- `switch`:`const key = String(resolveArgs(node.switch, ctx));` `const chosen = node.cases[key] ?? node.default;` `return chosen ? exec(chosen, key in node.cases ? `${path}/switch/cases/${key}` : `${path}/switch/default`, ...) : undefined;`
- `for`:
  ```ts
  const source = resolveArgs(node.for, ctx);
  const items: unknown[] = Array.isArray(source)
    ? source
    : typeof source === "number" ? Array.from({ length: Math.max(0, Math.floor(source)) }, (_, i) => i)
    : [];
  const results: unknown[] = [];
  for (let i = 0; i < items.length; i++) {
    if (node.as) ctx.set(node.as, items[i]);
    if (node.indexAs) ctx.set(node.indexAs, i);
    results.push(await exec(node.body, `${path}/for/body`, catalog, ctx));
  }
  return results;
  ```
  顺序 await(共享 state 连贯);fail-fast 自然透传(某次 body 抛错即中断)。

## catalog / examples.ts
新增:
- `switch-demo`:`initialState { op:"double", x:7 }`;`{ switch:{$state:"/op"}, cases:{ double:{call:"mul",args:{a:{$state:"/x"},b:2}}, square:{call:"mul",args:{a:{$state:"/x"},b:{$state:"/x"}}} }, default:{call:"add",args:{a:{$state:"/x"},b:0}} }` → op=double → **14**。
- `for-demo`:`initialState { items:[1,2,3] }`;`{ for:{$state:"/items"}, as:"/n", body:{call:"mul",args:{a:{$state:"/n"},b:10}} }` → **[10,20,30]**。

## 测试
- core:`schema`/`validate` 新增用例(合法 + 非法:`for` 缺 body、`switch` cases 非对象、`switch`+`for` 同对象)。
- runner:switch 命中/默认/无默认;for 数组/数字/`as`/`indexAs`/收集顺序;嵌套(for 内 if);fail-fast(for body 抛错)。
- catalog:`switch-demo`→14、`for-demo`→[10,20,30]。

## 注意
- 新字段不用 `then`(用 `cases`/`default`/`body`),避免 no-thenable。
- 遵循 `.trellis/spec/guides/viteplus-ts-package-conventions.md`(`.ts` 扩展名、回调显式类型、递归 schema `as z.ZodType<T>`)。
