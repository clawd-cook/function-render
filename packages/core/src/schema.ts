import { z } from "zod";

import { isJsonPointer } from "./state.ts";

// ---------------------------------------------------------------------------
// Value expressions
// ---------------------------------------------------------------------------

/**
 * A value expression: a JSON value that may contain operator objects such as
 * `{ "$state": "/ptr" }`, `{ "$add": [a, b] }`, `{ "$if": [c, t, e] }`.
 * Operator validity is checked at evaluation time (see `evaluate`).
 */
export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };

/** Back-compat aliases (value expressions supersede the old dynamic/condition types). */
export type DynamicValue = Value;
export type Condition = Value;
export interface Comparison {
  eq?: unknown;
  neq?: unknown;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  not?: true;
}

/** An orchestration node. Exactly one discriminant key per node. */
export type Node =
  | { call: string; args?: Record<string, Value>; out?: string }
  | { seq: Node[] }
  | { parallel: Node[] }
  | { if: Value; then: Node; else?: Node }
  | { switch: Value; cases: Record<string, Node>; default?: Node }
  | { for: Value; as?: string; indexAs?: string; body: Node }
  | { set: string; value: Value };

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const JsonPointer = z
  .string()
  .refine(isJsonPointer, { message: "invalid JSON Pointer (must be empty or start with '/')" });

export const ValueSchema: z.ZodType<Value> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(ValueSchema),
    z.record(z.string(), ValueSchema),
  ]),
);

/** Back-compat aliases. */
export const DynamicValueSchema = ValueSchema;
export const ConditionSchema = ValueSchema;

export const NodeSchema = z.lazy(() =>
  z.union([
    z.strictObject({
      call: z.string(),
      args: z.record(z.string(), ValueSchema).optional(),
      out: JsonPointer.optional(),
    }),
    z.strictObject({ seq: z.array(NodeSchema) }),
    z.strictObject({ parallel: z.array(NodeSchema) }),
    // oxlint-disable-next-line unicorn/no-thenable -- `then` is a spec field name, not a Promise callback
    z.strictObject({ if: ValueSchema, then: NodeSchema, else: NodeSchema.optional() }),
    z.strictObject({
      switch: ValueSchema,
      cases: z.record(z.string(), NodeSchema),
      default: NodeSchema.optional(),
    }),
    z.strictObject({
      for: ValueSchema,
      as: JsonPointer.optional(),
      indexAs: JsonPointer.optional(),
      body: NodeSchema,
    }),
    z.strictObject({ set: JsonPointer, value: ValueSchema }),
  ]),
) as z.ZodType<Node>;
