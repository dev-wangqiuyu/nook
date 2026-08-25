# Nook — 个人桌面单机应用 PRD

> 部分内容由豆包生成
> 
> 

## 文档修订记录

|版本|日期|修订内容|
|---|---|---|
|v1.1|2026-08-25|评审修订：① 建表 SQL 补 `PRAGMA foreign_keys = ON` 及 `journal_mode = WAL`；② `visualization`/`action_step`/`manifestation_log` 三张子表补 `FOREIGN KEY` 外键约束，使删除订单时级联删除真正生效；③ 数据库操作规范补"每次连接必须开外键""时间字段存本地时间""导入文件校验魔数头而非后缀""删除订单级联清理子记录"；④ 异常与边界表强化导入校验描述；⑤ 打包产物补 macOS Apple Silicon（aarch64）产物；⑥ 安装包体积预算调整（exe ≤30MB / dmg ≤40MB，含 Vditor）；⑦ 多实例问题标注 V1.1 引入 single-instance 插件并列入迭代规划|

# 文档概述

## 产品定位

Nook 是一款面向个人自用的桌面端单机管理工具，采用模块化架构，集成每日计划、随笔笔记、宇宙订单（吸引力法则）等功能模块。所有数据存储在本地 SQLite 数据库，不依赖网络、不连接后端服务器，支持整库导出/导入实现跨电脑数据迁移。整体设计风格极简、干净，以白色为主色调。

## 目标用户

开发者本人（单用户）。用于日常个人事务管理、知识记录、个人成长与精神实践。

## 核心目标

- 提供一个轻量、离线、隐私安全的个人管理桌面工具

- 模块化设计，支持后续按需扩展新功能模块

- 数据完全本地存储，支持手动备份与跨设备迁移

- 打包为独立安装包（Windows \.exe / macOS \.dmg），可在多台电脑安装使用

- 极简白色视觉风格，大道至简，内容本身为主角

## 术语定义

|术语|定义|
|---|---|
|Tauri|桌面客户端打包框架，使用 Rust \+ 系统 WebView，将前端页面打包为原生桌面应用|
|plugin\-sql|Tauri 官方 SQLite 数据库插件，前端通过 SQL 字符串操作本地数据库|
|宇宙订单|吸引力法则概念，将愿望包装为"向宇宙下的订单"，包含已下单、配送中、已签收、已取消四种状态|
|整库迁移|通过导出/导入 SQLite 数据库文件，将全部数据从一台电脑迁移到另一台电脑（全量覆盖）|
|Vditor|支持所见即所得/即时渲染/分屏三种模式切换的 Markdown 编辑器|

# 技术栈

## 整体技术选型

|层级|技术|说明|
|---|---|---|
|桌面框架|Tauri 2|客户端打包框架，Rust 底层，复用系统 WebView，体积小、内存低|
|前端框架|Vue 3 \+ Vite \+ TypeScript|与 UniApp 技术栈统一，减少上下文切换成本|
|UI 组件库|Element Plus|成熟稳定，组件丰富，中文文档友好，适合管理类界面|
|图标库|Iconify（@iconify/vue）|支持上万图标，按需加载，弥补 Element Plus 自带图标不足|
|富文本编辑器|Vditor|支持所见即所得/即时渲染/分屏三种模式切换，底层存 Markdown|
|状态管理|Pinia|Vue 3 官方推荐状态管理|
|工具函数库|VueUse|提供大量现成组合式函数|
|本地数据库|SQLite（通过 @tauri\-apps/plugin\-sql）|官方插件，手写 SQL，无 ORM|
|文件操作|Tauri 原生文件 API \+ dialog 插件|用于数据库导出/导入、文件选择对话框|
|系统托盘|Tauri 托盘 API|关闭窗口时最小化到系统托盘，后台保持运行|
|路由|Vue Router|模块间页面切换|

## 不使用的技术

- 不使用 Drizzle / Prisma 等 ORM（采用官方 plugin\-sql 手写 SQL）

- 不使用 Hono / Express 等服务端框架（纯单机，无 HTTP 服务）

