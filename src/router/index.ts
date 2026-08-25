import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

// 占位路由。真正的侧边栏布局与各模块路由在 feat-002 落地。
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", name: "home", component: HomeView }],
});

export default router;
