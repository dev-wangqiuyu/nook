<script setup lang="ts">
// 应用根布局壳：左侧栏 + 右侧（顶栏搜索 + 内容区 RouterView）。
// 各业务模块页面在 views/<module>/ 下，feat-002 仅落地壳与占位页。
import AppSidebar from "@/components/layout/AppSidebar.vue";
import AppTopbar from "@/components/layout/AppTopbar.vue";
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-main">
      <AppTopbar />
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100%;
  background: var(--paper);
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防 RouterView 内容撑爆 flex */
}
.app-content {
  flex: 1;
  overflow-y: auto;
}
</style>