- 不使用 MySQL / PostgreSQL（本地 SQLite 足够）

- 不使用任何云端服务、第三方登录、网络请求

- 不使用 Naive UI（已选定 Element Plus）

## 项目初始化命令

```bash
npm create tauri@latest nook -- --template vue-ts
cd nook
npm install
npm run tauri add sql
npm install element-plus @iconify/vue vditor pinia vue-router @vueuse/core
```

# 范围与非目标

## V1 版本范围（首期开发）

|模块|优先级|说明|
|---|---|---|
|每日计划/待办事项|P0|核心功能，任务增删改查、状态管理、今日视图、自定义标签|
|随笔/笔记|P0|核心功能，Vditor 编辑器、笔记增删改查、搜索、自定义标签|
|宇宙订单（吸引力法则）|P0|特色功能，订单管理、感恩记录、行动追踪、信号日记、已签收殿堂|
|标签管理|P0|用户自定义标签，待办和笔记支持多标签|
|数据备份迁移|P0|手动导出/导入数据库，跨电脑全量迁移|
|系统托盘|P0|关闭最小化到托盘，后台运行，托盘菜单快速操作|
|设置页|P0|数据库路径展示、主题、托盘设置、版本信息|
|仪表盘首页|P1|各模块数据概览卡片|
|全局搜索|P1|跨模块搜索任务、笔记、订单|

## V2 及后续迭代（暂不开发）

- 习惯打卡模块

- 日记/每日复盘模块

- 个人财务/记账模块

- 阅读记录/书单模块

- 健康记录模块

- 侧边栏折叠功能

- 数据统计图表

- 自动备份功能

## 明确不做（非目标）

- 不做网络连接、云端同步、多设备实时同步

- 不做多用户/账号系统，仅单用户本地使用

- 不做团队协作、分享功能

- 不做系统通知提醒（待办到点不弹窗）

- 不做复杂的重复周期任务（如每日重复提醒）

- 不做移动端（仅桌面端 Windows / macOS）

- 不做浏览器 Web 版本

- 不做自动备份（仅手动导出）

- 不做密码锁/加密（纯本地已足够隐私）

- 不做深色主题（全应用白色极简）

# 整体架构与布局设计

## 应用架构

采用经典的客户端本地架构，无服务端：

```text
┌─────────────────────────────────────┐
│         Vue 3 前端界面层             │
│  (页面组件 / Pinia状态 / Vue Router) │
├─────────────────────────────────────┤
│         Tauri IPC 通信层             │
│  (plugin-sql / dialog / fs / tray)  │
├─────────────────────────────────────┤
│         Rust 原生能力层              │
│  (SQLite驱动 / 文件系统 / 系统托盘)  │
├─────────────────────────────────────┤
│         本地数据存储层               │
│  (SQLite .db 文件，系统应用数据目录) │
└─────────────────────────────────────┘
```

## 界面布局

采用「左侧边栏导航 \+ 右侧内容区 \+ 顶部全局搜索」布局，全应用白色极简风格：

```text
┌──────────────────────────────────────────┐
│  🔍 全局搜索框（顶部）                    │
├───────┬──────────────────────────────────┤
│ 🏠    │                                  │
│ 首页  │                                  │
│ 📋    │         内容区域                  │
│ 待办  │    （当前选中模块的页面）          │
│ 📝    │                                  │
│ 笔记  │                                  │
│ 🌌    │                                  │
│ 订单  │                                  │
│       │                                  │
│ ───── │                                  │
│ ⚙️    │                                  │
│ 设置  │                                  │
└───────┴──────────────────────────────────┘
```

### 布局规则

- 左侧边栏固定宽度，纵向排列模块入口，每个入口包含图标 \+ 文字

- 第一个入口为「首页」仪表盘，展示各模块数据概览

- 设置入口放置在边栏底部，与功能模块用分隔线隔开

- 顶部搜索框支持跨模块全局搜索（V1 可选，V2 完善）

- 全应用统一白色/浅色主题，极简干净，无多余装饰

- 「宇宙订单」模块保持白色主题，通过卡片排版和文案营造仪式感，不使用深色背景

