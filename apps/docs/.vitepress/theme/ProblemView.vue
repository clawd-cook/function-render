<script setup lang="ts">
import { getProblem, SOURCE } from "@function-renderer/leetcode";
import { computed } from "vue";

const props = defineProps<{ slug: string }>();

const problem = computed(() => getProblem(props.slug));
const specJson = computed(() => (problem.value ? JSON.stringify(problem.value.spec, null, 2) : ""));
</script>

<template>
  <div v-if="problem" class="problem">
    <p class="meta">
      <a :href="problem.url" target="_blank" rel="noreferrer">LeetCode 原题 ↗</a>
      <span> · 难度:{{ problem.difficulty }}</span>
      <span> · 分类:{{ problem.category }}</span>
    </p>

    <h2>题目描述</h2>
    <p>{{ problem.description }}</p>

    <h2>在线运行(function-render)</h2>
    <p>
      下面用 <code>@function-renderer/runner</code> 在浏览器里执行本题的
      spec。可修改输入后点“运行”。
    </p>
    <OnlineRunner :slug="slug" />

    <h2>function-render spec</h2>
    <pre class="block">{{ specJson }}</pre>

    <h2>原始 Python 解法</h2>
    <pre class="block">{{ problem.python }}</pre>

    <p class="src">
      解法来源:<a :href="SOURCE.url" target="_blank" rel="noreferrer">{{ SOURCE.name }}</a>
    </p>
  </div>
  <div v-else>
    <p>未找到该题目。</p>
  </div>
</template>

<style scoped>
.meta {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}
.block {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre;
}
.src {
  margin-top: 1.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}
</style>
