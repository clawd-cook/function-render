<script setup lang="ts">
import { standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";
import { computed, ref } from "vue";

import { getProblem } from "../../data/problems.ts";

const props = defineProps<{ slug: string }>();

interface Success {
  ok: true;
  result: unknown;
  state: Record<string, unknown>;
}
interface Failure {
  ok: false;
  error: { message: string; kind?: string; path?: string; fnName?: string };
}

const problem = computed(() => getProblem(props.slug));
const specText = ref(JSON.stringify(problem.value?.spec ?? {}, null, 2));
const inputText = ref(JSON.stringify(problem.value?.input ?? {}, null, 2));
const output = ref<Success | Failure | null>(null);
const running = ref(false);

function reset(): void {
  specText.value = JSON.stringify(problem.value?.spec ?? {}, null, 2);
  inputText.value = JSON.stringify(problem.value?.input ?? {}, null, 2);
  output.value = null;
}

async function handleRun(): Promise<void> {
  running.value = true;
  output.value = null;
  try {
    const spec: unknown = JSON.parse(specText.value);
    const initialState: Record<string, unknown> = inputText.value.trim()
      ? (JSON.parse(inputText.value) as Record<string, unknown>)
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
  <div v-if="problem" class="runner">
    <label class="lbl">协议(spec,可编辑)</label>
    <textarea v-model="specText" spellcheck="false" rows="16" class="code"></textarea>
    <label class="lbl">输入(JSON,可编辑)</label>
    <textarea v-model="inputText" spellcheck="false" rows="4" class="code"></textarea>
    <div class="actions">
      <button type="button" class="run" :disabled="running" @click="handleRun">
        {{ running ? "运行中…" : "运行" }}
      </button>
      <button type="button" class="reset" @click="reset">重置</button>
    </div>
    <div v-if="output" class="result" :class="output.ok ? 'ok' : 'err'">
      <template v-if="output.ok">
        <div class="tag">结果</div>
        <pre>{{ JSON.stringify(output.result, null, 2) }}</pre>
        <div class="tag">最终状态</div>
        <pre>{{ JSON.stringify(output.state, null, 2) }}</pre>
      </template>
      <template v-else>
        <div class="tag">错误</div>
        <pre>{{ JSON.stringify(output.error, null, 2) }}</pre>
      </template>
    </div>
  </div>
</template>

<style scoped>
.runner {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1rem;
  margin: 0.5rem 0 1rem;
  background: var(--vp-c-bg-soft);
}
.lbl {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.runner textarea.code {
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  resize: vertical;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.6rem 0;
}
.run {
  padding: 0.45rem 1.2rem;
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
.reset {
  padding: 0.45rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.result {
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
}
.result.ok {
  border-color: var(--vp-c-green-1);
}
.result.err {
  border-color: var(--vp-c-red-1);
}
.tag {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  margin: 0.4rem 0 0.2rem;
}
.result pre {
  margin: 0;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  background: var(--vp-c-bg);
  overflow-x: auto;
  font-size: 0.8rem;
}
</style>
