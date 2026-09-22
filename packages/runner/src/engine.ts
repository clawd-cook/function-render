import {
  evaluate,
  evaluateCondition,
  FunctionRenderError,
  getSlot,
  normalizeFunc,
  normalizeSlotPath,
  resolveArgs,
  setSlot,
  validate,
  type FlowSpec,
  type FuncRegistry,
  type NormalizedFunc,
  type NodeSpec,
  type RunResult,
  type SlotSpace,
} from "@logic-renderer/core";

export interface RunOptions {
  input: unknown;
  funcs: FuncRegistry;
  preview?: boolean;
}

interface RollbackFrame {
  funcKey: string;
  args: Record<string, unknown>;
  result: unknown;
  rollback?: NormalizedFunc["rollback"];
  path: string;
}

export interface LogEntry {
  level: "info" | "warn" | "error";
  message: unknown;
  path: string;
}

type LogSink = (entry: LogEntry) => void;

let logSink: LogSink | undefined;

/** Test-only: inject an internal log sink. Not part of the public run result. */
export function setLogSink(sink: LogSink | undefined): void {
  logSink = sink;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function writeOutput(
  state: SlotSpace,
  outputTo: string | undefined,
  value: unknown,
  path: string,
): void {
  if (outputTo === undefined) return;
  const slotPath = normalizeSlotPath(outputTo, `${path}/outputTo`);
  setSlot(state, slotPath, value, path);
}

/** Bind a loop Slot key, run `fn`, then restore the previous value (or delete). */
async function withBoundSlot(
  state: SlotSpace,
  key: string,
  value: unknown,
  fn: () => Promise<unknown>,
): Promise<unknown> {
  const had = Object.prototype.hasOwnProperty.call(state, key);
  const prev = state[key];
  state[key] = value;
  try {
    return await fn();
  } finally {
    if (had) state[key] = prev;
    else delete state[key];
  }
}

function requireArray(value: unknown, path: string, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new FunctionRenderError({
      phase: "run",
      path,
      message: `${label} must evaluate to an array`,
    });
  }
  return value;
}

function enforceMaxIter(length: number, maxIter: number, path: string, label: string): void {
  if (length > maxIter) {
    throw new FunctionRenderError({
      phase: "run",
      path,
      message: `${label} items length ${length} exceeds maxIter ${maxIter}`,
    });
  }
}

