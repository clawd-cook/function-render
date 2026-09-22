import type { FlowSpec } from "@logic-renderer/runner";

/** Expectation for a modeled case: a rendered value, or a thrown render error. */
export type Expectation =
  | { kind: "value"; expected: unknown }
  | {
      kind: "throws";
      /** logic-render error phase the modeled program should fail in. */
      phase: "validate" | "run" | "rollback";
      /** Optional substring the thrown message must contain. */
      messageIncludes?: string;
    };

/**
 * One test262 `test/language` case modeled as logic-render config.
 * `test262Path` is the real relative path under `submodules/test262` (provenance +
 * on-disk existence guard); the FlowSpec models the case's core semantics
 * ("配置 + render"), since logic-render cannot execute raw JS.
 */
export interface CorpusEntry {
  /** Stable slug, e.g. "expressions-addition-S11.6.1_A1". */
  id: string;
  /** Real path under submodules/test262, starting with "test/language/". */
  test262Path: string;
  esid?: string;
  /** Top-level test/language category, e.g. "expressions" | "statements". */
  category: string;
  /** What the modeled FlowSpec asserts (and how it maps to the real case). */
  description: string;
  spec: FlowSpec;
  /** Becomes `$.input`. */
  input: unknown;
  expectation: Expectation;
  /** Notes on the semantic mapping / caveats. */
  notes?: string;
}

export interface CoverageReport {
  covered: number;
  denominator: number;
  ratio: number;
}

export interface PerformanceReport {
  samples: number;
  p50Ms: number;
  p95Ms: number;
  totalMs: number;
  casesPerSec: number;
}

export interface CategoryStat {
  total: number;
  passed: number;
}

export interface FailureRecord {
  id: string;
  test262Path: string;
  reason: string;
}

export interface ConformanceReport {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  coverage: CoverageReport;
}

export interface Report {
  commit: string;
  test262Commit: string;
  node: string;
  generatedAt: string;
  conformance: ConformanceReport;
  performance: PerformanceReport;
  byCategory: Record<string, CategoryStat>;
  failures: FailureRecord[];
}

export interface HistoryLine {
  ts: string;
  commit: string;
  passRate: number;
  coverage: number;
  p50Ms: number;
  p95Ms: number;
  total: number;
}
