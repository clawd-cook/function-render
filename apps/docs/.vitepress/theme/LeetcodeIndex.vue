<script setup lang="ts">
import { withBase } from "vitepress";

import { categories } from "../../data/problems.ts";
</script>

<template>
  <div class="lc-index">
    <div v-for="category in categories" :key="category.name" class="group">
      <h3>{{ category.name }}</h3>
      <table>
        <thead>
          <tr>
            <th>题号</th>
            <th>题目</th>
            <th>难度</th>
            <th>协议</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="problem in category.problems" :key="problem.slug">
            <td>{{ problem.num }}</td>
            <td>
              <a :href="withBase(`/leetcode/${problem.slug}`)">{{ problem.title }}</a>
            </td>
            <td>{{ problem.difficulty }}</td>
            <td>
              <span v-if="problem.pureProtocol" class="badge pure">纯协议</span>
              <span v-else class="badge complex">callFunc</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.group {
  margin-bottom: 1.5rem;
}
table {
  width: 100%;
}
.badge {
  display: inline-block;
  padding: 0.05rem 0.45rem;
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
</style>
