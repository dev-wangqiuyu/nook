# dev 环境 SQLite 数据目录

仅 `tauri dev` 运行时使用——数据库文件 `nook.db` / `nook.db-wal` / `nook.db-shm` 落在此目录，**不提交 git**（见根 `.gitignore`）。

打包后（`tauri build`）数据库走 `app_config_dir`（`~/Library/Application Support/com.nook.app/`），与本目录无关。

dev 与 prod 是**两套独立数据库**，靠 feat-008 手动导入/导出同步（PRD 设计如此，非自动同步）。