async function walk(
  node: NodeSpec,
  path: string,
  funcs: Record<string, NormalizedFunc>,
  state: SlotSpace,
  preview: boolean,
  stack: RollbackFrame[],
): Promise<unknown> {
  const ctx = { state };

  let result: unknown;

  switch (node.type) {
    case "then": {
      const nodes = (node.params as { nodes: NodeSpec[] }).nodes;
      let last: unknown;
      for (let i = 0; i < nodes.length; i++) {
        last = await walk(nodes[i]!, `${path}/params/nodes/${i}`, funcs, state, preview, stack);
      }
      result = last;
      break;
    }
    case "when": {
      const params = node.params as {
        nodes: NodeSpec[];
        waitAll?: boolean;
        failStrategy?: "fastFail" | "allSettled";
      };
      const waitAll = params.waitAll !== false;
      const failStrategy = params.failStrategy ?? "fastFail";
      const tasks = params.nodes.map((child: NodeSpec, i: number) =>
        walk(child, `${path}/params/nodes/${i}`, funcs, state, preview, stack),
      );

      if (!waitAll) {
        try {
          result = await Promise.race(tasks);
        } finally {
          // Prevent unhandled rejections from non-winning branches
          for (const t of tasks) {
            void t.catch(() => {});
          }
        }
        break;
      }

      if (failStrategy === "allSettled") {
        const settled = await Promise.allSettled(tasks);
        const rejected = settled.find(
          (s: PromiseSettledResult<unknown>) => s.status === "rejected",
        );
        if (rejected && rejected.status === "rejected") throw rejected.reason;
        result = settled.map((s: PromiseSettledResult<unknown>) =>
          s.status === "fulfilled" ? s.value : undefined,
        );
      } else {
        result = await Promise.all(tasks);
      }
      break;
    }
    case "if": {
      const params = node.params as {
        condition: unknown;
        trueBranch: NodeSpec;
        falseBranch?: NodeSpec;
      };
      if (evaluateCondition(params.condition, ctx, `${path}/params/condition`)) {
        result = await walk(
          params.trueBranch,
          `${path}/params/trueBranch`,
          funcs,
          state,
          preview,
          stack,
        );
      } else if (params.falseBranch) {
        result = await walk(
          params.falseBranch,
          `${path}/params/falseBranch`,
          funcs,
          state,
          preview,
          stack,
        );
      } else {
        result = undefined;
      }
      break;
    }
    case "switch": {
      const params = node.params as {
        input: unknown;
        cases: { match: unknown; node: NodeSpec }[];
        default?: NodeSpec;
      };
      const value = evaluate(params.input, ctx, `${path}/params/input`);
      let matched: NodeSpec | undefined;
      for (const c of params.cases) {
        if (Object.is(value, c.match)) {
          matched = c.node;
          break;
        }
      }
      if (matched) {
        const idx = params.cases.findIndex((c: { node: NodeSpec }) => c.node === matched);
        result = await walk(
          matched,
          `${path}/params/cases/${idx}/node`,
          funcs,
          state,
          preview,
          stack,
        );
      } else if (params.default) {
        result = await walk(params.default, `${path}/params/default`, funcs, state, preview, stack);
      } else {
        result = undefined;
      }
      break;
    }
    case "while": {
      const params = node.params as {
        condition: unknown;
        body: NodeSpec;
        maxIter: number;
      };
      let last: unknown;
      let iter = 0;
      while (evaluateCondition(params.condition, ctx, `${path}/params/condition`)) {
        if (iter >= params.maxIter) {
          throw new FunctionRenderError({
            phase: "run",
            path,
            message: `while exceeded maxIter ${params.maxIter}`,
          });
        }
        last = await walk(params.body, `${path}/params/body`, funcs, state, preview, stack);
        iter += 1;
      }
      result = last;
      break;
    }
    case "for": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        indexKey?: string;
        body: NodeSpec;
        maxIter: number;
      };
      const items = requireArray(
        evaluate(params.items, ctx, `${path}/params/items`),
        `${path}/params/items`,
        "for.items",
      );
      enforceMaxIter(items.length, params.maxIter, path, "for");
      let last: unknown;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        last = await withBoundSlot(state, params.itemKey, item, async () => {
          if (params.indexKey) {
            return await withBoundSlot(state, params.indexKey, i, async () =>
              walk(params.body, `${path}/params/body`, funcs, state, preview, stack),
            );
          }
          return walk(params.body, `${path}/params/body`, funcs, state, preview, stack);
        });
      }
      result = last;
      break;
    }
    case "tryCatch": {
      const params = node.params as {
        body: NodeSpec;
        catch: NodeSpec;
        finally?: NodeSpec;
      };
      try {
        result = await walk(params.body, `${path}/params/body`, funcs, state, preview, stack);
      } catch (error) {
        state.error = error instanceof FunctionRenderError ? error.message : describe(error);
        result = await walk(params.catch, `${path}/params/catch`, funcs, state, preview, stack);
      } finally {
        if (params.finally) {
          await walk(params.finally, `${path}/params/finally`, funcs, state, preview, stack);
        }
      }
      break;
    }
    case "set": {
      const params = node.params as { path: string; value: unknown };
      const value = evaluate(params.value, ctx, `${path}/params/value`);
      const slotPath = normalizeSlotPath(params.path, `${path}/params/path`);
      setSlot(state, slotPath, value, path);
      result = value;
      break;
    }
    case "get": {
      const params = node.params as { path: string };
      const slotPath = normalizeSlotPath(params.path, `${path}/params/path`);
      result = getSlot(state, slotPath);
      break;
    }
    case "callFunc": {
      const params = node.params as { funcKey: string; args?: Record<string, unknown> };
      const def = funcs[params.funcKey]!;
      const args = resolveArgs(params.args, ctx, `${path}/params/args`);

      let finalArgs: Record<string, unknown> = args;
      if (def.params) {
        const parsed = def.params.safeParse(args);
        if (!parsed.success) {
          throw new FunctionRenderError({
            phase: "run",
            path,
            message: `invalid arguments for "${params.funcKey}": ${parsed.error.issues[0]?.message ?? "invalid"}`,
            funcKey: params.funcKey,
            cause: parsed.error,
          });
        }
        finalArgs = parsed.data as Record<string, unknown>;
      }

      // preview safety guarantee: never call Func.run
      if (preview) {
        result = undefined;
        break;
      }

      try {
        result = await def.run(finalArgs);
      } catch (error) {
        if (error instanceof FunctionRenderError) throw error;
        throw new FunctionRenderError({
          phase: "run",
          path,
          message: `function "${params.funcKey}" threw: ${describe(error)}`,
          funcKey: params.funcKey,
          cause: error,
        });
      }

      if (def.sideEffect) {
        stack.push({
          funcKey: params.funcKey,
          args: finalArgs,
          result,
          rollback: def.rollback,
          path,
        });
      }
      break;
    }
    case "arrayMap": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        body: NodeSpec;
        maxIter?: number;
      };
      const items = requireArray(
        evaluate(params.items, ctx, `${path}/params/items`),
        `${path}/params/items`,
        "arrayMap.items",
      );
      const maxIter = params.maxIter ?? items.length;
      enforceMaxIter(items.length, maxIter, path, "arrayMap");
      const out: unknown[] = [];
      for (let i = 0; i < items.length; i++) {
        const mapped = await withBoundSlot(state, params.itemKey, items[i], async () =>
          walk(params.body, `${path}/params/body`, funcs, state, preview, stack),
        );
        out.push(mapped);
      }
      result = out;
      break;
    }
    case "arrayFilter": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        condition: unknown;
      };
      const items = requireArray(
        evaluate(params.items, ctx, `${path}/params/items`),
        `${path}/params/items`,
        "arrayFilter.items",
      );
      const out: unknown[] = [];
      for (const item of items) {
        const keep = await withBoundSlot(state, params.itemKey, item, async () =>
          evaluateCondition(params.condition, ctx, `${path}/params/condition`),
        );
        if (keep) out.push(item);
      }
      result = out;
      break;
    }
    case "arrayReduce": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        accumKey: string;
        init: unknown;
        body: NodeSpec;
        maxIter?: number;
      };
      const items = requireArray(
        evaluate(params.items, ctx, `${path}/params/items`),
        `${path}/params/items`,
        "arrayReduce.items",
      );
      const maxIter = params.maxIter ?? items.length;
      enforceMaxIter(items.length, maxIter, path, "arrayReduce");
      let accum = evaluate(params.init, ctx, `${path}/params/init`);
      for (const item of items) {
        accum = await withBoundSlot(state, params.itemKey, item, async () =>
          withBoundSlot(state, params.accumKey, accum, async () =>
            walk(params.body, `${path}/params/body`, funcs, state, preview, stack),
          ),
        );
      }
      result = accum;
      break;
    }
    case "log": {
      const params = node.params as {
        message: unknown;
        level?: "info" | "warn" | "error";
      };
      const message = evaluate(params.message, ctx, `${path}/params/message`);
      const level = params.level ?? "info";
      logSink?.({ level, message, path });
      result = message;
      break;
    }
    case "assert": {
      const params = node.params as { condition: unknown; message: string };
      if (!evaluateCondition(params.condition, ctx, `${path}/params/condition`)) {
        throw new FunctionRenderError({
          phase: "run",
          path,
          message: params.message,
        });
      }
      result = true;
      break;
    }
    case "sleep": {
      const params = node.params as { ms: number };
      if (!preview) {
        await new Promise<void>((resolve: () => void) => {
          setTimeout(resolve, params.ms);
        });
      }
      result = undefined;
      break;
    }
    case "constant": {
      result = (node.params as { value: unknown }).value;
      break;
    }
    case "expr": {
      result = evaluate((node.params as { value: unknown }).value, ctx, `${path}/params/value`);
      break;
    }
    default: {
      throw new FunctionRenderError({
        phase: "run",
        path,
        message: `unknown NodeType: ${String((node as NodeSpec).type)}`,
      });
    }
  }

  // preview callFunc never runs → do not materialize outputTo with undefined
  if (!(preview && node.type === "callFunc")) {
    writeOutput(state, node.outputTo, result, path);
  }
  return result;
}

