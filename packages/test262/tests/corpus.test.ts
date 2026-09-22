import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vite-plus/test";

import { corpus } from "../src/corpus/index.ts";
import { deepEqual } from "../src/deep-equal.ts";
import { runCorpus } from "../src/run-corpus.ts";
import { findMissingPaths } from "../src/verify.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const T262 = join(REPO_ROOT, "submodules", "test262");

test("corpus has a meaningful seed size (40-80 target)", () => {
  expect(corpus.length).toBeGreaterThanOrEqual(40);
});

test("every corpus entry cites a real test/language path", () => {
  expect(findMissingPaths(corpus, T262)).toEqual([]);
});

test("every entry id is unique and paths start with test/language/", () => {
  const ids = new Set(corpus.map((e) => e.id));
  expect(ids.size).toBe(corpus.length);
  for (const e of corpus) expect(e.test262Path.startsWith("test/language/")).toBe(true);
});

test("all seed entries pass (positive deep-equal + negative error-match)", async () => {
  const result = await runCorpus(corpus, { denominator: 23726, samples: 2 });
  expect(result.failures).toEqual([]);
  expect(result.conformance.passed).toBe(corpus.length);
  expect(result.conformance.passRate).toBe(1);
  expect(result.performance.p50Ms).toBeGreaterThanOrEqual(0);
  expect(result.conformance.coverage.denominator).toBe(23726);
});

test("negative modeling: a corrupted positive case is reported as a failure", async () => {
  const broken = corpus.map((e) =>
    e.id === "expressions-addition-S11.6.1_A1"
      ? { ...e, expectation: { kind: "value" as const, expected: 999 } }
      : e,
  );
  const result = await runCorpus(broken, { denominator: 23726, samples: 1 });
  expect(result.conformance.failed).toBe(1);
  expect(result.failures[0]?.id).toBe("expressions-addition-S11.6.1_A1");
});

test("deepEqual handles nested structures", () => {
  expect(deepEqual({ a: [1, 2], b: { c: 3 } }, { a: [1, 2], b: { c: 3 } })).toBe(true);
  expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
});
