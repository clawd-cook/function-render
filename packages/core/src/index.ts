export { FunctionRenderError } from "./errors.ts";
export type { FunctionRenderErrorPhase, FunctionRenderErrorOptions } from "./errors.ts";

export type {
  SlotSpace,
  StateModel,
  Func,
  FuncRegistry,
  NormalizedFunc,
  NodeType,
  NodeSpec,
  FlowSpec,
  RunResult,
  FunctionDef,
  FnImpl,
  Catalog,
} from "./types.ts";
export { normalizeFunc } from "./types.ts";

export { isSlotPath, normalizeSlotPath, parseSlotSegments, getSlot, setSlot } from "./state.ts";

export { ExprSchema, NodeSpecSchema, V1_EXPR_ATOMS, V1_NODE_TYPES } from "./schema.ts";
export type { Expr } from "./schema.ts";

export { evaluate, resolveArgs, evaluateCondition } from "./expr.ts";
export type { ExprContext } from "./expr.ts";

export { validate } from "./validate.ts";
export type { ValidateOptions } from "./validate.ts";