async function runRollback(stack: RollbackFrame[], originalError: unknown): Promise<never> {
  let rollbackError: unknown;
  for (let i = stack.length - 1; i >= 0; i--) {
    const frame = stack[i]!;
    if (!frame.rollback) continue;
    try {
      await frame.rollback(frame.args, frame.result);
    } catch (error) {
      if (!rollbackError) {
        rollbackError = new FunctionRenderError({
          phase: "rollback",
          path: frame.path,
          message: `rollback for "${frame.funcKey}" failed: ${describe(error)}`,
          funcKey: frame.funcKey,
          cause: originalError,
        });
      }
    }
  }
  if (rollbackError) throw rollbackError;
  throw originalError;
}

/**
 * Validate then walk a FlowSpec. On failure (non-preview), reverse-order
 * rollback of sideEffect frames, then rethrow.
 */
export async function run(spec: unknown, options: RunOptions): Promise<RunResult> {
  if (
    options === null ||
    typeof options !== "object" ||
    !("funcs" in options) ||
    options.funcs === null ||
    typeof options.funcs !== "object"
  ) {
    throw new TypeError("run options must be an object with funcs");
  }
  const preview = options.preview === true;
  const funcs: Record<string, NormalizedFunc> = {};
  for (const [key, fn] of Object.entries(options.funcs)) {
    funcs[key] = normalizeFunc(fn);
  }

  const flow: FlowSpec = validate(spec, { funcs: options.funcs });
  const state: SlotSpace = { input: structuredClone(options.input) };
  const stack: RollbackFrame[] = [];

  try {
    const result = await walk(flow, "", funcs, state, preview, stack);
    return { state, result };
  } catch (error) {
    if (preview || stack.length === 0) throw error;
    return await runRollback(stack, error);
  }
}
