import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

// 路由表。feat-002 落地基础布局，各模块先占位，真实页面在对应 feature 实现。
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/home/HomeView.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/todo",
    name: "todo",
    component: () => import("@/views/todo/TodoView.vue"),
    meta: { title: "待办" },
  },
  {
    path: "/note",
    name: "note",
    component: () => import("@/views/note/NoteView.vue"),
    meta: { title: "笔记" },
  },
  {
    path: "/tags",
    name: "tags",
    component: () => import("@/views/tags/TagsView.vue"),
    meta: { title: "标签" },
  },
  {
    path: "/order",
    name: "order",
    component: () => import("@/views/order/OrderView.vue"),
    meta: { title: "订单" },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/settings/SettingsView.vue"),
    meta: { title: "设置" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
