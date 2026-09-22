import { FunctionRenderError } from "./errors.ts";
import type { SlotSpace } from "./types.ts";

/** Slot path: `$.a.b` or shorthand `a.b` (normalized to `$.a.b`). */
const SLOT_PATH_RE = /^\$\.[A-Za-z_][\w.]*$/;
const SHORTHAND_RE = /^[A-Za-z_][\w.]*$/;

/** True when a string is a Slot read expression (`$.path`). */
export function isSlotPath(value: string): boolean {
  return SLOT_PATH_RE.test(value);
}

/**
 * Normalize `$.tax` or `tax` to `$.tax`.
 * Throws validate-phase error on invalid paths.
 */
export function normalizeSlotPath(path: string, errorPath = ""): string {
  if (isSlotPath(path)) return path;
  if (SHORTHAND_RE.test(path)) return `$.${path}`;
  throw new FunctionRenderError({
    phase: "validate",
    path: errorPath,
    message: `invalid Slot path: ${JSON.stringify(path)}`,
  });
}

/** Decode `$.a.b.c` into `["a","b","c"]`. */
export function parseSlotSegments(path: string, errorPath = ""): string[] {
  const normalized = normalizeSlotPath(path, errorPath);
  return normalized.slice(2).split(".");
}

/** Read a value from Slot space; missing path → `undefined`. */
export function getSlot(state: SlotSpace, path: string): unknown {
  const segments = parseSlotSegments(path);
  let current: unknown = state;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Write `value` at Slot path, creating intermediate objects.
 * Rejects writes under `$.input` (readonly).
 */
export function setSlot(state: SlotSpace, path: string, value: unknown, errorPath = ""): void {
  const segments = parseSlotSegments(path, errorPath);
  if (segments[0] === "input") {
    throw new FunctionRenderError({
      phase: "run",
      path: errorPath,
      message: "$.input is readonly",
    });
  }
  if (segments.length === 0) {
    throw new FunctionRenderError({
      phase: "run",
      path: errorPath,
      message: "cannot set the Slot root",
    });
  }

  let current: Record<string, unknown> = state;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    let child = current[segment];
    if (child === null || typeof child !== "object" || Array.isArray(child)) {
      child = {};
      current[segment] = child;
    }
    current = child as Record<string, unknown>;
  }
  current[segments[segments.length - 1]!] = value;
}
