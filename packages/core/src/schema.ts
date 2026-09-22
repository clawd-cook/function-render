import { z } from "zod";

import { isJsonPointer } from "./state.ts";

// ---------------------------------------------------------------------------
// Public spec types (hand-written; the zod schemas below are annotated to them
// to keep recursive `z.lazy` unions inferable and stable).
// ---------------------------------------------------------------------------

/** A prop/arg value that may read from shared state via `{ $state }`. */
export type DynamicValue =
  | string
  | number
  | boolean
  | null
  | { $state: string }
  | DynamicValue[]
  | { [key: string]: DynamicValue };

/** Comparison operators shared by `$state` conditions. */
export interface Comparison {
  eq?: unknown;
  neq?: unknown;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  not?: true;
}

/** A boolean condition evaluated against shared state. */
export type Condition =
  | boolean
  | ({ $state: string } & Comparison)
  | Condition[]
  | { $and: Condition[] }
  | { $or: Condition[] };

/** An orchestration node. Exactly one discriminant key per node. */
export type Node =
  | { call: string; args?: Record<string, DynamicValue>; out?: string }
  | { seq: Node[] }
  | { parallel: Node[] }
  | { if: Condition; then: Node; else?: Node };

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const JsonPointer = z
  .string()
  .refine(isJsonPointer, { message: "invalid JSON Pointer (must be empty or start with '/')" });

export const DynamicValueSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.strictObject({ $state: JsonPointer }),
    z.array(DynamicValueSchema),
    z.record(z.string(), DynamicValueSchema),
  ]),
) as z.ZodType<DynamicValue>;

const comparison = {
  eq: z.unknown().optional(),
  neq: z.unknown().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  not: z.literal(true).optional(),
};

export const ConditionSchema = z.lazy(() =>
  z.union([
    z.boolean(),
    z.strictObject({ $state: JsonPointer, ...comparison }),
    z.array(ConditionSchema),
    z.strictObject({ $and: z.array(ConditionSchema) }),
    z.strictObject({ $or: z.array(ConditionSchema) }),
  ]),
) as z.ZodType<Condition>;

export const NodeSchema = z.lazy(() =>
  z.union([
    z.strictObject({
      call: z.string(),
      args: z.record(z.string(), DynamicValueSchema).optional(),
      out: JsonPointer.optional(),
    }),
    z.strictObject({ seq: z.array(NodeSchema) }),
    z.strictObject({ parallel: z.array(NodeSchema) }),
    // oxlint-disable-next-line unicorn/no-thenable -- `then` is a spec field name, not a Promise callback
    z.strictObject({ if: ConditionSchema, then: NodeSchema, else: NodeSchema.optional() }),
  ]),
) as z.ZodType<Node>;
