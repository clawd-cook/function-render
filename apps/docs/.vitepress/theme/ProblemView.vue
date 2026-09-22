<script setup lang="ts">
import { computed } from "vue";

import { getProblem, SOURCE } from "../../data/problems.ts";

const props = defineProps<{ slug: string }>();

const problem = computed(() => getProblem(props.slug));
</script>

<template>
  <div v-if="problem" class="problem">
    <p class="meta">
      <a :href="problem.url" target="_blank" rel="noreferrer">LeetCode 原题 ↗</a>
      <span> · 难度:{{ problem.difficulty }}</span>
      <span> · 分类:{{ problem.category }}</span>
      <span v-if="problem.pureProtocol" class="badge pure">纯原子协议</span>
      <span v-else class="badge complex">含已登记复杂算子</span>
    </p>

    <h2>题目描述</h2>
    <p>{{ problem.description }}</p>

    <h2>协议(可编辑,点击运行)</h2>
    <p>
      下面直接展示解题<strong>协议</strong>本身,并用
      <code>@function-renderer/runner</code> 在浏览器执行。可改协议或输入后点“运行”。
    </p>
    <OnlineRunner :slug="slug" />

    <p class="src">
      题目来源:<a :href="SOURCE.url" target="_blank" rel="noreferrer">{{ SOURCE.name }}</a>
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
.badge {
  margin-left: 0.5rem;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.badge.pure {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-1);
}
.badge.complex {
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-1);
}
.src {
  margin-top: 1.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
}
</style>
