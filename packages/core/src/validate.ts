import { FunctionRenderError } from "./errors.ts";
import { V1_EXPR_ATOMS, NodeSpecSchema } from "./schema.ts";
import { parseSlotSegments } from "./state.ts";
import type { FlowSpec, FuncRegistry, NodeSpec } from "./types.ts";

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
    if (!V1_EXPR_ATOMS.has(atom)) {
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

function checkNode(node: NodeSpec, path: string, funcKeys: Set<string>): void {
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
        checkNode(child, `${path}/params/nodes/${i}`, funcKeys),
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
      checkNode(params.trueBranch, `${path}/params/trueBranch`, funcKeys);
      if (params.falseBranch) {
        checkNode(params.falseBranch, `${path}/params/falseBranch`, funcKeys);
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
    // Unknown type often surfaces as invalid_union / invalid_literal
    const msg = issue.message;
    throw new FunctionRenderError({
      phase: "validate",
      path: issuePath(issue.path),
      message: msg,
    });
  }
  checkNode(parsed.data, "", new Set(Object.keys(options.funcs)));
  return parsed.data;
}
