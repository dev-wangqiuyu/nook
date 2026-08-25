<script setup lang="ts">
// 根组件：只挂路由出口。侧边栏布局在 feat-002 落地。
</script>

<template>
  <RouterView />
</template>

<style>
/* 全应用白色极简（硬约束 #10：禁深色主题） */
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #0f0f0f;
  background-color: #ffffff;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}
</style>
