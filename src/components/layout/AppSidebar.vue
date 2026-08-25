<script setup lang="ts">
import { Icon } from "@iconify/vue";

// 侧边栏导航。路由激活态由 Vue Router 的 router-link-active 类驱动。
interface NavItem {
  to: string;
  label: string;
  icon: string;
}
const mainNav: NavItem[] = [
  { to: "/", label: "首页", icon: "lucide:layout-dashboard" },
  { to: "/todo", label: "待办", icon: "lucide:list-checks" },
  { to: "/note", label: "笔记", icon: "lucide:notebook" },
  { to: "/tags", label: "标签", icon: "lucide:tag" },
  { to: "/order", label: "订单", icon: "lucide:sparkles" },
];
const settingsNav: NavItem = { to: "/settings", label: "设置", icon: "lucide:settings" };
</script>

<template>
  <aside class="sidebar grain">
    <div class="brand">
      <span class="brand-name">Nook</span>
      <span class="brand-dot" />
    </div>

    <nav class="nav">
      <RouterLink
        v-for="(item, i) in mainNav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :style="{ '--i': i }"
      >
        <Icon :icon="item.icon" class="nav-icon" :width="18" :height="18" />
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="bottom">
      <div class="hairline" />
      <RouterLink :to="settingsNav.to" class="nav-item settings" :style="{ '--i': mainNav.length }">
        <Icon :icon="settingsNav.icon" class="nav-icon" :width="18" :height="18" />
        <span class="nav-label">{{ settingsNav.label }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--side-w);
  height: 100%;
  background: var(--paper-soft);
  border-right: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

/* 品牌字标：衬线 + 仪式金圆点 */
.brand {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: var(--space-lg) var(--space-lg) var(--space-xl);
}
.brand-name {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-sm);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 14px;
  position: relative;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
  /* 入场：自上淡入下移，按 --i 错峰 */
  animation: nav-in var(--dur-slow) var(--ease) both;
  animation-delay: calc(0.04s * var(--i) + 0.05s);
}
.nav-item:hover {
  background: var(--paper-tint);
  color: var(--ink);
}
.nav-icon {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity var(--dur-fast) var(--ease);
}
.nav-item:hover .nav-icon,
.nav-item.router-link-active .nav-icon {
  opacity: 1;
}

/* 激活态：仪式金左竖条 + 墨色文字 + 淡金底 */
.nav-item.router-link-active {
  color: var(--ink);
  background: var(--paper-raise);
  box-shadow: 0 1px 2px rgba(28, 27, 25, 0.04);
}
.nav-item.router-link-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 3px;
  background: var(--accent);
}

.bottom {
  padding: 0 var(--space-sm) var(--space-md);
}
.hairline {
  height: 1px;
  background: var(--hairline);
  margin: 0 8px var(--space-sm);
}
.nav-item.settings {
  --i: 5;
}

@keyframes nav-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减弱动效偏好：尊重无障碍 */
@media (prefers-reduced-motion: reduce) {
  .nav-item {
    animation: none;
  }
}
</style>
