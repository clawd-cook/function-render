import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { HistoryLine, Report } from "./schema.ts";

/**
 * Write the latest report and append a trend line.
 * `dataDir` is `apps/docs/data/test262`.
 */
export function writeReport(report: Report, dataDir: string): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const line: HistoryLine = {
    ts: report.generatedAt,
    commit: report.commit,
    passRate: report.conformance.passRate,
    coverage: report.conformance.coverage.ratio,
    p50Ms: report.performance.p50Ms,
    p95Ms: report.performance.p95Ms,
    total: report.conformance.total,
  };
  appendFileSync(join(dataDir, "history.jsonl"), `${JSON.stringify(line)}\n`, "utf8");
}
