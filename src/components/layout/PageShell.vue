<script setup lang="ts">
// 页面外壳：统一标题区 + 内容区。各模块页复用，内容走默认插槽。
// 无内容（插槽空）时展示占位提示，便于 feature 未落地时占位。
defineProps<{
  title: string;
  subtitle?: string;
  placeholder?: string;
}>();
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
    </header>
    <slot>
      <p v-if="placeholder" class="placeholder">{{ placeholder }}</p>
    </slot>
  </div>
</template>

<style scoped>
.page {
  padding: var(--space-xl);
  max-width: 880px;
}
.page-title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: 0.01em;
  color: var(--ink);
}
.page-sub {
  margin: 0 0 var(--space-xl);
  color: var(--ink-soft);
  font-size: 14px;
}
.placeholder {
  color: var(--ink-mute);
  font-size: 13px;
  padding: var(--space-lg);
  border: 1px dashed var(--hairline-strong);
  border-radius: var(--radius);
}
</style>
