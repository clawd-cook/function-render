import { z } from "zod";

import type { FlowSpec, NodeSpec, NodeType } from "./types.ts";

/** A JSON value that may contain ExprAtom objects or Slot path strings. */
export type Expr = string | number | boolean | null | Expr[] | { [key: string]: Expr };

/**
 * Closed ExprAtom set for the current engine (v1 + horizon). `$lit` is forced-literal.
 * Progressive tiers live in `complexity.ts` (`EXPR_COMPLEXITY`: L0 minimum + L3 widen).
 */
export const EXPR_ATOMS = new Set([
  "$add",
  "$mul",
  "$sub",
  "$div",
  "$mod",
  "$pow",
  "$abs",
  "$ceil",
  "$floor",
  "$round",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$eq",
  "$neq",
  "$and",
  "$or",
  "$not",
  "$len",
  "$at",
  "$concat",
  "$pick",
  "$omit",
  "$merge",
  "$lit",
]);

/** @deprecated Use {@link EXPR_ATOMS}. */
export const V1_EXPR_ATOMS = EXPR_ATOMS;

/**
 * Closed NodeType set for the current engine.
 * Progressive tiers live in `complexity.ts` (`NODE_COMPLEXITY`: L0 → L5).
 */
export const NODE_TYPES = new Set<NodeType>([
  "then",
  "when",
  "if",
  "switch",
  "while",
  "for",
  "tryCatch",
  "callFunc",
  "get",
  "set",
  "arrayMap",
  "arrayFilter",
  "arrayReduce",
  "log",
  "assert",
  "sleep",
  "constant",
  "expr",
]);

/** @deprecated Use {@link NODE_TYPES}. */
export const V1_NODE_TYPES = NODE_TYPES;

export const ExprSchema: z.ZodType<Expr> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(ExprSchema),
    z.record(z.string(), ExprSchema),
  ]),
) as z.ZodType<Expr>;

const NodeRef = z.lazy(() => NodeSpecSchema);

const ThenParams = z.strictObject({
  nodes: z.array(NodeRef),
});

const WhenParams = z.strictObject({
  nodes: z.array(NodeRef),
  waitAll: z.boolean().optional(),
  failStrategy: z.enum(["fastFail", "allSettled"]).optional(),
});

const IfParams = z.strictObject({
  condition: ExprSchema,
  trueBranch: NodeRef,
  falseBranch: NodeRef.optional(),
});

const SwitchCase = z.strictObject({
  match: z.unknown(),
  node: NodeRef,
});

const SwitchParams = z.strictObject({
  input: ExprSchema,
  cases: z.array(SwitchCase),
  default: NodeRef.optional(),
});

const WhileParams = z.strictObject({
  condition: ExprSchema,
  body: NodeRef,
  maxIter: z.number(),
});

const ForParams = z.strictObject({
  items: ExprSchema,
  itemKey: z.string(),
  indexKey: z.string().optional(),
  body: NodeRef,
  maxIter: z.number(),
});

const TryCatchParams = z.strictObject({
  body: NodeRef,
  catch: NodeRef,
  finally: NodeRef.optional(),
});

const CallFuncParams = z.strictObject({
  funcKey: z.string(),
  args: z.record(z.string(), ExprSchema).default({}),
});

const GetParams = z.strictObject({
  path: z.string(),
});

const SetParams = z.strictObject({
  path: z.string(),
  value: ExprSchema,
});

const ArrayMapParams = z.strictObject({
  items: ExprSchema,
  itemKey: z.string(),
  body: NodeRef,
  maxIter: z.number().optional(),
});

const ArrayFilterParams = z.strictObject({
  items: ExprSchema,
  itemKey: z.string(),
  condition: ExprSchema,
});

const ArrayReduceParams = z.strictObject({
  items: ExprSchema,
  itemKey: z.string(),
  accumKey: z.string(),
  init: ExprSchema,
  body: NodeRef,
  maxIter: z.number().optional(),
});

const LogParams = z.strictObject({
  message: ExprSchema,
  level: z.enum(["info", "warn", "error"]).optional(),
});

const AssertParams = z.strictObject({
  condition: ExprSchema,
  message: z.string(),
});

const SleepParams = z.strictObject({
  ms: z.number().nonnegative(),
});

const ConstantParams = z.strictObject({
  value: z.unknown(),
});

const ExprParams = z.strictObject({
  value: ExprSchema,
});

const optionalOutput = z.string().optional();

export const NodeSpecSchema: z.ZodType<NodeSpec> = z.lazy(() =>
  z.discriminatedUnion("type", [
    // oxlint-disable-next-line unicorn/no-thenable -- `then` is a NodeType, not a Promise callback
    z.strictObject({ type: z.literal("then"), params: ThenParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("when"), params: WhenParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("if"), params: IfParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("switch"), params: SwitchParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("while"), params: WhileParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("for"), params: ForParams, outputTo: optionalOutput }),
    z.strictObject({
      type: z.literal("tryCatch"),
      params: TryCatchParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({
      type: z.literal("callFunc"),
      params: CallFuncParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({ type: z.literal("get"), params: GetParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("set"), params: SetParams, outputTo: optionalOutput }),
    z.strictObject({
      type: z.literal("arrayMap"),
      params: ArrayMapParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({
      type: z.literal("arrayFilter"),
      params: ArrayFilterParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({
      type: z.literal("arrayReduce"),
      params: ArrayReduceParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({ type: z.literal("log"), params: LogParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("assert"), params: AssertParams, outputTo: optionalOutput }),
    z.strictObject({ type: z.literal("sleep"), params: SleepParams, outputTo: optionalOutput }),
    z.strictObject({
      type: z.literal("constant"),
      params: ConstantParams,
      outputTo: optionalOutput,
    }),
    z.strictObject({ type: z.literal("expr"), params: ExprParams, outputTo: optionalOutput }),
  ]),
) as z.ZodType<NodeSpec>;

export type { FlowSpec, NodeSpec, NodeType };
