# 规则：数据库（SQLite）

> 写数据库相关代码时必读。Nook 用 @tauri-apps/plugin-sql 手写 SQL，无 ORM。完整建表 SQL 见 [PRD](../PRD产品需求文档.md)「数据库设计」段（已评审修订到 v1.1）。

## 连接初始化（每次拿到连接后必做）

```ts
const db = await Database.load('sqlite:nook.db')
await db.execute('PRAGMA foreign_keys = ON;')      // 必做！否则级联全失效
await db.execute('PRAGMA journal_mode = WAL;')     // 提升并发读
// 然后执行全部 CREATE TABLE IF NOT EXISTS
```

> ⚠️ SQLite **默认 `foreign_keys = OFF`**。不显式开，所有 `ON DELETE CASCADE` 都是摆设，删订单/任务/笔记时关联子表会留孤儿数据。这是硬约束 #5。

## 权限（capabilities，feat-003 踩坑）

`src-tauri/capabilities/default.json` 的 `sql:default` **只授权 `load` / `select` / `close`，不含 `execute`**。所有 `db.execute()`（PRAGMA、CREATE TABLE、INSERT/UPDATE/DELETE）会被运行时拒：`sql.execute not allowed. Permissions: sql:allow-execute`，错误被吞到 ElMessage 表现为"建表没生效"。

必须显式加 `sql:allow-execute`：

```jsonc
"permissions": [
  "sql:default",
  "sql:allow-execute"   // 必加！default 不含 execute
]
```

改 capabilities 后需重新编译 Rust（tauri 重建 ACL）。

## dev/prod 数据库分离（feat-003 收尾）

dev 与 prod 是**两套独立数据库**，靠 feat-008 手动导入/导出同步（PRD 设计如此，非自动同步）。

| 环境 | 库路径 | 由谁决定 |
|---|---|---|
| `tauri dev` | `<项目根>/db/nook.db` | `vite.config.ts` define `__DEV_DB_PATH__` 注入绝对路径 |
| `tauri build`（打包） | `app_config_dir/nook.db`（`~/Library/Application Support/com.nook.app/`） | plugin-sql 默认（相对名 → 拼 app_config_dir） |

实现：`src/api/db.ts` 按 `import.meta.env.DEV` 选 URL——dev 传绝对路径（plugin-sql `PathBuf::push` 对绝对路径整体替换，覆盖默认 app_config_dir），prod 传相对名 `sqlite:nook.db` 落 app_config_dir。

- `db/` 目录被 git 跟踪（含 `.gitkeep` + `README.md`），但 `db/*.db` / `*.db-wal` / `*.db-shm` 在根 `.gitignore` 忽略——dev 数据不进 git。
- Navicat 连 dev 库用绝对路径：`<项目根>/db/nook.db`；连 prod 库用 `~/Library/Application Support/com.nook.app/nook.db`（Navicat 不展开 `~`，须填完整绝对路径，否则报 SQLite error 14）。
- 打包产物不含 `db/` 目录，prod 走 app_config_dir，二者天然隔离。

## 参数绑定（防注入，硬约束 #3）

```ts
// ✅ 正确：参数绑定
await db.execute('INSERT INTO task (title, plan_date) VALUES ($1, $2)', [title, date])

// ❌ 禁止：字符串拼接
await db.execute(`INSERT INTO task (title) VALUES ('${title}')`)  // SQL 注入
```

- 占位符用 `$1, $2`（plugin-sql 走 sqlx）。
- 任何用户输入拼进 SQL 都必须走参数绑定，无例外。

## SQL 注释规范（硬约束 #18）

每条 `query`/`run` 的 SQL 必须写清楚注释，便于团队（含未来 agent）学习查阅与排查。注释模板：

```ts
// 业务：<这条 SQL 解决什么问题>
// SQL 要点：
// 1. <子句作用：为什么用 LEFT JOIN / WHERE 条件 / GROUP BY / ORDER BY>
// 2. <$1/$2 参数含义>
// 3. <边界/注意：如 rowsAffected 判定、空值处理>
const rows = await query<Tag>(`
  SELECT ...
  FROM ...
  LEFT JOIN ...  -- 左连接保行，即使无关联也返回
  WHERE id = $1  -- $1 = 标签 id
  GROUP BY ...
`);
```

要点：
- **业务意图**：这条 SQL 为什么存在，回答"做什么"。
- **关键子句**：JOIN 类型（LEFT 保行 / INNER 过滤）、WHERE 条件、GROUP BY 分组、ORDER BY 排序——每个非常规子句说清为什么这么写。
- **参数含义**：`$1`/`$2` 分别对应什么业务字段，不让人猜。
- **边界**：`rowsAffected === 0` 判定、空数组、`?? null` 处理等。
- 简单到一目了然的单行 SQL（如 `SELECT * FROM app_setting`）可只写一行业务注释，不必过度。
- 参考实现：`src/api/tag.ts`（每条 SQL 都带完整注释）。

## 时间字段

- 统一 ISO 8601 字符串，**存本地时间**（不上云、不跨时区，存 UTC 反而徒增转换）：`YYYY-MM-DD HH:mm:ss`。
- `created_at` / `updated_at` 写入时取本地时间格式化。

## 级联删除（硬约束 #6）

- 删除订单/任务/笔记时，**不手写 `DELETE FROM task_tag WHERE task_id = ?`**，靠外键 `ON DELETE CASCADE` 自动级联。
- 前提：① 子表声明了 `FOREIGN KEY ... ON DELETE CASCADE`（PRD v1.1 已补全 visualization/action_step/manifestation_log 三表的 FK）；② 连接开了 `PRAGMA foreign_keys = ON`。
- 删除前仍弹二次确认（PRD 要求）。

## 导入文件校验（硬约束，PRD v1.1）

```ts
// 读文件前 16 字节，验证 SQLite 魔数头
const header = await readFileHeader(filePath, 16)  // 通过 plugin-fs
const isSQLite = header === 'SQLite format 3\0'
if (!isSQLite) throw new Error('所选文件不是有效的数据库')
```

- 不能仅校验后缀 `.db`（可随便改）。必须验魔数头。

## 导入流程（B-02）

1. 弹确认提示「导入将覆盖当前所有数据」
2. 用户确认后 `await db.close()` 关连接（否则文件被占用）
3. 校验选中文件魔数头
4. 用 plugin-fs 覆盖 nook.db 到应用数据目录
5. 提示「导入成功，请重启软件」

## 表结构

完整 11 张表（task / note / tag / task_tag / note_tag / cosmic_order / gratitude / visualization / action_step / manifestation_log / app_setting）的建表 SQL 在 PRD「数据库设计」段，程序启动时统一 `CREATE TABLE IF NOT EXISTS` 执行。

## Schema 演进

- V1 用 `CREATE TABLE IF NOT EXISTS`，新增表不影响旧数据。
- V2 加字段时 `IF NOT EXISTS` 不改已存在表，届时需 `ALTER TABLE` 或简易迁移机制（当前不做，记一笔）。
