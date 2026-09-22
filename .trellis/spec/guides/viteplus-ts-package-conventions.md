# Vite+ TS package conventions (learned in fr-core)

适用于本仓 `packages/*` 的零/轻依赖 TS 库(`vp pack` 打包、`vp test`、`vp check`)。新建 `runner`/`catalog` 等包时照此避免返工。

## 脚手架
- 直接拷 `packages/utils` 的 `package.json`/`tsconfig.json`/`vite.config.ts`;改 `name`。`tsconfig` 关键项:`module/moduleResolution: nodenext`、`verbatimModuleSyntax: true`、`allowImportingTsExtensions: true`、`isolatedModules: true`、`strict + noUnusedLocals`。
- 新依赖走 `pnpm-workspace.yaml` 的 `catalog:`(如 `zod: ^4.3.6`),包内写 `"zod": "catalog:"`。

## 硬性约束(否则 `vp check` 报错)
- **相对 import 必须带 `.ts` 扩展名**(nodenext + verbatimModuleSyntax):`import { x } from "./state.ts"`;测试同样 `from "../src/index.ts"`。
- **类型专用导入/导出用 `import type` / `export type`**(verbatimModuleSyntax + isolatedModules)。
- **回调参数需显式类型**,`typeAware` 下箭头回调易被判 `TS7006 implicit any`:`arr.forEach((child: Node, i: number) => ...)`、`arr.every((c: Condition) => ...)`。
- 避免 `unknown | Promise<unknown>` 这类联合(`no-redundant-type-constituents`):直接用 `unknown`。

## zod v4 细节
- 递归 schema 用 `z.lazy(() => z.union([...]))`,并**用 `as z.ZodType<T>` 断言**(直接 `: z.ZodType<T> =` 会因内部泛型不匹配报 TS2322)。
- 对象用 `z.strictObject({...})`(拒绝多余键,做判别式联合);`z.record(z.string(), V)` 需两参。
- spec 里用 `then` 作字段名会触发 `unicorn/no-thenable`;它只是数据字段(值为对象、非函数,不会真的 thenable),用 `// oxlint-disable-next-line unicorn/no-thenable -- 说明` 抑制。

## 流程
- 格式问题:`vp check --fix <包路径>` 自动修(oxfmt 会重排 import 顺序,edit 时以 fix 后为准)。
- 逐包校验:`vp check packages/<name>`;逐包测试:`vp run --filter <pkgname> test`;全仓:`vp run -r test` / `vp run -r build`。
- 全仓 `vp check` 会因既有历史 md/json 格式问题非零退出;判定新代码时只看新增包路径结果。
- 消费方(runner/apps)按 `exports` 解析到 `dist/`,需先 `vp run -r build` 出 `dist` 再被引用(或在包内直接测 `src`)。
