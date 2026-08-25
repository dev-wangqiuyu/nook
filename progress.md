## Current State

**Last Updated:** 2026-08-25 **Active Feature:** feat-005（feat-001/002/003/004 已完成）
**What's Done / What's In Progress / What's Next:** feat-001/002/003/004 done；下一个 feat-005 每日计划/待办模块
**Blockers / Risks:** 无（Rust 1.98 就绪、PRD 依赖装齐、布局壳落地、DB 初始化跑通、首个 CRUD 链路验证、Composition API + 企业级 + SQL 注释规范写入）
**Evidence of Completion:** `pnpm build` + `cargo check` + `pnpm tauri dev` 烟测 + sqlite3 实测 CRUD 落库；见 `logs/2026-08-25.md` feat-004 段
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
  1. **feat-001 已完成**（项目依赖与脚手架扩充）。
  2. **feat-002 已完成**（基础布局）：侧边栏（首页/待办/笔记/订单+分隔线+设置，Iconify lucide 离线图标，仪式金 active 条）+ 顶栏搜索框（P1 占位）+ 内容区 RouterView + 五路由懒加载 + 各模块占位页（`SettingsView.vue` 等）+ design tokens（Quiet Stationery 暖纸极简）。`pnpm build` + `cargo check` + `pnpm tauri dev` 烟测全过。
  3. **feat-003 已完成**（数据库初始化模块）：`src/api/schema.ts`（11 表 DDL，FK CASCADE 全补）+ `src/api/db.ts`（API 层唯一出口：`initDb` 连接单例+PRAGMA+建表 / `getDb` / `query<T>` / `run` / `closeDb`，参数绑定）+ `src/App.vue`（onMounted initDb）。**关键修复**：`capabilities/default.json` 加 `sql:allow-execute`（`sql:default` 不含 execute，建表全被拒）。**dev/prod 分库**：dev 库落项目 `db/nook.db`（`import.meta.env.DEV` + `vite.config.ts` define `__DEV_DB_PATH__` 绝对路径），prod 库落 `app_config_dir`；两套独立库靠 feat-008 手动导入导出同步；`db/*.db*` gitignore。`pnpm build` + `cargo check` + `pnpm tauri dev` + sqlite3 实测 11 表+FK CASCADE+WAL 全过。
  4. **下一个 feat-005 每日计划/待办模块**：任务 CRUD + 4 状态 + 3 级优先级 + 今日视图 + 全部视图（状态/优先级/标签筛选），并接入 TG-04 打标签。依赖 feat-002/003/004，已解锁。
- **当前 blocker**：无。首个 CRUD（标签）跑通，$1 参数绑定端到端验证，后续业务模块有可复用的 api 层范式 + 时间工具 + SQL 注释规范。
- **前端代码基线**：feat-002 落地布局——`src/App.vue`（布局壳）、`src/main.ts`（引 tokens.css + 离线注册 lucide 图标）、`src/assets/styles/tokens.css`（design tokens）、`src/components/layout/`（AppSidebar/AppTopbar/PageShell）、`src/router/index.ts`（五路由懒加载）、`src/views/{home,todo,note,order,settings}/`（占位页用 PageShell）。feat-001 的 `src/views/HomeView.vue` 已迁至 `views/home/`。
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

### 2026-08-25 — 数据库文件名改名 app.db → nook.db

- **本轮目标**：数据库文件名从 `app.db` 改为 `nook.db`（用户指出更合理）。
- **已完成**：全量替换 `app.db`/`app\.db` → `nook.db`/`nook\.db`；`app_setting` 表名保留。改动：PRD、README、rules/tauri-ipc.md、rules/db.md、feature_list.json。
- **改动文件**：`PRD产品需求文档.md`、`README.md`、`rules/tauri-ipc.md`、`rules/db.md`、`feature_list.json`。
- **运行过的验证**：grep 确认无拋留。纯文档，无构建。
- **下一步最佳动作**：执行 feat-002 基础布局（动手前先调 `frontend-design` skill）。

