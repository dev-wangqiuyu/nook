# 规则：界面与样式

> 写界面/样式时读。Nook 全应用白色极简，内容为主角。PRD「视觉风格」硬约束 #10。

## 主题

- **白色极简，唯一主题**。不做深色主题（PRD 明确非目标）。
- 主色调白 / 浅灰背景，文字深色，内容本身为主角，无多余装饰。
- 宇宙订单模块用**卡片排版 + 文案**营造仪式感，不用深色背景。

## Element Plus

- 按需引入（`unplugin-vue-components` + `ElementPlusResolver`，feat-001 配），不整包引入减小体积。
- 弹窗/消息用 `ElMessageBox` / `ElMessage`，避免废弃静态 API。
- 表单、表格、对话框等优先用 Element Plus 组件，不造轮子。

## Iconify

- `@iconify/vue`，按需加载图标（`<Icon icon="mdi:..." />`）。
- 弥补 Element Plus 自带图标不足。侧边栏导航图标统一用 Iconify。

## 布局（PRD「界面布局」）

- 左侧固定宽度侧边栏（首页/待办/笔记/订单 + 分隔线 + 设置），纵向排列，图标 + 文字。
- 右侧内容区，当前选中模块的页面。
- 顶部全局搜索框（P1，V1 可占位）。
- 设置入口在侧边栏底部，与功能模块用分隔线隔开。

## Vditor（笔记编辑器，feat-006）

- 三模式：所见即所得 / 即时渲染 / 分屏预览，编辑页一键切换。
- 底层存 Markdown。
- 模式偏好本地保存（app_setting 表 KV 存）。

## 样式约束

- 不写 `px` 硬尺寸能用 rem/CSS 变量/Element Plus 间距规范的就用。
- 颜色用 CSS 变量或 Element Plus 主题变量，不散落硬编码十六进制。
- 组件 `<style scoped>` 局部样式优先，避免全局污染。
