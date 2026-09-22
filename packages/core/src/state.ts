import { FunctionRenderError } from "./errors.ts";
import type { StateModel } from "./types.ts";

/** True for an empty pointer (whole document) or one starting with `/`. */
export function isJsonPointer(pointer: string): boolean {
  return pointer === "" || pointer.startsWith("/");
}

/**
 * Parse a JSON Pointer (RFC 6901) into its decoded reference tokens.
 * `~1` decodes to `/` and `~0` to `~`. An empty pointer yields `[]`.
 */
export function parsePointer(pointer: string): string[] {
  if (pointer === "") return [];
  const body = pointer.startsWith("/") ? pointer.slice(1) : pointer;
  return body.split("/").map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/** Read the value at `pointer`, or `undefined` when the path does not resolve. */
export function getByPath(state: StateModel, pointer: string): unknown {
  const segments = parsePointer(pointer);
  let current: unknown = state;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    if (Array.isArray(current)) {
      const index = segment === "-" ? current.length : Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return current;
}

/**
 * Write `value` at `pointer`, mutating `state` in place. Missing containers
 * along the path are created (an array when the next token is a numeric index
 * or `-`, otherwise an object). A trailing `-` pushes onto an array.
 */
export function setByPath(state: StateModel, pointer: string, value: unknown): void {
  const segments = parsePointer(pointer);
  if (segments.length === 0) {
    throw new FunctionRenderError("validation", pointer, "cannot set the root pointer");
  }

  let current: Record<string, unknown> | unknown[] = state;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    const next = segments[i + 1]!;
    let child = Array.isArray(current)
      ? current[Number(segment)]
      : (current as Record<string, unknown>)[segment];

    if (child === null || typeof child !== "object") {
      child = /^\d+$/.test(next) || next === "-" ? [] : {};
      if (Array.isArray(current)) current[Number(segment)] = child;
      else (current as Record<string, unknown>)[segment] = child;
    }
    current = child as Record<string, unknown> | unknown[];
  }

  const last = segments[segments.length - 1]!;
  if (Array.isArray(current)) {
    if (last === "-") current.push(value);
    else current[Number(last)] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }
}
