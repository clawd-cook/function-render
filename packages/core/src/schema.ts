import { z } from "zod";

import type { FlowSpec, NodeSpec, NodeType } from "./types.ts";

/** A JSON value that may contain ExprAtom objects or Slot path strings. */
export type Expr = string | number | boolean | null | Expr[] | { [key: string]: Expr };

/** v1 ExprAtoms (settlement subset). `$lit` is the forced-literal escape. */
export const V1_EXPR_ATOMS = new Set(["$add", "$mul", "$gt", "$lit"]);

/** v1 NodeTypes. */
export const V1_NODE_TYPES = new Set<NodeType>(["then", "if", "set", "callFunc"]);

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

const ThenParams = z.strictObject({
  nodes: z.array(z.lazy(() => NodeSpecSchema)),
});

const IfParams = z.strictObject({
  condition: ExprSchema,
  trueBranch: z.lazy(() => NodeSpecSchema),
  falseBranch: z.lazy(() => NodeSpecSchema).optional(),
});

const SetParams = z.strictObject({
  path: z.string(),
  value: ExprSchema,
});

const CallFuncParams = z.strictObject({
  funcKey: z.string(),
  args: z.record(z.string(), ExprSchema).default({}),
});

export const NodeSpecSchema: z.ZodType<NodeSpec> = z.lazy(() =>
  z.discriminatedUnion("type", [
    // oxlint-disable-next-line unicorn/no-thenable -- `then` is a NodeType, not a Promise callback
    z.strictObject({
      type: z.literal("then"),
      params: ThenParams,
      outputTo: z.string().optional(),
    }),
    z.strictObject({
      type: z.literal("if"),
      params: IfParams,
      outputTo: z.string().optional(),
    }),
    z.strictObject({
      type: z.literal("set"),
      params: SetParams,
      outputTo: z.string().optional(),
    }),
    z.strictObject({
      type: z.literal("callFunc"),
      params: CallFuncParams,
      outputTo: z.string().optional(),
    }),
  ]),
) as z.ZodType<NodeSpec>;

export type { FlowSpec, NodeSpec, NodeType };
