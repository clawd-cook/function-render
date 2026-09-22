# node-service

A minimal Node HTTP service demonstrating the function renderer. It reuses the
same `@logic-renderer/runner` and `@logic-renderer/catalog` as the React
and Vue apps, so all three behave identically.

## Run

```bash
vp run -r build            # build the workspace libraries first
node --experimental-strip-types apps/node-service/src/server.ts
# listens on http://localhost:8787 (override with PORT)
```

## Endpoints

- `GET /examples` — list the shared example specs.
- `POST /run` — body `{ "spec": <FlowSpec>, "input"?: ..., "preview"?: boolean }` or
  `{ "example": "math-pipeline", "input"?: ... }`.
  Returns `{ ok: true, result, state }`, or `{ ok: false, error }` with HTTP
  400 for a `FunctionRenderError` (invalid spec / function error).

```bash
curl -s -XPOST localhost:8787/run -d '{"example":"math-pipeline"}'
curl -s -XPOST localhost:8787/run \
  -d '{"spec":{"type":"set","params":{"path":"$.x","value":{"$add":[1,2]}}},"input":{}}'
```
