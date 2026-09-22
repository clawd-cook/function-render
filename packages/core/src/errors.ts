/**
 * Error thrown by the function renderer.
 *
 * `phase` distinguishes structural rejection (`"validate"`), walk-time
 * failures (`"run"`), and compensation failures (`"rollback"`).
 */
export type FunctionRenderErrorPhase = "validate" | "run" | "rollback";

export interface FunctionRenderErrorOptions {
  phase: FunctionRenderErrorPhase;
  path: string;
  message: string;
  funcKey?: string;
  cause?: unknown;
}

export class FunctionRenderError extends Error {
  readonly phase: FunctionRenderErrorPhase;
  readonly path: string;
  readonly funcKey?: string;

  constructor(options: FunctionRenderErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "FunctionRenderError";
    this.phase = options.phase;
    this.path = options.path;
    this.funcKey = options.funcKey;
  }
}