## 数据库文件存储位置

|操作系统|路径|说明|
|---|---|---|
|Windows|%APPDATA%\\com\.nook\.app\\nook\.db|如 C:\\Users\\用户名\\AppData\\Roaming\\com\.nook\.app\\nook\.db|
|macOS|\~/Library/Application Support/com\.nook\.app/nook\.db|Library 为隐藏目录，需通过「前往文件夹」访问|

卸载应用时，系统应用数据目录中的 SQLite 文件不会被自动删除，重装应用后数据保留。仅当用户手动删除该目录时数据才会丢失。

# 功能模块详细需求

## 模块一：每日计划/待办事项

### 用户场景

用户每天打开软件，查看今日待办任务，新增计划，标记完成情况，管理个人事务。

### 功能需求

|编号|需求|验收标准|
|---|---|---|
|T\-01|新增任务|可填写标题（必填）、描述、计划日期、优先级、截止时间、标签；保存后出现在对应日期的任务列表中|
|T\-02|任务状态管理|支持四种状态：待完成、进行中、已完成、已放弃；可随时切换状态|
|T\-03|任务优先级|支持三级优先级：普通、重要、紧急；列表中以颜色或标签区分|
|T\-04|今日视图|默认展示当天计划日期的所有任务，按优先级排序|
|T\-05|全部任务视图|展示所有任务，支持按状态、优先级、标签筛选|
|T\-06|编辑任务|可修改任务的所有字段，保存后即时更新|
|T\-07|删除任务|删除前弹出确认提示，确认后从数据库移除，同时清理标签关联|
|T\-08|快速标记完成|列表中点击复选框可直接将任务标记为已完成/取消完成|
|T\-09|标签筛选|可按一个或多个标签筛选任务列表|

### 数据字段

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|title|TEXT NOT NULL|任务标题|
|content|TEXT|详细描述|
|plan\_date|TEXT|计划日期（YYYY\-MM\-DD）|
|deadline|TEXT|截止时间，可为空|
|status|INTEGER DEFAULT 0|0待完成 1进行中 2已完成 3已放弃|
|priority|INTEGER DEFAULT 0|0普通 1重要 2紧急|
|created\_at|TEXT|创建时间|
|updated\_at|TEXT|更新时间|

## 模块二：随笔/笔记

### 用户场景

用户随手记录想法、摘抄、学习笔记，无需切换到其他软件，支持快速搜索历史笔记。

### 功能需求

|编号|需求|验收标准|
|---|---|---|
|N\-01|新建笔记|可填写标题（可选，无标题时以内容前若干字为默认标题）、正文、标签；使用 Vditor 编辑器，支持所见即所得/即时渲染/分屏三种模式切换；保存后按时间倒序展示|
|N\-02|编辑笔记|点击笔记进入编辑，Vditor 加载原有 Markdown 内容，修改后保存即时更新|
|N\-03|删除笔记|删除前确认，确认后移除，同时清理标签关联|
|N\-04|笔记列表|按创建时间倒序排列，展示标题、内容摘要、创建时间、标签|
|N\-05|关键词搜索|在搜索框输入关键词，实时过滤标题和正文中包含关键词的笔记|
|N\-06|标签筛选|可按一个或多个标签筛选笔记列表|
|N\-07|编辑器模式切换|编辑页可一键切换所见即所得、即时渲染、分屏预览三种模式，偏好本地保存|

### 数据字段

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|title|TEXT|笔记标题，可为空|
|content|TEXT|笔记正文（Markdown 格式）|
|created\_at|TEXT|创建时间|
|updated\_at|TEXT|更新时间|

## 模块三：宇宙订单（吸引力法则）

### 用户场景

用户将想要显化的愿望作为"订单"提交给宇宙，通过每日感恩、视觉化、行动追踪和信号记录，实践吸引力法则，见证订单从"已下单"到"已签收"的全过程。所有内容为个人隐私，仅本地存储。

### 子功能：我的宇宙订单

