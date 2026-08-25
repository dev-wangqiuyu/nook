<script setup lang="ts">
import { ref } from "vue";

// feat-001 脚手架验证页：验证 Element Plus 按需引入 + Pinia + Vue Router + @ 别名可用。
// 真正的仪表盘首页（PRD D-01~D-03）是 feat-011，届时替换本页。
const count = ref(0);
</script>

<template>
  <main class="home">
    <h1>Nook 脚手架就绪</h1>
    <p class="hint">
      feat-001 验证：依赖已装、@ 别名可用、Element Plus 按需引入、Pinia 已注册、Vue Router 已接线。
    </p>
    <el-button type="primary" @click="count++">点击 {{ count }}</el-button>
  </main>
</template>

<style scoped>
.home {
  padding: 2rem;
}
.hint {
  color: #666;
}
</style>
