# 规则：项目结构

> 建新页面/模块时读。Nook = Tauri 项目，前端与 Rust 后端分居 `src/` 与 `src-tauri/`。

## 顶层布局

```
nook/
├── src/                  # 前端（Vue 3 + TS，vite 构建）
│   ├── components/        # 通用组件
│   ├── views/             # 页面级组件（对应路由）
│   │   ├── todo/          # 每日计划/待办模块
│   │   ├── note/          # 随笔笔记模块
│   │   ├── order/         # 宇宙订单模块
│   │   ├── settings/      # 设置页
│   │   └── home/          # 仪表盘首页（P1）
│   ├── stores/            # Pinia 状态（按模块拆分）
│   ├── router/            # Vue Router 路由表
│   ├── api/               # Tauri IPC 封装（plugin-sql 调用、命令调用）
│   ├── composables/       # VueUse + 自定义组合式函数
│   ├── types/             # TS 类型定义
│   ├── assets/            # 静态资源
│   ├── App.vue
│   └── main.ts
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   ├── lib.rs         # 应用入口（setup、命令注册）
│   │   └── commands/      # #[tauri::command] 命令实现
│   ├── Cargo.toml
│   ├── tauri.conf.json    # Tauri 配置（窗口、bundle、capabilities）
│   └── capabilities/      # 权限声明（plugin-sql/dialog/fs 等）
├── PRD产品需求文档.md
├── AGENTS.md / CLAUDE.md / progress.md / session-handoff.md
├── feature_list.json / init.sh
├── rules/ / logs/
└── package.json / vite.config.ts / tsconfig.json
```

## 边界规则

- **前端业务逻辑**（CRUD、状态、UI）放 `src/`，用 Vue + TS。
- **Rust 后端**只放必须原生能力（文件操作、托盘、系统调用、plugin-sql 初始化）。简单 CRUD 用 `@tauri-apps/plugin-sql` 在前端直接跑 SQL，**不**为每个 CRUD 写 Rust 命令——除非性能或权限要求必须下沉。
- **IPC 封装**：所有 Tauri 命令调用、plugin-sql 执行，统一在 `src/api/` 封装，组件不直接 `invoke` 或裸跑 SQL。
- **页面文件夹化**：每个模块在 `views/<module>/` 下组织，模块内的子组件、composables 就近放，不堆 `components/` 大杂烩。

## 命名

- 组件文件：`PascalCase.vue`（如 `TaskCard.vue`）
- 组合式函数：`useXxx.ts`（如 `useTasks.ts`）
- Pinia store：`useXxxStore`，文件 `xxx.ts`
- 类型：PascalCase interface/type，`types/<module>.ts` 集中

## 别名

- 强制用 `@` 别名 import（见硬约束 #11）。`vite.config.ts` + `tsconfig.json` 都要配 `@` → `src/`。feat-001 落地此项。