|编号|需求|验收标准|
|---|---|---|
|O\-01|提交订单（许愿）|填写订单标题（必填）、详细描述（引导用现在时、肯定句书写，仿佛已实现）、目标日期（可选）；提交后生成一张"宇宙订单"卡片，状态为"已下单"|
|O\-02|订单状态|四种状态：已下单（0）、配送中（1）、已签收（2）、已取消（3）；可手动切换，切换到"已签收"时记录签收时间|
|O\-03|订单列表|按状态分组展示，已下单排在最前，配送中次之，已签收进入"已签收殿堂"，已取消置底|
|O\-04|订单详情|点击订单进入详情页，展示描述、关联的视觉化记录、行动脚印、信号日记|
|O\-05|确认签收|将订单状态改为"已签收"时，记录签收时间，自动进入"已签收殿堂"|
|O\-06|已签收殿堂|独立页面展示所有已签收的订单，可查看每个订单的显化复盘|
|O\-07|取消订单|将订单状态改为"已取消"，需确认，取消后不再出现在活跃列表|

### 子功能：每日感恩

|编号|需求|验收标准|
|---|---|---|
|G\-01|记录感恩|每天可记录多条感恩内容，填写文字后保存|
|G\-02|感恩历史|按日期倒序查看历史感恩记录|

### 子功能：视觉化/感受记录

|编号|需求|验收标准|
|---|---|---|
|V\-01|添加视觉化记录|关联到具体订单，文字描述"已经拥有该愿望时的感受、看到的画面、听到的声音"|
|V\-02|查看视觉化记录|在订单详情页展示该订单的所有视觉化记录，按时间倒序|

### 子功能：行动脚印

|编号|需求|验收标准|
|---|---|---|
|A\-01|记录行动|关联到具体订单，填写为该订单采取的具体行动和行动日期|
|A\-02|行动时间线|在订单详情页以时间线形式展示所有行动脚印|

### 子功能：信号日记

|编号|需求|验收标准|
|---|---|---|
|M\-01|记录信号|可关联到具体订单（也可为通用灵感），记录过程中的巧合、灵感、进展、信号|
|M\-02|信号时间线|在订单详情页展示关联的信号记录，按时间倒序|

### 数据字段

订单表（cosmic\_order）：

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键（即订单号）|
|title|TEXT NOT NULL|订单标题（愿望）|
|description|TEXT|现在时描述（已实现的状态）|
|target\_date|TEXT|目标日期，可为空|
|status|INTEGER DEFAULT 0|0已下单 1配送中 2已签收 3已取消|
|created\_at|TEXT|下单时间|
|delivered\_at|TEXT|签收时间，状态改为已签收时记录|

感恩记录表（gratitude）：

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|content|TEXT NOT NULL|感恩内容|
|record\_date|TEXT|记录日期|
|created\_at|TEXT|创建时间|

视觉化记录表（visualization）：

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|order\_id|INTEGER|关联订单 ID|
|feeling|TEXT|已经拥有的感受描述|
|created\_at|TEXT|创建时间|

行动脚印表（action\_step）：

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|order\_id|INTEGER|关联订单 ID|
|content|TEXT NOT NULL|具体行动内容|
|action\_date|TEXT|行动日期|
|created\_at|TEXT|创建时间|

信号日记表（manifestation\_log）：

|字段|类型|说明|
|---|---|---|
|id|INTEGER PK|自增主键|
|order\_id|INTEGER|关联订单 ID，可为空（通用灵感）|
|content|TEXT NOT NULL|信号/巧合/进展内容|
|log\_date|TEXT|记录日期|
|created\_at|TEXT|创建时间|

## 基础功能：标签管理

### 用户场景

用户创建自定义标签（如"工作""生活""学习""显化相关"），给待办和笔记打标签，方便按标签筛选和组织内容。

### 功能需求

|编号|需求|验收标准|
|---|---|---|
|TG\-01|创建标签|输入标签名称（唯一），创建后可在待办和笔记中选用|
|TG\-02|编辑标签|可修改标签名称，修改后所有关联内容同步更新|
|TG\-03|删除标签|删除前确认，删除后同时清理所有关联记录|
|TG\-04|打标签|待办和笔记支持选择一个或多个标签|
|TG\-05|标签列表|侧边栏「标签」一级导航页展示所有标签及关联数量|