### 2026-08-25 — harness: Vue 3 Composition API 规范

- **本轮目标**：按用户要求，把 Vue 3 官方推荐 Composition API 工程化写法写进 harness。
- **已完成**：新建 `rules/vue.md`（`<script setup>` 强制 / 响应式 / 类型化 props-emits-model / composable 抽离门槛 / 命名 / 禁 any）；`AGENTS.md` 加硬约束 #16（禁 Options API）+ 专题文档表加 vue 行；`CLAUDE.md` 必做第 2 步 rules 列表加 vue。
- **改动文件**：`rules/vue.md`（新）、`AGENTS.md`、`CLAUDE.md`。
- **运行过的验证**：纯文档，无构建。feat-002 组件已按此规范写。
- **下一步最佳动作**：feat-002 已完成，执行 feat-003 数据库初始化模块。

### 2026-08-25 — feat-002 基础布局（侧边栏 + 内容区 + 顶部搜索）

- **本轮目标**：执行 feat-002——落地 PRD「整体架构与布局设计」，为所有业务模块铺视觉与路由地基。调 frontend-design skill（#15）。
- **已完成**：
  - **设计方向**：Quiet Stationery 暖纸极简（暖白纸面色 + 墨色文字 + 发丝分隔 + 仪式金强调色 + 衬线品牌字标 + 暖纸微颗粒纹理）；白色极简（#10）优先级 > frontend-design skill 的"主题变化"。
  - **离线图标**：装 `@iconify-json/lucide`（devDep），`main.ts` `addCollection(lucide)` 注册，避免 @iconify/vue 默认 API 拉取（违反 #9）。
  - **tokens**：`src/assets/styles/tokens.css` 集中色板/字体/间距/动效 CSS 变量。
  - **布局组件**：`App.vue`（壳）、`AppSidebar.vue`（品牌字标+主导航+设置，金条 active，staggered 入场）、`AppTopbar.vue`（下划线搜索框，P1 占位）、`PageShell.vue`（类型化 props+插槽，各页复用）。
  - **路由+占位页**：`router/index.ts` 五路由懒加载；`views/{home,todo,note,order,settings}/` 各占位页用 PageShell；删旧 `src/views/HomeView.vue`。
- **运行过的验证**：`pnpm build`（50 modules，533ms，路由 code-split）✅；`cargo check`（0.66s）✅；`pnpm tauri dev` 烟测（vite ready 286ms + nook 编译 4.20s + 窗口弹出 + 无运行时错误）✅。后停 dev 进程。
- **改动文件**：`package.json`、`pnpm-lock.yaml`、`src/main.ts`、`src/App.vue`、`src/router/index.ts`、`src/assets/styles/tokens.css`（新）、`src/components/layout/AppSidebar.vue`（新）、`src/components/layout/AppTopbar.vue`（新）、`src/components/layout/PageShell.vue`（新）、`src/views/home/HomeView.vue`（重写）、`src/views/todo/TodoView.vue`（新）、`src/views/note/NoteView.vue`（新）、`src/views/order/OrderView.vue`（新）、`src/views/settings/SettingsView.vue`（新）；删 `src/views/HomeView.vue`。
- **提交记录**：feat-002 + Composition API 规范尚未 commit，待用户决定。
- **已知风险或未解决问题**：① index chunk 698KB（lucide 1844 图标离线打包），V1 可接受，后续若需瘦身可改按需 `addIcon` 只注册用到的；② 顶部搜索为占位，实时过滤在 feat-012；③ 字体走系统栈（离线禁网络字体），跨平台衬线回退 Georgia 可接受。
- **下一步最佳动作**：执行 feat-003 数据库初始化模块（连接 nook.db + PRAGMA + 建表 + SQL 封装）。

### 2026-08-25 — harness: 企业级开发范式 + 组件化

