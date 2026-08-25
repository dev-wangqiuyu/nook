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

## 企业级分层与依赖方向

- **分层（依赖单向，下层不引用上层）**：
  ```
  views/（页面/容器组件）
     ↓ 调
  composables/（业务逻辑 useXxx）
     ↓ 调
  api/（Tauri IPC + plugin-sql 封装，唯一出口）
     ↓ 调
  Tauri 插件（plugin-sql/dialog/fs）/ Rust 命令
  ```
  - `api/` 不 import `views/` 或 `composables/`；`composables/` 不 import `views/`。反向引用 = 架构错误（硬约束 #17）。
- **数据流**：view 调 composable，composable 调 `api/`，`api/` 是 plugin-sql / `invoke` 的唯一出口。**组件不裸跑 SQL、不直接 invoke**（硬约束 #3/#4 兜底，此条明示分层归属）。
- **状态归属**：跨模块共享态用 Pinia store（`stores/<module>.ts`，`useXxxStore`）；单组件私有态用 `ref`/`reactive`。store 只放状态与操作，不放 UI/路由逻辑。
- **类型**：业务类型集中 `types/<module>.ts`，跨层共享；`api/` 返回值带类型，上层消费不丢类型、不 `as` 强转。
- **常量提取**：枚举/魔数/固定文案提为常量或 `enum`（状态码、优先级、订单状态、任务状态等），不散落魔法字符串/数字。
- **错误处理**：不静默吞错（禁空 `catch`）。可预期错误（文件不存在、校验失败、唯一约束冲突）上抛或走 UI 提示（`ElMessage`）；不为不可能场景写防御性 fallback（同 AGENTS 通用纪律）。
- **不可变数据**：DB 取回的数据视为不可变，更新走"取→改→写回"，不在原对象原地 mutate 后再存；列表更新返回新数组赋给响应式引用，依赖 Vue 响应式覆盖。

## 命名

- 组件文件：`PascalCase.vue`（如 `TaskCard.vue`）
- 组合式函数：`useXxx.ts`（如 `useTasks.ts`）
- Pinia store：`useXxxStore`，文件 `xxx.ts`
- 类型：PascalCase interface/type，`types/<module>.ts` 集中

## 别名

- 强制用 `@` 别名 import（见硬约束 #11）。`vite.config.ts` + `tsconfig.json` 都要配 `@` → `src/`。feat-001 落地此项。
