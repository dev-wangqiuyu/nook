import { createPinia } from "pinia";

// Pinia 实例，供 main.ts 全局注册。
// 具体业务 store（useTasksStore/useNotesStore 等）在各业务模块 feature 中创建。
export const pinia = createPinia();
