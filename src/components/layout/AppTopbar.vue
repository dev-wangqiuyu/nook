<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";

// 顶部全局搜索（PRD P1）。feat-002 仅占位放样式 + 接 ElInput；
// 真正跨模块实时过滤在 feat-012 落地。
const keyword = ref("");
</script>

<template>
  <header class="topbar">
    <div class="search">
      <Icon icon="lucide:search" class="search-icon" :width="16" :height="16" />
      <input
        v-model="keyword"
        class="search-input"
        type="text"
        placeholder="搜索任务、笔记、订单…"
        spellcheck="false"
      />
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  padding: 0 var(--space-xl);
  background: var(--paper);
  border-bottom: 1px solid var(--hairline);
  flex-shrink: 0;
}

/* 搜索框：发丝下划线款，非 Element Plus 默认方框，贴近编辑风 */
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 560px;
  padding: 6px 4px 8px;
  border-bottom: 1px solid var(--hairline);
  transition: border-color var(--dur-fast) var(--ease);
}
.search:focus-within {
  border-bottom-color: var(--accent);
}
.search-icon {
  color: var(--ink-mute);
  flex-shrink: 0;
  transition: color var(--dur-fast) var(--ease);
}
.search:focus-within .search-icon {
  color: var(--accent-ink);
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
}
.search-input::placeholder {
  color: var(--ink-mute);
}
</style>
