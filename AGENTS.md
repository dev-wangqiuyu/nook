# AGENTS.md — Nook 项目编码规范（唯一指令入口）

> 本项目唯一的智能体指令文件。结构遵循 harness 规范：本文件是**路由器**（概览 + 工作流程 + 硬约束 + 专题路由），详细规则在 [rules/](rules/) 专题文档，用时才读。

## 项目概览

Nook——面向个人自用的桌面端单机管理工具：每日计划/待办、随笔笔记、宇宙订单（吸引力法则）、标签管理。纯本地、离线、无后端，数据存本地 SQLite，支持整库导出/导入跨电脑迁移。白色极简风格。完整需求见 [PRD产品需求文档.md](PRD产品需求文档.md)。

## 技术栈

- **桌面框架**：Tauri 2（Rust 底层 + 系统 WebView）
- **前端**：Vue 3 + Vite + TypeScript
- **UI**：Element Plus + Iconify（@iconify/vue）
- **富文本**：Vditor（Markdown，三模式）
- **状态/路由**：Pinia + Vue Router
- **工具**：VueUse
- **本地数据库**：SQLite（`@tauri-apps/plugin-sql`，手写 SQL，无 ORM）
- **文件/托盘**：Tauri 原生 fs / dialog / 托盘 API

## 快速开始

```bash
pnpm install            # 安装依赖（强制 pnpm，禁 npm install）
pnpm tauri dev          # 启动开发（编译 Rust 后端 + 起 vite 前端，首次较慢）
pnpm build             # 前端类型检查 + 构建（vue-tsc --noEmit && vite build）
cd src-tauri && cargo check   # Rust 后端编译检查
```

> 项目 `package.json` **未配置 test / lint 脚本**，前端构建（含 vue-tsc 类型检查）+ Rust `cargo check` 是主要验证门禁。

## 强制记录（每次改动后必做）

> 任何代码 / 规则 / 文档改动完成后，**立即**执行以下记录，不等会话结束：

1. **追加 `logs/YYYY-MM-DD.md`**（当天日期）：记录本次改了什么、为什么、验证结果。同一天多次改动追加到同一文件。
2. **更新 `progress.md`**——以下要对齐，任一未对齐 = 未完成：
   - **「当前已验证状态」段**：核对仓库根 / 技术栈 / 标准启动验证路径 / 最高优先级未完成功能 / 当前 blocker 是否仍准确，过期即改。
   - **「会话记录」段**：追加当日 `### YYYY-MM-DD — 简述` 条目，记本轮目标 / 已完成（含改动文件相对路径）/ 运行过的验证命令与结果 / 提交记录 / 已知风险或未解决问题 / 下一步最佳动作。
3. **更新 `feature_list.json`**：完成一个 feature 时改其 status。

**未完成上述记录 = 改动未完成**（Definition of Done 强制要求）。

> 机械门禁：`bash scripts/check-records.sh`（已挂进 `init.sh`）比对代码与 `progress.md` / 当日 `logs/` 的 mtime + 内容，改了代码不碰记录会判红。注意它只抓「存在性漏填」，抓不了「碰了但内容敷衍」——后者靠上面分段 checklist 兜。

## 行为准则

> 偏向谨慎而非速度；简单任务可酌情放宽；全程使用中文回答。

1. **思考先行**：实现前声明假设；多种解读就列出选项，不静默选择；模糊就停下来提问。
2. **简洁优先**：只写解决当前问题的最小代码；不加推测性功能；不处理不可能发生的错误；能压缩就重写。
3. **手术式变更**：只碰必须碰的；匹配既有风格；不重构没坏的东西；每行变更都能追溯到用户请求。
4. **目标驱动**：任务转化为可验证目标；多步任务先写计划（`1. [步骤] → 验证: [检查]`）再循环直到验证。

通用工程纪律（同属简洁优先）：

- 不写多行注释和冗长 docstring，单行注释仅在 WHY 不明显时使用
- 不擅自添加 error handling / fallback / validation 给不可能发生的场景
- 不做过早抽象，三行相似代码优于一个提前抽象
- 不添加用户未要求的 feature / refactor / comment

## Harness 工作流程

### Context 加载策略（渐进式披露）

| 层级 | 内容 | 加载时机 |
|---|---|---|
| Tier 1 元数据 | `feature_list.json` 功能 ID/状态、本文件、`progress.md` Current State | 会话开始即读 |
| Tier 2 指令 | `rules/` 专题文档（动手的主题才读） | 写对应代码前读 |
| Tier 3 资源 | [PRD产品需求文档.md](PRD产品需求文档.md) 完整需求 | 涉及对应模块才读 |

