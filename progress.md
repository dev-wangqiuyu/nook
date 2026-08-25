## Current State

**Last Updated:** 2026-08-25 **Active Feature:** 无（harness 刚落地，未开工）
**What's Done / What's In Progress / What's Next:** 见下方「当前已验证状态」段
**Blockers / Risks:** 无（Rust 1.98 环境就绪，esbuild 构建脚本已放行）
**Evidence of Completion:** `[command and output]` 见下方「标准验证路径」
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
  1. **feat-001 项目依赖与脚手架扩充未做**：PRD 指定依赖（plugin-sql/dialog/fs、Element Plus、Iconify、Vditor、Pinia、Vue Router、VueUse）尚未安装，`@` 路径别名未配置。这是所有后续功能的前置。
  2. 之后按 `feature_list.json` 依赖顺序推进 feat-002 → feat-003 → ...
- **当前 blocker**：无。脚手架为官方 `npm create tauri@latest` 产物，`pnpm tauri dev` 已验证可起窗口。PRD 已评审修订到 v1.1（建表 SQL 补 PRAGMA + 子表外键、打包补 arm64、导入校验改魔数头）。
- **前端代码基线**：脚手架自带的模板文件未动，仍是 `npm create tauri@latest -- --template vue-ts` 原样——`src/App.vue`、`src/main.ts`、`src/vite-env.d.ts`、`src/components/` 下默认样例、`src/views/`（暂无）。feat-001 起开始改写。
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