## 基础功能：数据备份迁移

### 用户场景

用户更换新电脑时，从旧电脑导出整个 SQLite 数据库文件，拷贝到新电脑后导入，实现全部数据的全量迁移。仅手动操作，不做自动备份。

### 功能需求

|编号|需求|验收标准|
|---|---|---|
|B\-01|导出数据库|点击「导出备份」按钮，弹出系统保存文件对话框，用户选择保存位置后，将应用数据目录中的 nook\.db 复制到目标位置|
|B\-02|导入数据库|点击「导入恢复」按钮，弹出系统文件选择对话框，用户选择外部 \.db 文件后：先关闭当前数据库连接，再将选中文件覆盖到应用数据目录，最后弹出提示「导入成功，请重启软件」|
|B\-03|导入确认|导入前弹出确认提示，告知用户「导入将覆盖当前所有数据，是否继续」|

导入操作为全量覆盖，目标电脑原有数据将被完全替换。本设计面向「新电脑空库导入旧数据」场景，不支持数据合并。

### 操作流程

1. 旧电脑：打开软件 → 设置页 → 点击「导出备份」→ 选择保存位置（如桌面）→ 得到 nook\.db 文件

2. 通过 U 盘/网盘将 nook\.db 拷贝到新电脑

3. 新电脑：安装并打开软件（空数据库）→ 设置页 → 点击「导入恢复」→ 选择拷贝过来的 nook\.db → 确认覆盖

4. 按提示重启软件，旧电脑全部数据恢复完成

## 基础功能：系统托盘

### 用户场景

用户关闭软件窗口时，不退出程序，而是最小化到系统托盘后台运行，需要时快速唤起，无需等待冷启动。

### 功能需求

|编号|需求|验收标准|
|---|---|---|
|TR\-01|关闭最小化到托盘|点击窗口关闭按钮时，窗口隐藏，程序在系统托盘显示图标，后台继续运行|
|TR\-02|托盘菜单|右键托盘图标显示菜单：打开主窗口、新建待办、新建笔记、退出|
|TR\-03|点击托盘图标|左键单击托盘图标显示/隐藏主窗口|
|TR\-04|完全退出|通过托盘菜单「退出」完全关闭程序|

## 基础功能：设置页

|编号|需求|验收标准|
|---|---|---|
|S\-01|数据库路径展示|显示当前 SQLite 数据库文件的完整绝对路径，提供「复制」按钮|
|S\-02|主题设置|白色极简主题（默认且唯一），展示主题说明|
|S\-03|托盘设置|开关「关闭时最小化到托盘」，默认开启|
|S\-04|导出备份入口|设置页中放置「导出备份」按钮|
|S\-05|导入恢复入口|设置页中放置「导入恢复」按钮|
|S\-06|标签管理入口|侧边栏「标签」一级导航页管理标签，可增删改（偏离原设置页方案，用户决策升级为一等模块）|
|S\-07|关于信息|展示软件名称 Nook、版本号、技术栈信息|

## 基础功能：仪表盘首页（P1）

|编号|需求|验收标准|
|---|---|---|
|D\-01|数据概览卡片|首页以卡片形式展示：今日待办数量、笔记总数、进行中的订单数、今日感恩条数|
|D\-02|卡片点击跳转|点击概览卡片直接跳转到对应模块页面|
|D\-03|今日待办预览|首页展示今日待办任务列表（最多5条），可直接标记完成|

# 数据库设计

## 建表 SQL（程序启动时执行）

