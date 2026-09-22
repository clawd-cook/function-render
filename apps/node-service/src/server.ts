import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { examples, standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";

const PORT = Number(process.env.PORT ?? 8787);

interface RunPayload {
  spec?: unknown;
  example?: string;
  input?: unknown;
  preview?: boolean;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleRun(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let payload: RunPayload;
  try {
    payload = raw ? (JSON.parse(raw) as RunPayload) : {};
  } catch {
    send(res, 400, { ok: false, error: { message: "invalid JSON body" } });
    return;
  }

  let spec = payload.spec;
  let input = payload.input;
  if (payload.example !== undefined) {
    const example = (examples as Record<string, (typeof examples)[keyof typeof examples]>)[
      payload.example
    ];
    if (!example) {
      send(res, 400, { ok: false, error: { message: `unknown example: ${payload.example}` } });
      return;
    }
    spec = example.spec;
    input = input ?? example.input;
  }

  if (spec === undefined) {
    send(res, 400, { ok: false, error: { message: "missing 'spec' or 'example'" } });
    return;
  }

  try {
    const { result, state } = await run(spec, {
      funcs: standardCatalog,
      input,
      preview: payload.preview,
    });
    send(res, 200, { ok: true, result, state });
  } catch (error) {
    if (error instanceof FunctionRenderError) {
      send(res, 400, {
        ok: false,
        error: {
          message: error.message,
          phase: error.phase,
          path: error.path,
          funcKey: error.funcKey,
        },
      });
    } else {
      send(res, 500, {
        ok: false,
        error: { message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = req.url ?? "/";
  if (req.method === "GET" && (url === "/" || url === "/examples")) {
    const list = Object.entries(examples).map(([name, example]) => ({
      name,
      description: example.description,
    }));
    send(res, 200, { ok: true, examples: list });
    return;
  }
  if (req.method === "POST" && url === "/run") {
    handleRun(req, res).catch((error: unknown) => {
      send(res, 500, {
        ok: false,
        error: { message: error instanceof Error ? error.message : String(error) },
      });
    });
    return;
  }
  send(res, 404, { ok: false, error: { message: "not found" } });
});

server.listen(PORT, () => {
  process.stdout.write(`node-service listening on http://localhost:${PORT}\n`);
});
