# CLAUDE.md — Nook 项目规则入口

> Nook（`~/Desktop/nook`）——Tauri 2 + Vue 3 + Element Plus + SQLite 个人桌面单机应用。完整规范在 [AGENTS.md](AGENTS.md)（harness 工作流 / 14 条硬约束 / 专题路由）+ `rules/` 专题文档（用时才读）。完整需求见 [PRD产品需求文档.md](PRD产品需求文档.md)。
> 参与本项目的 agent 不一定是 Claude、优先读的指令文件也不同——故本文件**自包含**下面最易被忽视的规则，不靠转发到 AGENTS.md。

## 强制记录（每次改动后必做，缺一 = 改动未完成）

任何代码 / 规则 / 文档改动完成后，**立即**（不等会话结束）：

1. 追加 `logs/YYYY-MM-DD.md`（当天日期）：改了什么 / 为什么 / 验证结果。同一天多次改动追加到同一文件。
2. 更新 `progress.md`——「当前已验证状态」段核对仓库状态/最高优先级未完成/blocker 是否仍准确，「会话记录」段追加当日条目记本轮目标/已完成（含改动文件）/验证命令与结果/提交记录/已知风险/下一步。
3. 完成 feature 时更新 `feature_list.json` 的 status。

**未完成上述记录 = 改动未完成**（Definition of Done 强制项）。机械门禁：`bash scripts/check-records.sh`（挂进 `init.sh`）比对代码与 `progress.md` / 当日 `logs/` 的 mtime + 内容，改了代码不碰记录会判红。详见 AGENTS.md「强制记录」。

## 每次会话必做

1. 完整阅读根目录 [AGENTS.md](AGENTS.md)（行为准则 / 硬约束 / 专题路由）。
2. 动手写代码前，读 `rules/` 中本次任务相关的专题（project-structure / tauri-ipc / db / style）。
3. 写完代码执行 `pnpm build` + `cd src-tauri && cargo check`，不报错才算完成。