```sql
-- 连接初始化（每次打开数据库连接后立即执行，确保外键级联生效）
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 任务表
CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  plan_date TEXT,
  deadline TEXT,
  status INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- 笔记表
CREATE TABLE IF NOT EXISTS note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 标签表
CREATE TABLE IF NOT EXISTS tag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT
);

-- 任务标签关联表
CREATE TABLE IF NOT EXISTS task_tag (
  task_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

-- 笔记标签关联表
CREATE TABLE IF NOT EXISTS note_tag (
  note_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES note(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

-- 宇宙订单表
CREATE TABLE IF NOT EXISTS cosmic_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT,
  delivered_at TEXT
);

-- 感恩记录表
CREATE TABLE IF NOT EXISTS gratitude (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  record_date TEXT,
  created_at TEXT
);

-- 视觉化记录表
CREATE TABLE IF NOT EXISTS visualization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  feeling TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);

-- 行动脚印表
CREATE TABLE IF NOT EXISTS action_step (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  action_date TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);

-- 信号日记表（order_id 可为空，用于通用灵感，不强制关联订单）
CREATE TABLE IF NOT EXISTS manifestation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  content TEXT NOT NULL,
  log_date TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);

-- 应用设置表
CREATE TABLE IF NOT EXISTS app_setting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  value TEXT
);
```

## 数据库操作规范

- **每次打开数据库连接后必须立即执行 `PRAGMA foreign_keys = ON;`**——SQLite 默认关闭外键约束，不显式开启则所有 `ON DELETE CASCADE` 均不生效（级联删除将形同虚设）。建议同时执行 `PRAGMA journal_mode = WAL;` 提升并发读性能

- 所有 SQL 操作使用参数绑定（SQLite 用 $1, $2 占位符），禁止字符串拼接，防止 SQL 注入

- 时间字段统一使用 ISO 8601 格式字符串，**存本地时间**（不上云、不跨时区同步，存 UTC 反而徒增转换）：`YYYY-MM-DD HH:mm:ss`

- 程序启动时统一执行 CREATE TABLE IF NOT EXISTS，新增模块表不影响旧数据

- 导入数据库前必须调用 db\.close\(\) 关闭连接，否则文件被占用无法覆盖

- **导入文件校验**：不能仅校验后缀，必须读取文件前 16 字节验证魔数头为 `"SQLite format 3\0"`，否则提示「所选文件不是有效的数据库」

- 删除任务/笔记时级联删除关联的 task\_tag / note\_tag 记录

- 删除标签时级联删除所有关联记录

- 删除宇宙订单时级联删除关联的 visualization / action\_step / manifestation\_log 记录（依赖 PRAGMA foreign\_keys = ON 与上述子表外键约束）

# 异常与边界情况

|场景|处理方式|
|---|---|
|导入时数据库文件被占用|必须先执行 db\.close\(\) 关闭连接，再执行文件覆盖；若仍失败，提示用户关闭软件后手动替换|
|导入的文件不是有效的 SQLite 数据库|**导入前读取文件前 16 字节校验魔数头 `"SQLite format 3\0"`**，非法文件直接拦截并提示，不进入覆盖流程；后缀 \.db 仅作初筛参考|
|导出时目标路径无写入权限|捕获文件系统错误，弹出提示「无法写入到该位置，请选择其他目录」|
|删除有关联数据的订单|删除订单时，级联删除关联的 visualization、action\_step、manifestation\_log 记录|
|软件运行中系统应用数据目录被手动删除|下次启动时 plugin\-sql 会自动创建新的空数据库，数据丢失不可恢复（用户需自行备份）|
|同一台电脑同时打开多个软件实例|SQLite 多进程并发写入会触发 `database is locked` 锁等待，用户误开两实例时偶发卡顿。**V1 暂不做单实例限制**；**V1.1 引入 Tauri `single-instance` 插件**，启动时检测已有实例并聚焦主窗口，避免重复打开|
|标签名重复|创建标签时校验唯一性，重复时提示「标签已存在」|
|托盘图标在某些 Linux 桌面不显示|仅支持 Windows 和 macOS，Linux 不做保证|

# 质量约束

|约束项|标准|
|---|---|
|离线可用|所有功能在无网络环境下完整可用，不发起任何网络请求|
|数据隐私|所有数据仅存储在本地，不上传、不同步、不收集|
|启动速度|冷启动到界面可交互不超过 3 秒（普通配置电脑）|
|安装包体积|Windows \.exe 不超过 30MB，macOS \.dmg 不超过 40MB（含 Vditor、Element Plus 等前端依赖；Vditor 本体较大，预算相应放宽）|
|数据安全|删除操作均需二次确认；导入操作需确认覆盖|
|兼容性|支持 Windows 10/11（需 WebView2）、macOS 11\+|
|视觉风格|全应用白色极简，无多余装饰，内容为主角|

