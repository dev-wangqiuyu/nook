# 规则：Vue 3 组件写法（Composition API）

> 写任何 .vue 组件时读。遵循 Vue 3 官方推荐的 Composition API 工程化写法。

## 强制：`<script setup>`

- 所有组件用 `<script setup lang="ts">`，**禁 Options API**（不写 `data()` / `methods` / `computed:` 选项式）。
- 禁用与 `<script setup>` 平行的 `<script>` 非-setup 块（除非确有需要在模块作用域跑一次的初始化逻辑，须注释说明）。

## 响应式

- 基础值用 `ref`，对象/数组也优先 `ref`（统一 `.value` 访问）；仅当需要解构保持响应式时用 `reactive`。
- 派生值用 `computed`，不在模板里写复杂表达式。
- 副作用用 `watch` / `watchEffect`，`watch` 显式写依赖、`watchEffect` 仅用于自动追踪的轻量场景。
- `ref` 的泛型能推断就不手写：`const count = ref(0)` 而非 `ref<number>(0)`。

## 组件契约（props / emits / model）

- props 用类型化 `defineProps<{...}>()`；需要默认值用 `withDefaults(defineProps<...>(), {...})`。
- 事件用 `defineEmits<{...}>()` 泛型签名（事件名 + 载荷类型），不写字符串数组式。
- 双向绑定用 `defineModel<T>()`（Vue 3.4+），不自造 `props.modelValue` + `emit('update:modelValue')` 重复样板。
- `defineExpose` 仅在组件确需被父级调方法时用，默认不暴露内部。

## 组合式函数（composables）

- 可复用逻辑抽 `useXxx.ts`（如 `useTasks.ts`），放 `src/composables/` 或模块就近目录。
- composable 返回响应式 `ref` / `readonly(ref)`，不裸返回内部可变状态。
- 抽 composable 的门槛：**逻辑被 ≥2 处复用，或单组件逻辑过载需拆分**。不做过早抽象（硬约束：三行相似代码优于一个提前抽象）。

## 组件化开发范式（企业级）

- **单一职责**：一个组件只做一件事。页面级组件（`views/`）负责组合与编排，不放重业务逻辑；复杂逻辑下沉 composable 或 Pinia store。
- **展示组件 vs 容器组件**：
  - **展示组件**（dumb）：只渲染 props + emit 事件，**不调** `api/`、不跑 SQL、不持远程态。纯 UI，可复用、可独立预览。
  - **容器组件**（smart，通常即页面级）：持有数据、调 `src/api/`、把数据喂给展示组件、监听其事件。数据获取与 IPC 不进展示组件。
- **props down / events up**：父→子传 props，子→父用 `defineEmits` 通知。子组件**禁直接改 props**（要双向用 `defineModel`，否则 emit 交父改）。跨多级共享走 Pinia store，不用 `provide/inject` 除非确有跨级主题态（如布局/主题）。
- **插槽优先于 prop 传模板**：内容分发用 `<slot>`（含具名/作用域插槽），不把大段模板或渲染函数当 prop 传。
- **复用门槛**：组件抽离需 **≥2 处复用**；一次性展示就地写，不预抽。跨模块复用的外壳（如 `PageShell`）才进 `components/`。
- **公开 API 收敛**：`defineExpose` 仅暴露父级确需调用的方法；内部 ref/方法不外泄，保持封装。
- **组合优于继承**：用 composable 组合逻辑，不写组件继承（Vue 不鼓励 `extends` 组件）。

## 目录与命名（配合 [project-structure.md](project-structure.md)）

- 组件文件 `PascalCase.vue`；页面级组件放 `src/views/<module>/`，通用组件放 `src/components/`（按职能分子目录，如 `components/layout/`）。
- 组件 import 强制用 `@` 别名（硬约束 #11），禁相对路径。
- 通用页面外壳等跨模块复用组件抽出来（如 `PageShell.vue`），不每页复制标题区。

## 模板与样式

- 模板保持声明式；循环 `v-for` 必带 `:key` 且 key 稳定（不用 index 当 key 除非列表纯展示无增删）。
- 样式 `<style scoped>` 局部优先；设计令牌引用 `var(--xxx)`（见 [style.md](style.md) tokens），不散落硬编码色值/尺寸。
- Element Plus 组件按需引入（feat-001 已配自动引入），禁整包 import。

## 类型

- 禁 `any`（硬约束 #2）。未知类型用 `unknown` + 类型收窄，或明确联合/泛型。
- 业务类型集中 `src/types/<module>.ts`，组件 import 类型走 `@`。
