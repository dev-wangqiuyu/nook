## Current State

**Last Updated:** 2026-08-25 **Active Feature:** feat-002（feat-001 已完成）
**What's Done / What's In Progress / What's Next:** feat-001 done；下一个 feat-002 基础布局
**Blockers / Risks:** 无（Rust 1.98 环境就绪，esbuild 构建脚本已放行，PRD 全部依赖已装）
**Evidence of Completion:** `pnpm build` + `cargo check` + `pnpm tauri dev` 烟测全过；见 `logs/2026-08-25.md` feat-001 段
**Notes for Next Session:** 详细当前状态与会话历史见下方「当前已验证状态」与「会话记录」段

---

# Progress — Nook

> 项目当前进展的唯一真相。新会话开工先读本文件，再读 `AGENTS.md`。

## 当前已验证状态

- **仓库根目录**：`/Users/imac/Desktop/nook`
- **技术栈**：Tauri 2 + Vue 3 + Vite + TypeScript + Element Plus + Iconify + Vditor + Pinia + Vue Router + VueUse + 本地 SQLite（@tauri-apps/plugin-sql）。详见 `AGENTS.md` 技术栈段。
- **Rust 工具链**：rustc/cargo 1.98.0（stable-aarch64-apple-darwin），PATH 已写进 `~/.zshrc`（`. "$HOME/.cargo/env"`）。
- **标准启动路径**：`pnpm tauri dev`（首次编译 Rust 后端约 1 分钟，之后秒起）
- **标准验证路径**：
  - 前端类型检查 + 构建：`pnpm build`（= `vue-tsc --noEmit && vite build`）
  - Rust 编译检查：`cd src-tauri && cargo check`
  - 记录一致性：`bash scripts/check-records.sh`（挂进 `./init.sh`）
  - 一键全量验证：`./init.sh`
- **当前最高优先级未完成功能**：
  1. **feat-001 已完成**（项目依赖与脚手架扩充）：PRD 全部依赖装齐（plugin-sql/dialog/fs、Element Plus、Iconify、Vditor、Pinia、Vue Router、VueUse）+ `@` 别名 + Element Plus 按需自动引入 + capabilities 授权。`pnpm build` + `cargo check` + `pnpm tauri dev` 烟测全过。
  2. **下一个 feat-002 基础布局**（侧边栏 + 内容区 + 顶部搜索）：PRD「整体架构与布局设计」。依赖 feat-001，已解锁。
  3. 之后按 `feature_list.json` 依赖顺序推进 feat-003 → feat-004 → ...
- **当前 blocker**：无。feat-001 地基已铺好，所有后续 feature 的前置（依赖/别名/按需引入/capabilities）就位。
- **前端代码基线**：feat-001 已改写脚手架模板——`src/App.vue`（改为 `<RouterView/>` + 白色根）、`src/main.ts`（挂 pinia + router）、新增 `src/stores/index.ts`、`src/router/index.ts`、`src/views/HomeView.vue`（验证页，含 `el-button`）；`vite.config.ts` 加 AutoImport + Components + @ 别名；`tsconfig.json` 加 baseUrl/paths/auto-imports.d.ts/components.d.ts；`src-tauri/Cargo.toml` 补 sqlite feature、`src-tauri/src/lib.rs` 注册三插件、`capabilities/default.json` 授权。`auto-imports.d.ts`、`components.d.ts` 由 vite build 生成。
- **收尾纪律（每轮必做）**：验证命令跑过 → `logs/YYYY-MM-DD.md` 追加改动记录 → 本文件"当前已验证状态"与实际对齐（过期即改）。详见 `AGENTS.md` 初始化与交接一节。
- **今日 harness 工程化落地**：参照 `hbrb-aigc-frontend` 的标准 harness 范式，为 nook 搭建同款：路由器式 `AGENTS.md`（14 条硬约束，按 Vue/Element Plus/Tauri 栈改写）+ 自包含 `CLAUDE.md` + `feature_list.json`（12 个 feature，对齐 PRD V1 范围）+ `feature_list.schema.json` + `init.sh`（pnpm install/build + cargo check + check-records）+ `scripts/check-records.sh`（适配 src/ + src-tauri/src，扫 .vue/.ts/.rs）+ `progress.md`（英文 Current State 头）+ `session-handoff.md` + `logs/2026-08-25.md` + `rules/`×4（project-structure/tauri-ipc/db/style）。PRD 评审修订同步记录于 `logs/2026-08-25.md`。

