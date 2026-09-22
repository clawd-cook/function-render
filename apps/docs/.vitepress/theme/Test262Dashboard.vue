<script setup lang="ts">
import { standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";
import { computed, ref } from "vue";

import corpusData from "../../data/test262/corpus.json";
import historyRaw from "../../data/test262/history.jsonl?raw";
import latest from "../../data/test262/latest.json";

interface HistoryPoint {
  ts: string;
  commit: string;
  passRate: number;
  coverage: number;
  p50Ms: number;
  p95Ms: number;
  total: number;
}

interface CorpusItem {
  id: string;
  test262Path: string;
  esid?: string;
  category: string;
  description: string;
  spec: unknown;
  input: unknown;
  expectation:
    | { kind: "value"; expected: unknown }
    | { kind: "throws"; phase: string; messageIncludes?: string };
  notes?: string;
}

const history: HistoryPoint[] = historyRaw
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l) as HistoryPoint);

const corpus = corpusData as CorpusItem[];

const T262_TREE = "https://github.com/tc39/test262/blob/" + latest.test262Commit + "/";

const pct = (n: number, digits = 2): string => `${(n * 100).toFixed(digits)}%`;

/** Build an inline-SVG polyline for a numeric series (no chart dependency). */
function sparkline(values: number[], width = 320, height = 64, pad = 6): string {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const x = width / 2;
    const y = height / 2;
    return `${x},${y}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((v - min) / span) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const p50Series = computed(() => sparkline(history.map((h) => h.p50Ms)));
const p95Series = computed(() => sparkline(history.map((h) => h.p95Ms)));
const passSeries = computed(() =>
  sparkline(
    history.map((h) => h.passRate),
    320,
    64,
  ),
);

// --- live runner -----------------------------------------------------------
const selectedId = ref(corpus[0]?.id ?? "");
const selected = computed(() => corpus.find((c) => c.id === selectedId.value));
const output = ref<null | { pass: boolean; detail: string }>(null);
const running = ref(false);

async function runSelected(): Promise<void> {
  const entry = selected.value;
  if (!entry) return;
  running.value = true;
  output.value = null;
  try {
    const { result } = await run(entry.spec, { funcs: standardCatalog, input: entry.input });
    if (entry.expectation.kind === "throws") {
      output.value = {
        pass: false,
        detail: `expected a thrown ${entry.expectation.phase} error, but got ${JSON.stringify(result)}`,
      };
    } else {
      const pass = JSON.stringify(result) === JSON.stringify(entry.expectation.expected);
      output.value = {
        pass,
        detail: `result = ${JSON.stringify(result)} (expected ${JSON.stringify(entry.expectation.expected)})`,
      };
    }
  } catch (error) {
    const phase = error instanceof FunctionRenderError ? error.phase : "?";
    const message = error instanceof Error ? error.message : String(error);
    if (entry.expectation.kind === "throws") {
      const pass = phase === entry.expectation.phase;
      output.value = { pass, detail: `threw in phase "${phase}": ${message}` };
    } else {
      output.value = { pass: false, detail: `unexpected throw (${phase}): ${message}` };
    }
  } finally {
    running.value = false;
  }
}

const hasData = computed(() => latest.conformance.total > 0);
</script>

<template>
  <div class="t262">
    <p v-if="!hasData" class="empty">
      尚无报告数据，运行 <code>pnpm --filter @logic-renderer/test262 report</code> 生成。
    </p>

    <template v-else>
      <div class="cards">
        <div class="card">
          <div class="k">语料库通过率</div>
          <div class="v ok">{{ pct(latest.conformance.passRate) }}</div>
          <div class="s">{{ latest.conformance.passed }}/{{ latest.conformance.total }} 通过</div>
        </div>
        <div class="card">
          <div class="k">覆盖率(test/language)</div>
          <div class="v">{{ pct(latest.conformance.coverage.ratio, 4) }}</div>
          <div class="s">
            {{ latest.conformance.coverage.covered }}/{{ latest.conformance.coverage.denominator }}
            用例
          </div>
        </div>
        <div class="card">
          <div class="k">渲染耗时 p50 / p95</div>
          <div class="v">{{ latest.performance.p50Ms }} / {{ latest.performance.p95Ms }} ms</div>
          <div class="s">{{ latest.performance.casesPerSec }} cases/s</div>
        </div>
        <div class="card">
          <div class="k">test262 pin</div>
          <div class="v mono">{{ latest.test262Commit.slice(0, 10) }}</div>
          <div class="s">
            {{ new Date(latest.generatedAt).toLocaleString() }} · node {{ latest.node }}
          </div>
        </div>
      </div>

      <h2>趋势</h2>
      <div class="trends">
        <figure>
          <figcaption>通过率</figcaption>
          <svg viewBox="0 0 320 64" preserveAspectRatio="none">
            <polyline
              :points="passSeries"
              fill="none"
              stroke="var(--vp-c-green-1)"
              stroke-width="2"
            />
          </svg>
        </figure>
        <figure>
          <figcaption>p50 渲染耗时 (ms)</figcaption>
          <svg viewBox="0 0 320 64" preserveAspectRatio="none">
            <polyline
              :points="p50Series"
              fill="none"
              stroke="var(--vp-c-brand-1)"
              stroke-width="2"
            />
          </svg>
        </figure>
        <figure>
          <figcaption>p95 渲染耗时 (ms)</figcaption>
          <svg viewBox="0 0 320 64" preserveAspectRatio="none">
            <polyline
              :points="p95Series"
              fill="none"
              stroke="var(--vp-c-yellow-1)"
              stroke-width="2"
            />
          </svg>
        </figure>
      </div>
      <p class="s">共 {{ history.length }} 个采样点(每日 CI 追加)。</p>

      <h2>分类统计</h2>
      <table>
        <thead>
          <tr>
            <th>类别</th>
            <th>通过 / 总数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stat, cat) in latest.byCategory" :key="cat">
            <td>{{ cat }}</td>
            <td>{{ stat.passed }} / {{ stat.total }}</td>
          </tr>
        </tbody>
      </table>

      <h2>失败用例</h2>
      <p v-if="latest.failures.length === 0" class="ok">✓ 无失败用例。</p>
      <table v-else>
        <thead>
          <tr>
            <th>id</th>
            <th>path</th>
            <th>原因</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in latest.failures" :key="f.id">
            <td class="mono">{{ f.id }}</td>
            <td>
              <a :href="T262_TREE + f.test262Path" target="_blank" rel="noreferrer">{{
                f.test262Path
              }}</a>
            </td>
            <td>{{ f.reason }}</td>
          </tr>
        </tbody>
      </table>

      <h2>在线运行(配置 + render)</h2>
      <div class="runner">
        <select v-model="selectedId" class="pick">
          <option v-for="c in corpus" :key="c.id" :value="c.id">
            {{ c.category }} · {{ c.description }}
          </option>
        </select>
        <button type="button" class="run" :disabled="running" @click="runSelected">
          {{ running ? "运行中…" : "运行" }}
        </button>
      </div>
      <div v-if="selected" class="detail">
        <a :href="T262_TREE + selected.test262Path" target="_blank" rel="noreferrer">{{
          selected.test262Path
        }}</a>
        <span v-if="selected.esid" class="mono"> · {{ selected.esid }}</span>
        <pre class="code">{{ JSON.stringify(selected.spec, null, 2) }}</pre>
      </div>
      <div v-if="output" class="result" :class="output.pass ? 'ok-box' : 'err-box'">
        <strong>{{ output.pass ? "PASS" : "FAIL" }}</strong> — {{ output.detail }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}
.card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  background: var(--vp-c-bg-soft);
}
.card .k {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}
.card .v {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.15rem 0;
}
.card .v.ok {
  color: var(--vp-c-green-1);
}
.card .s {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}
.mono {
  font-family: var(--vp-font-family-mono);
}
.trends {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.trends figure {
  margin: 0;
}
.trends figcaption {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
}
.trends svg {
  width: 100%;
  height: 64px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.runner {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
}
.pick {
  flex: 1;
  padding: 0.4rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.run {
  padding: 0.4rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.run:disabled {
  opacity: 0.6;
  cursor: progress;
}
.detail {
  font-size: 0.85rem;
}
.code {
  margin-top: 0.4rem;
  padding: 0.6rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.78rem;
  overflow-x: auto;
}
.result {
  margin-top: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}
.ok-box {
  border-color: var(--vp-c-green-1);
}
.err-box {
  border-color: var(--vp-c-red-1);
}
.ok {
  color: var(--vp-c-green-1);
}
.empty {
  color: var(--vp-c-text-2);
}
</style>
