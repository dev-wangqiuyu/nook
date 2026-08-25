<script setup lang="ts">
// 标签管理页（一等模块）。PRD TG-01~TG-05：CRUD + 关联数量 + 级联清理。
// 入口从设置页改为侧边栏一级导航（用户决策，偏离 PRD S-06 默认）。
import PageShell from "@/components/layout/PageShell.vue";
import TagManager from "@/components/tag/TagManager.vue";
</script>

<template>
  <PageShell title="标签" subtitle="为待办与笔记分类，名称唯一">
    <TagManager />
  </PageShell>
</template>
