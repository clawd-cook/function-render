import { standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run, type FuncRegistry } from "@logic-renderer/runner";

import { deepEqual } from "./deep-equal.ts";
import type {
  CategoryStat,
  ConformanceReport,
  CorpusEntry,
  FailureRecord,
  PerformanceReport,
} from "./schema.ts";

export interface RunCorpusOptions {
  funcs?: FuncRegistry;
  /** Timing samples per entry (correctness is judged on every sample). */
  samples?: number;
  /** Coverage denominator (non-fixture test/language file count). */
  denominator: number;
}

export interface CorpusRunResult {
  conformance: ConformanceReport;
  performance: PerformanceReport;
  byCategory: Record<string, CategoryStat>;
  failures: FailureRecord[];
  /** Per-entry median render time (ms), for reporting/debugging. */
  perEntryMedianMs: { id: string; ms: number }[];
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  );
  return sortedAsc[idx]!;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Judge a single render outcome against an entry's expectation. */
async function judge(
  entry: CorpusEntry,
  funcs: FuncRegistry,
): Promise<{ pass: boolean; reason?: string }> {
  const { expectation } = entry;
  try {
    const { result } = await run(entry.spec, { input: entry.input, funcs });
    if (expectation.kind === "throws") {
      return {
        pass: false,
        reason: `expected throw in phase "${expectation.phase}" but rendered a value`,
      };
    }
    if (!deepEqual(result, expectation.expected)) {
      return {
        pass: false,
        reason: `result ${JSON.stringify(result)} !== expected ${JSON.stringify(expectation.expected)}`,
      };
    }
    return { pass: true };
  } catch (error) {
    if (expectation.kind !== "throws") {
      return {
        pass: false,
        reason: `unexpected throw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    if (!(error instanceof FunctionRenderError)) {
      return { pass: false, reason: `threw non-FunctionRenderError: ${String(error)}` };
    }
    if (error.phase !== expectation.phase) {
      return {
        pass: false,
        reason: `threw in phase "${error.phase}", expected "${expectation.phase}"`,
      };
    }
    if (expectation.messageIncludes && !error.message.includes(expectation.messageIncludes)) {
      return {
        pass: false,
        reason: `message "${error.message}" missing "${expectation.messageIncludes}"`,
      };
    }
    return { pass: true };
  }
}

export async function runCorpus(
  entries: readonly CorpusEntry[],
  options: RunCorpusOptions,
): Promise<CorpusRunResult> {
  const funcs = options.funcs ?? standardCatalog;
  const samples = Math.max(1, options.samples ?? 5);

  const byCategory: Record<string, CategoryStat> = {};
  const failures: FailureRecord[] = [];
  const perEntryMedianMs: { id: string; ms: number }[] = [];
  let passed = 0;

  for (const entry of entries) {
    const stat = (byCategory[entry.category] ??= { total: 0, passed: 0 });
    stat.total += 1;

    let entryPass = true;
    let reason: string | undefined;
    const timings: number[] = [];
    for (let s = 0; s < samples; s++) {
      const start = performance.now();
      const outcome = await judge(entry, funcs);
      timings.push(performance.now() - start);
      if (!outcome.pass) {
        entryPass = false;
        reason = outcome.reason;
        break;
      }
    }

    perEntryMedianMs.push({ id: entry.id, ms: median(timings) });
    if (entryPass) {
      passed += 1;
      stat.passed += 1;
    } else {
      failures.push({ id: entry.id, test262Path: entry.test262Path, reason: reason ?? "unknown" });
    }
  }

  const total = entries.length;
  const medians = perEntryMedianMs.map((e) => e.ms).sort((a, b) => a - b);
  const totalMs = medians.reduce((sum, ms) => sum + ms, 0);
  const performanceReport: PerformanceReport = {
    samples,
    p50Ms: Number(percentile(medians, 50).toFixed(4)),
    p95Ms: Number(percentile(medians, 95).toFixed(4)),
    totalMs: Number(totalMs.toFixed(4)),
    casesPerSec: totalMs > 0 ? Number(((total / totalMs) * 1000).toFixed(1)) : 0,
  };

  const covered = new Set(entries.map((e) => e.test262Path)).size;
  const conformance: ConformanceReport = {
    total,
    passed,
    failed: total - passed,
    passRate: total > 0 ? Number((passed / total).toFixed(4)) : 0,
    coverage: {
      covered,
      denominator: options.denominator,
      ratio: options.denominator > 0 ? Number((covered / options.denominator).toFixed(6)) : 0,
    },
  };

  return { conformance, performance: performanceReport, byCategory, failures, perEntryMedianMs };
}
