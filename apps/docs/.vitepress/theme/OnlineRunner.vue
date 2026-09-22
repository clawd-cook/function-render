<script setup lang="ts">
import { standardCatalog } from "@logic-renderer/catalog";
import { FunctionRenderError, run } from "@logic-renderer/runner";
import { computed, ref, watch } from "vue";

import { getProblem } from "../../data/problems.ts";

const props = defineProps<{ slug: string }>();

interface Success {
  ok: true;
  result: unknown;
  state: Record<string, unknown>;
  preview: boolean;
}
interface Failure {
  ok: false;
  error: { message: string; phase?: string; path?: string; funcKey?: string };
  preview: boolean;
}

const problem = computed(() => getProblem(props.slug));
const specText = ref(JSON.stringify(problem.value?.spec ?? {}, null, 2));
const inputText = ref(JSON.stringify(problem.value?.input ?? {}, null, 2));
const preview = ref(false);
const output = ref<Success | Failure | null>(null);
const running = ref(false);

watch(
  () => props.slug,
  () => {
    specText.value = JSON.stringify(problem.value?.spec ?? {}, null, 2);
    inputText.value = JSON.stringify(problem.value?.input ?? {}, null, 2);
    preview.value = false;
    output.value = null;
  },
);

function reset(): void {
  specText.value = JSON.stringify(problem.value?.spec ?? {}, null, 2);
  inputText.value = JSON.stringify(problem.value?.input ?? {}, null, 2);
  preview.value = false;
  output.value = null;
}

async function handleRun(): Promise<void> {
  running.value = true;
  output.value = null;
  try {
    const spec: unknown = JSON.parse(specText.value);
    const input: unknown = inputText.value.trim()
      ? (JSON.parse(inputText.value) as unknown)
      : undefined;
    const { result, state } = await run(spec, {
      funcs: standardCatalog,
      input,
      preview: preview.value,
    });
    output.value = { ok: true, result, state, preview: preview.value };
  } catch (error) {
    if (error instanceof FunctionRenderError) {
      output.value = {
        ok: false,
        preview: preview.value,
        error: {
          message: error.message,
          phase: error.phase,
          path: error.path,
          funcKey: error.funcKey,
        },
      };
    } else {
      output.value = {
        ok: false,
        preview: preview.value,
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
    <label class="preview">
      <input v-model="preview" type="checkbox" />
      preview（永不调用 Func.run / 跳过 sleep）
    </label>
    <div class="actions">
      <button type="button" class="run" :disabled="running" @click="handleRun">
        {{ running ? "运行中…" : preview ? "预览" : "运行" }}
      </button>
      <button type="button" class="reset" @click="reset">重置</button>
    </div>
    <div v-if="output" class="result" :class="output.ok ? 'ok' : 'err'">
      <template v-if="output.ok">
        <div class="tag">{{ output.preview ? "预览结果" : "结果" }}</div>
        <pre>{{ JSON.stringify(output.result, null, 2) }}</pre>
        <div class="tag">最终 Slot</div>
        <pre>{{ JSON.stringify(output.state, null, 2) }}</pre>
      </template>
      <template v-else>
        <div class="tag">错误{{ output.preview ? "（preview）" : "" }}</div>
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
.preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.65rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
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
