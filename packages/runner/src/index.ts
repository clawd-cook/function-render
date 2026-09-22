export { run, setLogSink } from "./engine.ts";
export type { RunOptions, LogEntry } from "./engine.ts";

export type {
  Func,
  FuncRegistry,
  FlowSpec,
  NodeSpec,
  NodeType,
  RunResult,
  SlotSpace,
  Catalog,
  FunctionDef,
  FnImpl,
  StateModel,
} from "@logic-renderer/core";
export { FunctionRenderError, validate, normalizeFunc } from "@logic-renderer/core";