---

## 会话记录

### 2026-08-25 — Rust 环境搭建 + Tauri 启动验证 + PRD 评审修订 + harness 落地

- **本轮目标**：① 核实并搭建 Rust 环境；② 用 nook Tauri 项目跑起来验证环境成功；③ 评审并修订 PRD；④ 参照 hbrb-aigc-frontend 为 nook 搭建标准 harness。
- **已完成**：
  - **Rust 环境**：确认机器原先无 Rust，装 rustup + stable 1.98.0（rustc/cargo）。`~/.profile` 为 root 拥有导致 rustup 写 profile 失败，改用 `~/.zshrc` 追加 `. "$HOME/.cargo/env"` 持久化 PATH。
  - **esbuild 构建脚本放行**：`pnpm-workspace.yaml` 的 `allowBuilds: esbuild: false` 改为 `true`（之前创建项目时被默认拦下）；撤掉误加到 `package.json` 的无效 `pnpm.onlyBuiltDependencies` 字段（新版 pnpm 已不读，改读 workspace.yaml）。
  - **Tauri 启动验证**：`cargo build` 通过（59s，编译 tauri 2.11.5 等数百 crate）；后台 `pnpm tauri dev` 起 vite（localhost:1420 HTTP 200）+ cargo run + nook 窗口弹出。**环境搭建成功**。后停掉 dev 进程（pkill nook/tauri/vite，端口释放）。
  - **PRD 评审修订（v1.1）**：见 `PRD产品需求文档.md` 「文档修订记录」段。要点：建表 SQL 补 `PRAGMA foreign_keys=ON` + `journal_mode=WAL`；`visualization`/`action_step`/`manifestation_log` 三子表补 `FOREIGN KEY ... ON DELETE CASCADE`（修"PRD 承诺级联但 DDL 没约束"的硬伤）；数据库操作规范补"每次连接必开外键""时间存本地时间""导入校验魔数头""删订单级联清子表"；异常表强化导入校验；打包产物补 macOS aarch64；体积预算调 exe≤30MB/dmg≤40MB；多实例问题标 V1.1 引入 single-instance。
  - **harness 落地**：按 hbrb-aigc-frontend 标准范式搭建（文件清单见上「今日 harness 工程化落地」）。硬约束 14 条按 Vue/Element Plus/Tauri 栈改写（禁 any、禁字符串拼接 SQL、禁不开 PRAGMA、禁手写删子表、禁网络请求、禁深色主题、禁相对路径 import 用 @ 别名 等）。
  - **改动文件**：`AGENTS.md`、`CLAUDE.md`、`feature_list.json`、`feature_list.schema.json`、`init.sh`、`scripts/check-records.sh`、`progress.md`、`session-handoff.md`、`logs/2026-08-25.md`、`rules/project-structure.md`、`rules/tauri-ipc.md`、`rules/db.md`、`rules/style.md`、`PRD产品需求文档.md`（评审修订）、`pnpm-workspace.yaml`（esbuild 放行）、`~/.zshrc`（cargo PATH）、`~/.claude/settings.json`（bypassPermissions）。
- **运行过的验证**：`rustc --version`（1.98.0）✅；`cargo --version`（1.98.0）✅；`cargo build`（src-tauri，59s Finished）✅；`pnpm tauri dev`（vite ready + cargo run + 窗口弹出）✅；`curl localhost:1420`（HTTP 200）✅。
- **提交记录**：无（nook 非 git 仓库，待用户决定是否 init）。
- **已知风险或未解决问题**：① nook 尚未 `git init`，无版本控制；② PRD 指定依赖未装，feat-001 未做；③ CSP 设为 null（纯本地可接受，接外部内容前再收紧）；④ 无 schema migration 机制（V1 够用，V2 加字段时再说）。
- **下一步最佳动作**：执行 feat-001（装依赖 + 配 @ 别名 + 配 capabilities），然后 feat-002 基础布局 + feat-003 数据库初始化模块。