- **本轮目标**：按用户要求，把企业级分层/组件化开发范式写进 harness。
- **已完成**：`rules/vue.md` 加「组件化开发范式」段（展示vs容器、props-down/events-up、插槽优先、复用门槛、defineExpose 收敛）；`rules/project-structure.md` 加「企业级分层与依赖方向」段（单向分层、api 层唯一出口、状态归属、类型、常量提取、错误处理、不可变）；`AGENTS.md` 加硬约束 #17（禁跨层反向依赖）+ 专题文档表更新。
- **改动文件**：`rules/vue.md`、`rules/project-structure.md`、`AGENTS.md`。
- **运行过的验证**：纯文档，无构建。check-records 未改代码不受影响。
- **下一步最佳动作**：执行 feat-003 数据库初始化模块。

### 2026-08-25 — 窗口尺寸调大 + 企业级规则收尾

- **本轮目标**：① 窗口调大；② 提交企业级分层/组件化规则 + 窗口改动。
- **已完成**：`src-tauri/tauri.conf.json` 窗口 800×600 → 1200×800，加 minWidth/minHeight/resizable/center，标题 → Nook。
- **改动文件**：`src-tauri/tauri.conf.json`。
- **运行过的验证**：`cargo check`（3.69s，tauri-build 解析 conf）✅；`pnpm tauri dev` 烟测（新尺寸窗口启动无错误）✅。
- **下一步最佳动作**：执行 feat-003 数据库初始化模块。

### 2026-08-25 — feat-003 数据库初始化模块

- **本轮目标**：执行 feat-003——程序启动连接 nook.db + PRAGMA（外键/WAL）+ 全部 CREATE TABLE IF NOT EXISTS + SQL 执行封装（参数绑定）。
- **已完成**：
  - **建表 DDL** `src/api/schema.ts`（新）：`SCHEMA_STATEMENTS: readonly string[]`，11 表 `CREATE TABLE IF NOT EXISTS`，与 PRD v1.1 对齐（`task_tag`/`note_tag`/`visualization`/`action_step`/`manifestation_log` 均 `FOREIGN KEY ... ON DELETE CASCADE`）；PRAGMA 不在数组，由 initDb 建表前先跑。
  - **API 层封装** `src/api/db.ts`（新）：plugin-sql 唯一出口（#17）。`initDb()` 连接单例（`Database.load("sqlite:nook.db")`）→ `PRAGMA foreign_keys=ON`（#5）→ `PRAGMA journal_mode=WAL` → 循环跑 11 条建表；幂等 + 并发复用 `initPromise`，失败清 Promise 可重试。`getDb()` 懒兜底。`query<T>(sql, params)` 走泛型 `select<T[]>`免断言（#3）。`run(sql, params)` 返回 `{rowsAffected, lastInsertId?}`。`closeDb()` 供 feat-008。`readonly unknown[]` → `[...params]` 展开修 vue-tsc 报错。
  - **启动接线** `src/App.vue`：`onMounted` 调 `initDb()`，失败 `ElMessage.error`（ElMessage 显式 import + style/css，规避 auto-imports.d.ts 重生成时序的类型报错）。
  - **关键修复（权限）**：`src-tauri/capabilities/default.json` 加 `sql:allow-execute`——`sql:default` 只授权 `load`/`select`/`close`，**不含 `execute`**，建表全被拒（`sql.execute not allowed`），错误被 catch 吞到 ElMessage，表现为"DB 文件建了但 0 张表"。已写入 `rules/db.md`「权限」段备忘。改 capabilities 需重编 Rust。
