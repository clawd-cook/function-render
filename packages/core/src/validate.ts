import { FunctionRenderError } from "./errors.ts";
import { EXPR_ATOMS, NodeSpecSchema } from "./schema.ts";
import { parseSlotSegments } from "./state.ts";
import { normalizeFunc, type FlowSpec, type FuncRegistry, type NodeSpec } from "./types.ts";

function issuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return "";
  return "/" + path.map((segment: PropertyKey) => String(segment)).join("/");
}

/** Walk Expr tree; unknown `$atom` → validate error. Infix strings are literals. */
function checkExpr(expr: unknown, path: string): void {
  if (Array.isArray(expr)) {
    expr.forEach((child: unknown, i: number) => checkExpr(child, `${path}/${i}`));
    return;
  }
  if (expr === null || typeof expr !== "object") return;

  const obj = expr as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 1 && keys[0]!.startsWith("$")) {
    const atom = keys[0]!;
    if (!EXPR_ATOMS.has(atom)) {
      throw new FunctionRenderError({
        phase: "validate",
        path,
        message: `unknown ExprAtom: ${atom}`,
      });
    }
    if (atom === "$lit") return;
    checkExpr(obj[atom], `${path}/${atom}`);
    return;
  }

  for (const key of keys) {
    checkExpr(obj[key], `${path}/${key}`);
  }
}

/** Reject invalid Slot paths and writes under readonly `$.input`. */
function checkWritableSlotPath(slotPath: string, errorPath: string): void {
  const segments = parseSlotSegments(slotPath, errorPath);
  if (segments[0] === "input") {
    throw new FunctionRenderError({
      phase: "validate",
      path: errorPath,
      message: "$.input is readonly",
    });
  }
}

function checkReadableSlotPath(slotPath: string, errorPath: string): void {
  parseSlotSegments(slotPath, errorPath);
}

/**
 * tryCatch.body must not contain callFunc targeting a sideEffect Func.
 * catch/finally may use sideEffect funcs for compensation.
 */
function scanTryCatchBodyForSideEffects(node: NodeSpec, path: string, funcs: FuncRegistry): void {
  if (node.type === "callFunc") {
    const params = node.params as { funcKey: string };
    const fn = funcs[params.funcKey];
    if (fn !== undefined && normalizeFunc(fn).sideEffect) {
      throw new FunctionRenderError({
        phase: "validate",
        path,
        message: `tryCatch.body must not call sideEffect func "${params.funcKey}"`,
        funcKey: params.funcKey,
      });
    }
  }

  switch (node.type) {
    case "then":
    case "when": {
      const nodes = (node.params as { nodes: NodeSpec[] }).nodes;
      nodes.forEach((child: NodeSpec, i: number) =>
        scanTryCatchBodyForSideEffects(child, `${path}/params/nodes/${i}`, funcs),
      );
      return;
    }
    case "if": {
      const params = node.params as {
        trueBranch: NodeSpec;
        falseBranch?: NodeSpec;
      };
      scanTryCatchBodyForSideEffects(params.trueBranch, `${path}/params/trueBranch`, funcs);
      if (params.falseBranch) {
        scanTryCatchBodyForSideEffects(params.falseBranch, `${path}/params/falseBranch`, funcs);
      }
      return;
    }
    case "switch": {
      const params = node.params as {
        cases: { node: NodeSpec }[];
        default?: NodeSpec;
      };
      params.cases.forEach((c: { node: NodeSpec }, i: number) =>
        scanTryCatchBodyForSideEffects(c.node, `${path}/params/cases/${i}/node`, funcs),
      );
      if (params.default) {
        scanTryCatchBodyForSideEffects(params.default, `${path}/params/default`, funcs);
      }
      return;
    }
    case "while":
    case "for": {
      const body = (node.params as { body: NodeSpec }).body;
      scanTryCatchBodyForSideEffects(body, `${path}/params/body`, funcs);
      return;
    }
    case "tryCatch": {
      const params = node.params as {
        body: NodeSpec;
        catch: NodeSpec;
        finally?: NodeSpec;
      };
      // Nested tryCatch: only its body is restricted; scan nested body too
      scanTryCatchBodyForSideEffects(params.body, `${path}/params/body`, funcs);
      return;
    }
    case "arrayMap":
    case "arrayReduce": {
      const body = (node.params as { body: NodeSpec }).body;
      scanTryCatchBodyForSideEffects(body, `${path}/params/body`, funcs);
      return;
    }
    default:
      return;
  }
}