### 2026-08-25 — feat-001 项目依赖与脚手架扩充

- **本轮目标**：执行 feat-001——装齐 PRD 指定全部依赖，配 `@` 路径别名、Element Plus 按需自动引入、plugin-sql/dialog/fs capabilities，为 feat-002~012 铺地基。
- **已完成**：
  - **Tauri 插件**：`pnpm tauri add` 装 plugin-sql / plugin-dialog / plugin-fs，注册进 `src-tauri/src/lib.rs`、授权进 `src-tauri/capabilities/default.json`。
  - **关键修复**：`tauri add sql` 漏写 `features = ["sqlite"]`，`src-tauri/Cargo.toml` 手改为 `tauri-plugin-sql = { version = "2", features = ["sqlite"] }`。
  - **前端依赖**：element-plus、@iconify/vue、vditor、pinia、vue-router、@vueuse/core；构建插件 unplugin-vue-components、unplugin-auto-import。
  - **配置**：`vite.config.ts` 加 AutoImport + Components(ElementPlusResolver) + @ 别名；`tsconfig.json` 加 baseUrl/paths + auto-imports.d.ts/components.d.ts。
  - **代码**：`src/main.ts` 改写（pinia + router）；`src/App.vue` 改 `<RouterView/>` + 白底；新增 `src/stores/index.ts`、`src/router/index.ts`、`src/views/HomeView.vue`（`el-button` 验证按需引入）。
- **运行过的验证**：`pnpm build`（1619 modules，4.39s）✅；`cd src-tauri && cargo check`（sqlx 0.8.6，1m24s）✅；`pnpm tauri dev` 烟测（vite ready + nook 窗口 + element-plus/es 运行时按需引入生效）✅。后停掉 dev 进程。
- **改动文件**：`src-tauri/Cargo.toml`、`src-tauri/src/lib.rs`、`src-tauri/capabilities/default.json`、`vite.config.ts`、`tsconfig.json`、`src/main.ts`、`src/App.vue`、`src/stores/index.ts`（新）、`src/router/index.ts`（新）、`src/views/HomeView.vue`（新）、`auto-imports.d.ts`（生成）、`components.d.ts`（生成）、`package.json`、`pnpm-lock.yaml`。
- **提交记录**：无（feat-001 改动尚未 commit，待用户决定。仓库已建为公开开源，git@github.com:dev-wangqiuyu/nook.git）。
- **已知风险或未解决问题**：① `src-tauri/src/lib.rs` 仍留模板自带的 `greet` command（死代码无害，feat-002 清理）；② CSP 仍为 null（纯本地可接受，接外部内容前再收紧）；③ 无 schema migration（V1 够用）；④ `vue-router` latest tag 解析到 5.x（major），已验证可用但留意后续 API 变动。
- **下一步最佳动作**：执行 feat-002 基础布局（侧边栏 + 内容区 + 顶部搜索 + Vue Router 路由表），依赖 feat-001 已解锁。

### 2026-08-25 — harness 规则扩充：接入 frontend-design skill

- **本轮目标**：按用户要求，把 `frontend-design` skill 接进 harness，使后续前端页面设计强制走该 skill。
- **已完成**：`AGENTS.md` 加硬约束 #15 + 专题文档表 style.md 行更新；`rules/style.md` 加「设计流程：frontend-design skill」段（含与白色极简约束 #10 的优先级调和：PRD > skill，冲突时白色极简为准）。
- **改动文件**：`AGENTS.md`、`rules/style.md`。
- **运行过的验证**：无构建（纯文档）。`check-records.sh` 仅扫代码 mtime，本次未改代码，基线不受影响。
- **下一步最佳动作**：执行 feat-002 基础布局——动手前先调用 `frontend-design` skill（硬约束 #15）。
