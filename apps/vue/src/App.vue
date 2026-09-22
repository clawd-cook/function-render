<script setup lang="ts">
import { examples, standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";
import { computed, ref } from "vue";

type ExampleName = keyof typeof examples;

interface Success {
  ok: true;
  result: unknown;
  state: Record<string, unknown>;
}
interface Failure {
  ok: false;
  error: { message: string; kind?: string; path?: string; fnName?: string };
}
type Output = Success | Failure;

const exampleNames = Object.keys(examples) as ExampleName[];
const catalogNames = Object.keys(standardCatalog).sort();

const name = ref<ExampleName>(exampleNames[0]!);
const specText = ref(JSON.stringify(examples[name.value].spec, null, 2));
const stateText = ref(JSON.stringify(examples[name.value].initialState ?? {}, null, 2));
const output = ref<Output | null>(null);
const running = ref(false);

const description = computed(() => examples[name.value].description);

function loadExample(): void {
  const next = name.value;
  specText.value = JSON.stringify(examples[next].spec, null, 2);
  stateText.value = JSON.stringify(examples[next].initialState ?? {}, null, 2);
  output.value = null;
}

async function handleRun(): Promise<void> {
  running.value = true;
  output.value = null;
  try {
    const spec: unknown = JSON.parse(specText.value);
    const initialState: Record<string, unknown> = stateText.value.trim()
      ? JSON.parse(stateText.value)
      : {};
    const { result, state } = await run(spec, { catalog: standardCatalog, initialState });
    output.value = { ok: true, result, state };
  } catch (error) {
    if (error instanceof FunctionRenderError) {
      output.value = {
        ok: false,
        error: { message: error.message, kind: error.kind, path: error.path, fnName: error.fnName },
      };
    } else {
      output.value = {
        ok: false,
        error: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <main class="app">
    <header>
      <h1>Function Renderer</h1>
      <p class="subtitle">Vue demo — runs a JSON spec via @logic-renderer/runner</p>
    </header>

    <section class="controls">
      <label>
        Example
        <select v-model="name" @change="loadExample">
          <option v-for="n in exampleNames" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <p class="desc">{{ description }}</p>
    </section>

    <section class="grid">
      <label class="field">
        Spec (JSON)
        <textarea v-model="specText" spellcheck="false"></textarea>
      </label>
      <label class="field">
        Initial state (JSON)
        <textarea v-model="stateText" spellcheck="false"></textarea>
      </label>
    </section>

    <button type="button" class="run" :disabled="running" @click="handleRun">
      {{ running ? "Running…" : "Run" }}
    </button>

    <section v-if="output" class="output" :class="output.ok ? 'ok' : 'err'">
      <template v-if="output.ok">
        <h2>Result</h2>
        <pre>{{ JSON.stringify(output.result, null, 2) }}</pre>
        <h2>Final state</h2>
        <pre>{{ JSON.stringify(output.state, null, 2) }}</pre>
      </template>
      <template v-else>
        <h2>Error</h2>
        <pre>{{ JSON.stringify(output.error, null, 2) }}</pre>
      </template>
    </section>

    <footer><span>Catalog:</span> {{ catalogNames.join(", ") }}</footer>
  </main>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
  text-align: left;
}

header h1 {
  margin: 0;
  font-size: 1.9rem;
  background: linear-gradient(90deg, #42b883, #646cff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  margin: 0.25rem 0 1.5rem;
  color: #8b8b9a;
}

.controls label {
  display: inline-flex;
  flex-direction: column;
  font-weight: 600;
  gap: 0.35rem;
}

.controls select {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #3a3a45;
  background: #1b1b20;
  color: inherit;
  font-size: 1rem;
}

.desc {
  color: #8b8b9a;
  margin: 0.5rem 0 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 600;
}

.field textarea {
  min-height: 220px;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #3a3a45;
  background: #141418;
  color: #e6e6ef;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.85rem;
  line-height: 1.45;
  resize: vertical;
}

.run {
  margin: 1.25rem 0;
  padding: 0.7rem 1.6rem;
  border: none;
  border-radius: 10px;
  background: #42b883;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.run:disabled {
  opacity: 0.6;
  cursor: progress;
}

.output {
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid #2c2c35;
  background: #101014;
}

.output.ok {
  border-color: #22c55e55;
}

.output.err {
  border-color: #ef444455;
}

.output h2 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b8b9a;
  margin: 0.75rem 0 0.35rem;
}

.output pre {
  margin: 0;
  padding: 0.75rem;
  border-radius: 8px;
  background: #05050a;
  color: #a5f3c0;
  overflow-x: auto;
  font-size: 0.85rem;
}

.output.err pre {
  color: #fca5a5;
}

footer {
  margin-top: 2rem;
  color: #6b6b78;
  font-size: 0.8rem;
}

footer span {
  font-weight: 700;
  color: #8b8b9a;
}
</style>
