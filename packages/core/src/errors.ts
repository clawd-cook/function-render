/**
 * Error thrown by the function renderer.
 *
 * `kind` distinguishes a static/structural problem found before or during
 * argument preparation (`"validation"`) from an error raised while a
 * registered function was executing (`"call"`). `path` locates the offending
 * node inside the spec tree (a JSON-Pointer-like string, e.g. `/seq/1/then`).
 */
export type FunctionRenderErrorKind = "validation" | "call";

export interface FunctionRenderErrorOptions {
  fnName?: string;
  cause?: unknown;
}

export class FunctionRenderError extends Error {
  readonly kind: FunctionRenderErrorKind;
  readonly path: string;
  readonly fnName?: string;

  constructor(
    kind: FunctionRenderErrorKind,
    path: string,
    message: string,
    options: FunctionRenderErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "FunctionRenderError";
    this.kind = kind;
    this.path = path;
    this.fnName = options.fnName;
  }
}
