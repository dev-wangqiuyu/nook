/// <reference types="vite/client" />

// vite.config.ts define 注入的 dev 库绝对路径（prod 不读，db.ts 走 app_config_dir）。
declare const __DEV_DB_PATH__: string;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
