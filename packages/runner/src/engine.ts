import {
  evaluate,
  evaluateCondition,
  FunctionRenderError,
  getByPath,
  resolveArgs,
  setByPath,
  validate,
  type Catalog,
  type FunctionDef,
  type Node,
  type RunContext,
  type RunResult,
  type StateModel,
} from "@function-renderer/core";

export interface RunOptions {
  catalog: Catalog;
  initialState?: StateModel;
}

type NormalizedCatalog = Record<string, FunctionDef>;

function normalizeCatalog(catalog: Catalog): NormalizedCatalog {
  const normalized: NormalizedCatalog = {};
  for (const [name, def] of Object.entries(catalog)) {
    normalized[name] = typeof def === "function" ? { run: def } : def;
  }
  return normalized;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function exec(
  node: Node,
  path: string,
  catalog: NormalizedCatalog,
  ctx: RunContext,
): Promise<unknown> {
  if ("call" in node) {
    const def = catalog[node.call]!;
    const args = resolveArgs(node.args ?? {}, ctx);

    let finalArgs: unknown = args;
    if (def.params) {
      const parsed = def.params.safeParse(args);
      if (!parsed.success) {
        throw new FunctionRenderError(
          "validation",
          path,
          `invalid arguments for "${node.call}": ${parsed.error.issues[0]?.message ?? "invalid"}`,
          { fnName: node.call, cause: parsed.error },
        );
      }
      finalArgs = parsed.data;
    }

    let result: unknown;
    try {
      result = await def.run(finalArgs, ctx);
    } catch (error) {
      if (error instanceof FunctionRenderError) throw error;
      throw new FunctionRenderError(
        "call",
        path,
        `function "${node.call}" threw: ${describe(error)}`,
        {
          fnName: node.call,
          cause: error,
        },
      );
    }

    if (node.out !== undefined) ctx.set(node.out, result);
    return result;
  }

  if ("seq" in node) {
    let last: unknown;
    for (let i = 0; i < node.seq.length; i++) {
      last = await exec(node.seq[i]!, `${path}/seq/${i}`, catalog, ctx);
    }
    return last;
  }

  if ("parallel" in node) {
    return Promise.all(
      node.parallel.map((child: Node, i: number) =>
        exec(child, `${path}/parallel/${i}`, catalog, ctx),
      ),
    );
  }

  if ("switch" in node) {
    const key = String(evaluate(node.switch, ctx));
    if (Object.prototype.hasOwnProperty.call(node.cases, key)) {
      return exec(node.cases[key]!, `${path}/switch/cases/${key}`, catalog, ctx);
    }
    return node.default ? exec(node.default, `${path}/switch/default`, catalog, ctx) : undefined;
  }

  if ("set" in node) {
    const value = evaluate(node.value, ctx);
    ctx.set(node.set, value);
    return value;
  }

  if ("for" in node) {
    const source = evaluate(node.for, ctx);
    const items: unknown[] = Array.isArray(source)
      ? source
      : typeof source === "number"
        ? Array.from({ length: Math.max(0, Math.floor(source)) }, (_unused, i) => i)
        : [];
    const results: unknown[] = [];
    for (let i = 0; i < items.length; i++) {
      if (node.as !== undefined) ctx.set(node.as, items[i]);
      if (node.indexAs !== undefined) ctx.set(node.indexAs, i);
      results.push(await exec(node.body, `${path}/for/body`, catalog, ctx));
    }
    return results;
  }

  if (evaluateCondition(node.if, ctx)) {
    return exec(node.then, `${path}/then`, catalog, ctx);
  }
  return node.else ? exec(node.else, `${path}/else`, catalog, ctx) : undefined;
}

/**
 * Validate and execute an orchestration spec against a catalog of functions.
 * Returns the final shared state and the root node's result. Fail-fast: the
 * first function error (or a `parallel` branch failure) aborts the run.
 */
export async function run(spec: unknown, options: RunOptions): Promise<RunResult> {
  const catalog = normalizeCatalog(options.catalog);
  const node = validate(spec, Object.keys(catalog));
  const state: StateModel = structuredClone(options.initialState ?? {});
  const ctx: RunContext = {
    state,
    get: (pointer) => getByPath(state, pointer),
    set: (pointer, value) => setByPath(state, pointer, value),
  };
  const result = await exec(node, "", catalog, ctx);
  return { state, result };
}
