import {
  evaluate,
  evaluateCondition,
  FunctionRenderError,
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
    case "set": {
      const params = node.params as { path: string; value: unknown };
      const value = evaluate(params.value, ctx, `${path}/params/value`);
      const slotPath = normalizeSlotPath(params.path, `${path}/params/path`);
      setSlot(state, slotPath, value, path);
      result = value;
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