### Startup Workflow

1. 确认工作目录（`pwd`，应为 `~/Desktop/nook`）
2. 完整阅读本文件 + `rules/` 中本次任务相关的专题
3. 运行 `./init.sh` 验证环境健康（依赖 + 前端构建 + Rust 编译检查 + 记录一致性）
4. 读取 `feature_list.json` 查看当前功能状态
5. 基线验证失败时，先修复基线，再开展新功能

### Working Rules

- **One feature at a time（一次只做一个功能）**：从 `feature_list.json` 挑恰好一个未完成功能
- **Stay in scope（保持在范围内）**：不修改与当前功能无关的文件
- **验证必需**：未运行验证命令，不得声称完成
- **留下干净状态**：下次会话必须能直接运行 `./init.sh`
- **委派即隔离**：需子代理并行时先消化再委派，子代理 prompt 必须自包含

### Required Artifacts

`feature_list.json` · `init.sh` · `progress.md` · `session-handoff.md`（大型会话可选）

### Definition of Done

- 目标行为已实现
- 必需验证确实运行了（`pnpm build` / `cargo check`）
- **改动已记录到 `logs/YYYY-MM-DD.md`** + `progress.md` 各段与本次改动对齐（`bash scripts/check-records.sh` 须通过）
- 仓库仍可从标准启动路径重启（`pnpm tauri dev`）

### End of Session

1. 更新 `progress.md` 记录当前状态
2. 更新 `feature_list.json` 的功能状态
3. 记录未解决的风险或阻塞
4. 代码改动按上方「强制记录」规则追加到 `logs/YYYY-MM-DD.md`
5. 仅在用户明确要求时执行 git 提交

### Escalation

- **架构决策**：查阅 [PRD产品需求文档.md](PRD产品需求文档.md)，否则询问用户
- **需求不明确**：查阅 PRD 对应模块，否则询问用户
- **反复验证失败**：更新 `progress.md`，标记人工介入
- **范围模糊**：重读 `feature_list.json` 的 Definition of Done

## 硬约束（不可违反）

以下规则强制执行，不得以任何理由绕过：

1. ❌ 禁 `npm install`（强制 `pnpm`）
2. ❌ 禁使用 `any`（用 `unknown` + 类型收窄，或明确联合/泛型）
3. ❌ 禁字符串拼接 SQL（必须用参数绑定 `$1, $2` 占位符，防注入）
4. ❌ 禁绕过 `@tauri-apps/plugin-sql` 直接引入原生 sqlite3 驱动
5. ❌ 禁每次打开数据库连接后不执行 `PRAGMA foreign_keys = ON`（否则所有级联删除失效）
6. ❌ 禁手写删除子表记录（删除订单/任务/笔记时靠外键 `ON DELETE CASCADE` 级联，不写 `DELETE FROM task_tag WHERE ...`）
7. ❌ 禁引入 `package.json` 未声明的新依赖（先告知用户确认）
8. ❌ 禁擅自执行 git 命令（`checkout` / `reset --hard` / `clean` / `stash drop` / `push --force` 等，仅在用户明确要求时执行）
9. ❌ 禁引入网络请求库或云端服务（纯本地离线，不装 axios / 不调 fetch 远程）
10. ❌ 禁深色主题样式（全应用白色极简，PRD 明确非目标）
11. ❌ 禁相对路径 import（用 `@` 别名）
12. ❌ 禁写英文注释与英文回答（所有对话、注释必须中文）
13. ❌ 禁 `console.log` 遗留在正式代码中（调试除外，提交前清除）
14. ❌ 禁 Element Plus 废弃 API 与静态调用（按 PRD 选用稳定 API，弹窗用 ElMessageBox / ElMessage）

## 专题文档

| 文档 | 内容 | 何时读 |
|---|---|---|
| [rules/project-structure.md](rules/project-structure.md) | 目录结构、src/ 与 src-tauri/ 边界、模块组织 | 建新页面/模块时 |
| [rules/tauri-ipc.md](rules/tauri-ipc.md) | plugin-sql / dialog / fs / 托盘 用法、IPC 命令、capabilities | 调 Tauri 原生能力时 |
| [rules/db.md](rules/db.md) | SQLite 操作规范、PRAGMA、参数绑定、时间格式、级联、导入校验 | 写数据库相关代码时 |
| [rules/style.md](rules/style.md) | Element Plus + 白色极简、Iconify 用法、布局规则 | 写界面/样式时 |
