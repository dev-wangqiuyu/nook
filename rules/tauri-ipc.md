# 规则：Tauri IPC 与原生能力

> 调 Tauri 原生能力时读。Nook 用 plugin-sql / plugin-dialog / plugin-fs / 托盘 API。

## plugin-sql（SQLite）

- **初始化**：`@tauri-apps/plugin-sql` 的 `Database.load("sqlite:app.db")` 返回连接。**每次拿到连接后立即执行 `PRAGMA foreign_keys = ON;` + `PRAGMA journal_mode = WAL;`**（见 [db.md](db.md)），否则级联删除不生效。
- **执行 SQL**：`db.execute(sql, params)` / `db.select(sql, params)`。params 用 `$1, $2` 占位符（plugin-sql 走 sqlx，Postgres 风格占位）。
- **封装**：所有 SQL 调用集中在 `src/api/db.ts` 或 `src/api/<module>.ts`，组件不裸写 SQL。

## plugin-dialog（文件选择/保存）

- `open()` 选文件（导入恢复用），`save()` 选保存位置（导出备份用）。
- 配套 plugin-fs 读写文件。

## plugin-fs（文件系统）

- 导出备份：读 app.db 所在路径 → 写到 dialog.save() 选的目标位置。
- 导入恢复：先 `db.close()` 关连接 → 用 fs 覆盖 app.db → 提示重启。
- **导入前校验魔数头**：读文件前 16 字节，验证为 `"SQLite format 3\0"`，否则拒绝（见 [db.md](db.md)）。

## 托盘 API

- `tauri::tray::TrayIconBuilder`（Rust 侧，feat-009）。
- 关闭窗口最小化到托盘：监听窗口关闭事件，拦截改为 hide。
- capabilities 需声明相关权限。

## capabilities（权限声明）

- `src-tauri/capabilities/` 下声明插件权限。每引入一个 Tauri 插件，对应 capabilities 要加，否则前端调用被拒。
- feat-001 装 plugin-sql/dialog/fs 时同步配 capabilities。

## Rust 命令（#[tauri::command]）

- 仅当必须下沉到 Rust 时写（如托盘逻辑、复杂数据库初始化、平台特定操作）。
- 简单 CRUD **不**写 Rust 命令，前端直接 plugin-sql 跑 SQL。
- 命令注册在 `lib.rs` 的 `.invoke_handler(tauri::generate_handler![...])`。

## invoke 封装

- 前端调 Rust 命令统一 `import { invoke } from '@tauri-apps/api/core'`，在 `src/api/` 封装，组件不直接 invoke。