- **改动文件**：`src/api/schema.ts`（新）、`src/api/db.ts`（新）、`src/App.vue`、`src-tauri/capabilities/default.json`、`rules/db.md`。
- **运行过的验证**：`pnpm build`（vue-tsc + vite build，index 747KB/gzip 152KB）✅；`cargo check`（capabilities 改后 6.30s+0.81s）✅；`pnpm tauri dev` 烟测（vite ready + 窗口 + 用户确认无报错）✅；sqlite3 实测 `~/Library/Application Support/com.nook.app/nook.db`：11 表全在 + `journal_mode`=wal + `foreign_key_list(task_tag)` 两条 CASCADE ✅；DDL 语法先在 `/tmp/ddltest.db` 独立验证全过（排除 DDL 问题，确认是权限问题）。
- **提交记录**：feat-003 改动尚未 commit，待用户决定。
- **已知风险或未解决问题**：① `$1` 占位符 feat-003 未实跑（全 DDL 无参数），首次 CRUD 验证留 feat-004；② 无 schema migration（V1 `IF NOT EXISTS` 够用）；③ DB 文件落 `app_config_dir`，dev/prod 一致，feat-008 导入前先 `closeDb()`。
- **下一步最佳动作**：执行 feat-004 标签管理（首次 CRUD，跑通 `query`/`run` + `$1` 占位符 + 参数绑定）。

### 2026-08-25 — feat-004 标签管理（首个 CRUD，跑通 $1 参数绑定）

- **本轮目标**：执行 feat-004——标签 CRUD（TG-01~TG-05），验证 feat-003 封装的 `query`/`run` + `$1` 参数绑定端到端跑通。
- **已完成**：
  - **类型** `src/types/tag.ts`（新）：`Tag` + `TagWithCount`。
  - **时间工具** `src/utils/time.ts`（新）：`localNow()` / `localToday()`，多模块复用。
  - **API 层** `src/api/tag.ts`（新）：`listTags`（LEFT JOIN + COUNT DISTINCT 算关联数）/ `getTag` / `createTag`（唯一校验 + INSERT `$1,$2`）/ `updateTag`（唯一校验排除自身 + UPDATE）/ `deleteTag`（FK CASCADE 自动清子表）。**每条 SQL 带完整注释**。
  - **容器组件** `src/components/tag/TagManager.vue`（新）：列表+新建+行内改名（v-focus）+内联删除确认（有关联时 ElMessageBox 警告级联清理）。Quiet Stationery 样式。
  - **标签页** `src/views/tags/TagsView.vue`（新）+ 路由 `/tags` + 侧边栏「标签」导航项——**入口从设置页升级为侧边栏一等模块**（用户决策，偏离 PRD S-06 默认）。
  - **设置页** 移除 TagManager，回占位（feat-010 落地）。
  - **依赖** `es-toolkit@1.51.0`（用户要求装的工具库，本 feat 未直接用）。
  - **harness 规则**：硬约束 #18（SQL 必须写清楚注释）+ `rules/db.md`「SQL 注释规范」段；PRD TG-05/S-06 改为侧边栏标签页。
- **改动文件**：`src/types/tag.ts`、`src/utils/time.ts`、`src/api/tag.ts`、`src/components/tag/TagManager.vue`、`src/views/tags/TagsView.vue`、`src/views/settings/SettingsView.vue`、`src/router/index.ts`、`src/components/layout/AppSidebar.vue`、`AGENTS.md`、`rules/db.md`、`PRD产品需求文档.md`、`feature_list.json`、`package.json`、`pnpm-lock.yaml`。
- **运行过的验证**：`pnpm build`（TagsView 66KB 独立 chunk）✅；`cargo check` 0.65s ✅；`pnpm tauri dev` 烟测 HMR 正常 ✅；**$1 参数绑定实跑**：用户在 UI 创建「测试」标签 → sqlite3 实测 tag 表落库（id 1）✅；listTags 查询用 sqlite3 灌测试数据验证关联数正确（无关联返 0）✅。
- **提交记录**：未 commit，待用户决定。
- **已知风险或未解决问题**：① TG-04 打标签到待办/笔记要等 feat-005/006 有宿主；② updateTag/deleteTag 用同条 run()+$1 路径（createTag 已实跑证明），改名/删除 UI 流程可进一步手测；③ es-toolkit 已装未用。
- **下一步最佳动作**：执行 feat-005 每日计划/待办模块（任务 CRUD + 4 状态 + 优先级 + 今日视图 + 标签筛选 + 接入 TG-04 打标签）。

