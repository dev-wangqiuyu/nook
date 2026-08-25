<script setup lang="ts">
// 应用根布局壳：左侧栏 + 右侧（顶栏搜索 + 内容区 RouterView）。
// 启动即初始化数据库（连接 + PRAGMA + 建表），失败给用户可见提示。
import { onMounted } from "vue";
import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import AppTopbar from "@/components/layout/AppTopbar.vue";
import { initDb } from "@/api/db";

onMounted(() => {
  // 预热连接 + 建表；业务层另经 getDb() 兜底（lazy 初始化）。
  initDb().catch((err: unknown) => {
    ElMessage.error("数据库初始化失败：" + String(err));
  });
});
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
