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

## 参数绑定（防注入，硬约束 #3）

```ts
// ✅ 正确：参数绑定
await db.execute('INSERT INTO task (title, plan_date) VALUES ($1, $2)', [title, date])

// ❌ 禁止：字符串拼接
await db.execute(`INSERT INTO task (title) VALUES ('${title}')`)  // SQL 注入
```

- 占位符用 `$1, $2`（plugin-sql 走 sqlx）。
- 任何用户输入拼进 SQL 都必须走参数绑定，无例外。

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