### 2026-08-25 — feat-004 收尾：listTags JOIN 讲解写入注释

- **本轮目标**：按用户要求讲解左连接/右连接，写进 listTags 注释供学习查阅。
- **已完成**：`src/api/tag.ts` 的 listTags 注释扩充——LEFT JOIN 必要性（INNER 会丢未用标签）、JOIN 四类型回顾（INNER/LEFT/RIGHT/FULL）、COUNT(DISTINCT) 原因（双 LEFT JOIN 笛卡尔积）、等价子查询写法。
- **改动文件**：`src/api/tag.ts`。
- **运行过的验证**：`pnpm build` ✅（注释级改动）。
- **下一步最佳动作**：执行 feat-005 每日计划/待办模块。

### 2026-08-25 — feat-004 收尾：listTags 注释补「如何区分左右表 + LEFT JOIN 实际用得最多」

- **本轮目标**：用户学完 JOIN 四类型后追问如何区分左表/右表 + LEFT JOIN 是否实际用得最多，按硬约束 #18 把讲解写进 listTags 注释。
- **已完成**：`src/api/tag.ts` 的 listTags 注释加两节——「如何区分左表/右表」（语法位置决定，FROM 后=左，JOIN 后=右）+「LEFT JOIN 实际用得最多吗？为什么」（主表为轴业务模式天然在左、RIGHT 可改写成 LEFT 故不用、SQLite 3.39 前不支持 RIGHT）+ JOIN 选择决策树。
- **改动文件**：`src/api/tag.ts`。
- **运行过的验证**：`pnpm build`（vue-tsc + vite build）✅ 2.39s 无类型错误。
- **下一步最佳动作**：执行 feat-005 每日计划/待办模块。

### 2026-08-25 — feat-004 收尾：rules/db.md JOIN 速查段扩充为「JOIN 全家桶」

- **本轮目标**：用户追问"inner join 是啥？还有啥 join"，按硬约束 #18 把 JOIN 全家族整理进 rules/db.md 存档。
- **已完成**：`rules/db.md` 原「JOIN 速查（左连接/右连接）」段扩充为「JOIN 全家桶」——加 INNER JOIN 详解（交集语义，`JOIN` 默认即 INNER）、CROSS JOIN（笛卡尔积 m×n、`ON 1=1` 退化、漏写 ON 行数爆炸坑）、SELF JOIN（自己连自己配别名处理树形层级）、NATURAL JOIN（按同名列自动连，工程别用易错）；全类型对照表补全 7 种 JOIN；选择决策树与一句话总结同步补齐。
- **改动文件**：`rules/db.md`。
- **运行过的验证**：check-records 门禁通过（文档级改动，未改代码基线）。
- **下一步最佳动作**：执行 feat-005 每日计划/待办模块。

### 2026-08-25 — 新增 SQL 从入门到精通学习文档

- **本轮目标**：用户要求系统讲一遍 SQL 常见知识（入门到精通、不高深、常见 CRUD），写成学习文档存档。
- **已完成**：新建 `docs/sql-tutorial.md`——紧扣 Nook 表结构（task/note/tag/task_tag）的 SQL 指南，十大章：语句四大类 → SELECT 全解（WHERE/ORDER BY/分页/聚合/GROUP BY+HAVING/JOIN/子查询/CASE/集合运算）→ INSERT（含 OR IGNORE / ON CONFLICT upsert）→ UPDATE → DELETE（DELETE/DROP/TRUNCATE 对比）→ NULL 三值逻辑 → 常用函数 → 索引 → 事务 ACID → PRAGMA → 安全性能心法 + Nook 实战查询对照表。
- **改动文件**：`docs/sql-tutorial.md`（新）。
- **运行过的验证**：纯文档新增，check-records 门禁不受影响。
- **下一步最佳动作**：执行 feat-005 每日计划/待办模块。