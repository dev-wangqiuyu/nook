# Nook

> 个人桌面单机管理工具——每日计划/待办、随笔笔记、宇宙订单（吸引力法则）。纯本地、离线、无后端，数据存本地 SQLite，白色极简风格。

## 功能

- **每日计划/待办**——任务增删改查、4 状态（待完成/进行中/已完成/已放弃）、3 级优先级、今日视图、标签筛选
- **随笔笔记**——Vditor 编辑器三模式（所见即所得/即时渲染/分屏）、关键词搜索、标签
- **宇宙订单**——吸引力法则实践：订单管理（已下单/配送中/已签收/已取消）、每日感恩、视觉化记录、行动脚印、信号日记、已签收殿堂
- **标签管理**——自定义多标签，待办与笔记共用
- **数据备份迁移**——手动导出/导入整个 SQLite 文件，跨电脑全量迁移
- **系统托盘**——关闭最小化到托盘，后台运行

完整需求见 [PRD产品需求文档.md](PRD产品需求文档.md)。

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2（Rust + 系统 WebView） |
| 前端 | Vue 3 + Vite + TypeScript |
| UI | Element Plus + Iconify |
| 编辑器 | Vditor（Markdown） |
| 状态/路由 | Pinia + Vue Router |
| 数据库 | 本地 SQLite（@tauri-apps/plugin-sql，手写 SQL，无 ORM） |

## 快速开始

```bash
pnpm install            # 安装依赖（强制 pnpm）
pnpm tauri dev          # 启动开发
pnpm tauri build        # 生产打包
```

> 需要 Rust 工具链（`rustup`）与系统 WebView（macOS 自带；Windows 需 WebView2）。

## 数据存储

所有数据存本地 SQLite，无网络、无云端、无后端：

| 操作系统 | 路径 |
|---|---|
| macOS | `~/Library/Application Support/com.nook.app/nook.db` |
| Windows | `%APPDATA%\com.nook.app\nook.db` |

## License

MIT
