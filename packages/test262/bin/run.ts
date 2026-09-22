#!/usr/bin/env node
/**
 * Run the test262 conformance corpus, emit the report, append the trend line.
 * Fails (exit 1) on any corpus regression or missing-path drift so CI can gate.
 *
 * Run: node --experimental-strip-types packages/test262/bin/run.ts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { corpus } from "../src/corpus/index.ts";
import { writeReport } from "../src/report.ts";
import { runCorpus } from "../src/run-corpus.ts";
import type { Report } from "../src/schema.ts";
import { findMissingPaths } from "../src/verify.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const T262 = join(REPO_ROOT, "submodules", "test262");
const DATA_DIR = join(REPO_ROOT, "apps", "docs", "data", "test262");
const INDEX_FILE = join(DATA_DIR, "language-index.json");

function gitHead(cwd: string): string {
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

interface LanguageIndex {
  commit: string;
  nonFixtureTotal: number;
}

async function main(): Promise<void> {
  const index = JSON.parse(readFileSync(INDEX_FILE, "utf8")) as LanguageIndex;

  const missing = findMissingPaths(corpus, T262);
  if (missing.length > 0) {
    process.stderr.write(
      `corpus drift: ${missing.length} path(s) not found under submodules/test262:\n` +
        missing.map((p) => `  - ${p}`).join("\n") +
        "\n(did you run `git submodule update --init --depth 1 submodules/test262`?)\n",
    );
    process.exit(1);
  }

  const run = await runCorpus(corpus, {
    denominator: index.nonFixtureTotal,
    samples: 5,
  });

  const report: Report = {
    commit: gitHead(REPO_ROOT),
    test262Commit: index.commit,
    node: process.version,
    generatedAt: new Date().toISOString(),
    conformance: run.conformance,
    performance: run.performance,
    byCategory: run.byCategory,
    failures: run.failures,
  };

  writeReport(report, DATA_DIR);

  // Browser-friendly corpus for the docs dashboard (no TS/node imports needed there).
  writeFileSync(
    join(DATA_DIR, "corpus.json"),
    `${JSON.stringify(
      corpus.map((e) => ({
        id: e.id,
        test262Path: e.test262Path,
        esid: e.esid,
        category: e.category,
        description: e.description,
        spec: e.spec,
        input: e.input,
        expectation: e.expectation,
        notes: e.notes,
      })),
      null,
      2,
    )}\n`,
    "utf8",
  );

  const c = report.conformance;
  process.stdout.write(
    `test262 report: ${c.passed}/${c.total} passed (passRate=${c.passRate}), ` +
      `coverage=${c.coverage.covered}/${c.coverage.denominator} (${(c.coverage.ratio * 100).toFixed(4)}%), ` +
      `p50=${report.performance.p50Ms}ms p95=${report.performance.p95Ms}ms\n`,
  );

  if (c.failed > 0) {
    process.stderr.write(`FAIL: ${c.failed} corpus entr(ies) failed\n`);
    for (const f of report.failures) process.stderr.write(`  - ${f.id}: ${f.reason}\n`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
