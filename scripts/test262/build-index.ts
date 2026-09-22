#!/usr/bin/env node
/**
 * Build a reproducible index of test262 `test/language` cases.
 *
 * Output: apps/docs/data/test262/language-index.json — a compact summary
 * (pinned commit, total/non-fixture counts, per-category counts). It is the
 * coverage denominator + provenance anchor for the conformance dashboard.
 *
 * The full ~24k file list is intentionally NOT embedded (repo-size): the
 * harness verifies each cited case path against the on-disk submodule instead.
 *
 * Run: node --experimental-strip-types scripts/test262/build-index.ts
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const T262 = join(REPO_ROOT, "submodules", "test262");
const LANG_ROOT = join(T262, "test", "language");
const OUT_DIR = join(REPO_ROOT, "apps", "docs", "data", "test262");
const OUT_FILE = join(OUT_DIR, "language-index.json");

function pinnedCommit(): string {
  try {
    return execFileSync("git", ["-C", T262, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

/** Recursively collect `.js` paths under `dir`. */
function collectJs(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJs(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      out.push(full);
    }
  }
}

function main(): void {
  const files: string[] = [];
  collectJs(LANG_ROOT, files);
  files.sort();

  const byCategory: Record<string, number> = {};
  let fixtureTotal = 0;
  for (const abs of files) {
    const rel = relative(LANG_ROOT, abs); // e.g. expressions/addition/x.js
    const category = rel.split("/")[0] ?? "(root)";
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    if (abs.endsWith("_FIXTURE.js")) fixtureTotal += 1;
  }

  const total = files.length;
  const index = {
    commit: pinnedCommit(),
    generatedAt: new Date().toISOString(),
    root: "test/language",
    total,
    fixtureTotal,
    nonFixtureTotal: total - fixtureTotal,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    ),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  process.stdout.write(
    `wrote ${relative(REPO_ROOT, OUT_FILE)}: total=${total} nonFixture=${index.nonFixtureTotal} categories=${Object.keys(byCategory).length}\n`,
  );
}

main();