function checkNode(node: NodeSpec, path: string, funcs: FuncRegistry): void {
  const funcKeys = new Set(Object.keys(funcs));

  if (node.outputTo !== undefined) {
    if (typeof node.outputTo !== "string") {
      throw new FunctionRenderError({
        phase: "validate",
        path: `${path}/outputTo`,
        message: "outputTo must be a string Slot path",
      });
    }
    checkWritableSlotPath(node.outputTo, `${path}/outputTo`);
  }

  switch (node.type) {
    case "then": {
      const nodes = (node.params as { nodes: NodeSpec[] }).nodes;
      nodes.forEach((child: NodeSpec, i: number) =>
        checkNode(child, `${path}/params/nodes/${i}`, funcs),
      );
      return;
    }
    case "when": {
      const nodes = (node.params as { nodes: NodeSpec[] }).nodes;
      nodes.forEach((child: NodeSpec, i: number) =>
        checkNode(child, `${path}/params/nodes/${i}`, funcs),
      );
      return;
    }
    case "if": {
      const params = node.params as {
        condition: unknown;
        trueBranch: NodeSpec;
        falseBranch?: NodeSpec;
      };
      checkExpr(params.condition, `${path}/params/condition`);
      checkNode(params.trueBranch, `${path}/params/trueBranch`, funcs);
      if (params.falseBranch) {
        checkNode(params.falseBranch, `${path}/params/falseBranch`, funcs);
      }
      return;
    }
    case "switch": {
      const params = node.params as {
        input: unknown;
        cases: { match: unknown; node: NodeSpec }[];
        default?: NodeSpec;
      };
      checkExpr(params.input, `${path}/params/input`);
      params.cases.forEach((c: { node: NodeSpec }, i: number) =>
        checkNode(c.node, `${path}/params/cases/${i}/node`, funcs),
      );
      if (params.default) {
        checkNode(params.default, `${path}/params/default`, funcs);
      }
      return;
    }
    case "while": {
      const params = node.params as {
        condition: unknown;
        body: NodeSpec;
        maxIter: number;
      };
      if (typeof params.maxIter !== "number") {
        throw new FunctionRenderError({
          phase: "validate",
          path: `${path}/params/maxIter`,
          message: "while requires maxIter",
        });
      }
      checkExpr(params.condition, `${path}/params/condition`);
      checkNode(params.body, `${path}/params/body`, funcs);
      return;
    }
    case "for": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        indexKey?: string;
        body: NodeSpec;
        maxIter: number;
      };
      if (typeof params.maxIter !== "number") {
        throw new FunctionRenderError({
          phase: "validate",
          path: `${path}/params/maxIter`,
          message: "for requires maxIter",
        });
      }
      checkExpr(params.items, `${path}/params/items`);
      checkNode(params.body, `${path}/params/body`, funcs);
      return;
    }
    case "tryCatch": {
      const params = node.params as {
        body: NodeSpec;
        catch: NodeSpec;
        finally?: NodeSpec;
      };
      scanTryCatchBodyForSideEffects(params.body, `${path}/params/body`, funcs);
      checkNode(params.body, `${path}/params/body`, funcs);
      checkNode(params.catch, `${path}/params/catch`, funcs);
      if (params.finally) {
        checkNode(params.finally, `${path}/params/finally`, funcs);
      }
      return;
    }
    case "set": {
      const params = node.params as { path: string; value: unknown };
      if (typeof params.path !== "string") {
        throw new FunctionRenderError({
          phase: "validate",
          path: `${path}/params/path`,
          message: "set.path must be a string",
        });
      }
      checkWritableSlotPath(params.path, `${path}/params/path`);
      checkExpr(params.value, `${path}/params/value`);
      return;
    }
    case "get": {
      const params = node.params as { path: string };
      if (typeof params.path !== "string") {
        throw new FunctionRenderError({
          phase: "validate",
          path: `${path}/params/path`,
          message: "get.path must be a string",
        });
      }
      checkReadableSlotPath(params.path, `${path}/params/path`);
      return;
    }
    case "callFunc": {
      const params = node.params as { funcKey: string; args?: Record<string, unknown> };
      if (!funcKeys.has(params.funcKey)) {
        throw new FunctionRenderError({
          phase: "validate",
          path,
          message: `unknown funcKey: ${params.funcKey}`,
          funcKey: params.funcKey,
        });
      }
      checkExpr(params.args ?? {}, `${path}/params/args`);
      return;
    }
    case "arrayMap": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        body: NodeSpec;
        maxIter?: number;
      };
      checkExpr(params.items, `${path}/params/items`);
      checkNode(params.body, `${path}/params/body`, funcs);
      return;
    }
    case "arrayFilter": {
      const params = node.params as {
        items: unknown;
        itemKey: string;
        condition: unknown;
      };
      checkExpr(params.items, `${path}/params/items`);
      checkExpr(params.condition, `${path}/params/condition`);
      return;
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
      checkExpr(params.items, `${path}/params/items`);
      checkExpr(params.init, `${path}/params/init`);
      checkNode(params.body, `${path}/params/body`, funcs);
      return;
    }
    case "log": {
      const params = node.params as { message: unknown };
      checkExpr(params.message, `${path}/params/message`);
      return;
    }
    case "assert": {
      const params = node.params as { condition: unknown; message: string };
      checkExpr(params.condition, `${path}/params/condition`);
      return;
    }
    case "sleep": {
      // ms schema already rejects negative; nothing else to check
      return;
    }
    case "constant": {
      return;
    }
    case "expr": {
      const params = node.params as { value: unknown };
      checkExpr(params.value, `${path}/params/value`);
      return;
    }
    default: {
      const unknownType = (node as NodeSpec).type;
      throw new FunctionRenderError({
        phase: "validate",
        path,
        message: `unknown NodeType: ${String(unknownType)}`,
      });
    }
  }
}

export interface ValidateOptions {
  funcs: FuncRegistry;
}

function assertFuncsOptions(options: unknown): asserts options is ValidateOptions {
  if (
    options === null ||
    typeof options !== "object" ||
    !("funcs" in options) ||
    (options as ValidateOptions).funcs === null ||
    typeof (options as ValidateOptions).funcs !== "object"
  ) {
    throw new TypeError("validate options must be an object with funcs");
  }
}

/**
 * Validate an untrusted FlowSpec. Reads `funcs` keys (and does not execute
 * any Func). Throws {@link FunctionRenderError} with `phase: "validate"`.
 */
export function validate(spec: unknown, options: ValidateOptions): FlowSpec {
  assertFuncsOptions(options);
  const parsed = NodeSpecSchema.safeParse(spec);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    const msg = issue.message;
    throw new FunctionRenderError({
      phase: "validate",
      path: issuePath(issue.path),
      message: msg,
    });
  }
  checkNode(parsed.data, "", options.funcs);
  return parsed.data;
}
