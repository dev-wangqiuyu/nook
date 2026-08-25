import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { fileURLToPath, URL } from "node:url";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// dev 环境 SQLite 库绝对路径（prod 走 app_config_dir，不在此注入）。
// plugin-sql 的 PathBuf::push 对绝对路径整体替换，故传绝对路径可覆盖默认 app_config_dir。
const DEV_DB_PATH = fileURLToPath(new URL("./db/nook.db", import.meta.url));

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    // Element Plus 按需引入：用到才打包，自动识别 <el-xxx> 与 ElMessage/ElMessageBox 等 API
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],

  // @ 路径别名（硬约束 #11：禁相对路径 import）
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // 注入 dev 库绝对路径常量（仅 dev 读，prod 用 'sqlite:nook.db' 落 app_config_dir）
  define: {
    __DEV_DB_PATH__: JSON.stringify(DEV_DB_PATH),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
