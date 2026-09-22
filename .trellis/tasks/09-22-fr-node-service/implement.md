# Implement — fr-node-service (`apps/node-service`)

## Step 0 — 脚手架
- [ ] 建 `apps/node-service`:`package.json`(name `node-service`,`private`,scripts `dev`/`start` = `node --experimental-strip-types src/server.ts`,`check` = `vp check`;deps `@function-renderer/runner`/`@function-renderer/catalog` `workspace:*`;devDeps `@types/node`/`typescript`/`vite-plus`)、`tsconfig.json`(types node)、`README.md`。
- [ ] `vp install`。

## Step 1 — server
- [ ] `src/server.ts`(单文件):`node:http` `createServer`;路由 `GET /examples`、`POST /run`;用 `run` + `standardCatalog`;`FunctionRenderError` → 400;端口 `PORT||8787`。类型用 `import type`。

## Step 2 — 测试(curl)
- [ ] `vp run -r build`(备 dist);tmux 起服务;`curl`:
  - `POST /run {example:"math-pipeline"}` → result 142;
  - `POST /run {example:"greeting"}` → "Hello, ADA!";
  - `POST /run {spec:{call:"nope"}}` → 400 kind=validation;
  - `GET /examples` → 4 项;未知路由 → 404。
- [ ] `vp check apps/node-service` 干净。

## Step 3 — 提交
- [ ] 提交 `apps/node-service` + lockfile;push;更新 PR #1。

## Validation
```bash
. "$HOME/.config/vite-plus/env"
vp install && vp run -r build
node --experimental-strip-types apps/node-service/src/server.ts &   # 或 tmux
curl -s localhost:8787/examples ; curl -s -XPOST localhost:8787/run -d '{"example":"math-pipeline"}'
vp check apps/node-service
```