# 打包与分发

## 打包命令

```bash
# 开发调试
npm run tauri dev

# 生产打包
npm run tauri build
```

## 打包产物

|平台|产物|安装方式|
|---|---|---|
|Windows|Nook\_x\.x\.x\_x64\-setup\.exe（NSIS）|双击运行安装向导|
|macOS（Apple Silicon）|Nook\_x\.x\.x\_aarch64\.dmg|打开后将 Nook\.app 拖入 Applications 文件夹|
|macOS（Intel）|Nook\_x\.x\.x\_x64\.dmg|同上；如需单一产物可改打 universal binary（aarch64\+x64）|

> 注：开发机为 Apple Silicon（arm64），务必产出 aarch64 产物；Intel 机型可选配。Tauri 默认按当前机器架构出包，跨架构需在 `tauri.conf.json` 或命令行指定 target。

## 分发方式

- 个人使用，通过 U 盘/网盘拷贝安装包到其他电脑即可

- 不需要代码签名（个人使用可跳过，macOS 需右键打开绕过公证）

- 不需要上架应用商店

# 迭代规划

|版本|包含内容|目标|
|---|---|---|
|V1\.0|待办事项、随笔笔记、宇宙订单、标签管理、数据备份迁移、系统托盘、设置页、基础布局|最小可用版本，核心功能完整可日常使用|
|V1\.1|仪表盘首页、全局搜索、单实例锁（single-instance 插件）|提升使用效率、信息概览能力与稳定性|
|V2\.0|习惯打卡模块、日记复盘模块、自动备份|扩展个人成长管理能力|
|V2\.1\+|记账、阅读记录、健康记录、侧边栏折叠、数据统计图表|按需扩展，持续完善|

# 依赖与开放问题

## 外部依赖

- Tauri 2 官方插件 @tauri\-apps/plugin\-sql（SQLite 支持）

- Tauri 2 官方插件 @tauri\-apps/plugin\-dialog（文件选择/保存对话框）

- Tauri 2 官方插件 @tauri\-apps/plugin\-fs（文件系统操作，用于导出导入）

- Tauri 2 托盘 API（系统托盘功能）

- Vue 3 生态：Vue Router、Pinia、Element Plus、Iconify、Vditor、VueUse

## 已确认决策

|编号|问题|决策|
|---|---|---|
|D\-01|UI 组件库选择|Element Plus|
|D\-02|笔记编辑器类型|Vditor，支持所见即所得/即时渲染/分屏三种模式，底层存 Markdown|
|D\-03|应用名称与 bundle identifier|Nook / com\.nook\.app|
|D\-04|待办系统通知提醒|不需要|
|D\-05|视觉风格|全应用白色极简，无深色主题|
|D\-06|分类标签|需要，用户自定义多标签，待办和笔记均支持|
|D\-07|待办状态与优先级|保持 4 种状态 \+ 3 级优先级|
|D\-08|自动备份|不需要，仅手动导出导入|
|D\-09|关闭窗口行为|最小化到系统托盘，后台运行|
|D\-10|显化模块密码锁|不需要|
|D\-11|显化模块形式|重构为「宇宙订单」，状态为已下单/配送中/已签收/已取消|
|D\-12|图标库|Iconify（@iconify/vue）|

## 开放问题

|编号|问题|状态|
|---|---|---|
|Q\-01|是否需要开机自启？|待确认，V1 可暂不做|
|Q\-02|是否需要全局快捷键（如 Ctrl\+Alt\+N 快速新建笔记）？|待确认，V1 可暂不做|
|Q\-03|宇宙订单是否需要生成订单号（如 NOOK\-2026\-0001）？|待确认，当前用自增 ID 作为订单号|

> （注：部分内容可能由 AI 生成）
