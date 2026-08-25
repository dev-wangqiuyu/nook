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

## JOIN 速查（JOIN 全家桶，面试 + 日常速记）

> 学习资料段。Nook 实际用到的是 LEFT JOIN（见 `src/api/tag.ts` 的 `listTags`）。本段整理 JOIN 全类型对照与左右表区分法，供面试与日常查阅。

### JOIN 两大类

- **内连接 INNER JOIN**：只保留两表都匹配（能对上 ON 条件）的行。哪边没匹配都丢掉。写 `JOIN` 默认就是 INNER。
- **外连接 OUTER JOIN**：除匹配行外，还**保留**其中一张或两张表的全部行，没匹配的列填 NULL。左连接 / 右连接 / 全连接都属于外连接。`OUTER` 可省略，`LEFT JOIN` ≡ `LEFT OUTER JOIN`。
- 一句话：**INNER 丢不匹配的行，OUTER 用 NULL 把不匹配的行也留住。**

### JOIN 全类型对照表

| 类型 | 保留谁 | 不匹配时 | 典型场景 | 实际用量 |
|---|---|---|---|---|
| INNER JOIN | 两表都匹配的行 | 丢掉 | "有订单的用户""交集" | ★★★ 最常用 |
| LEFT JOIN | 左表全部行 | 右表填 NULL | "全部用户+订单（含无单）" | ★★★ 最常用 |
| RIGHT JOIN | 右表全部行 | 左表填 NULL | 同 LEFT（换位即可） | ★ 几乎不用 |
| FULL JOIN | 两表都全部 | 对侧填 NULL | 两边孤儿都要看 | ★ 极少用（SQLite 3.39+） |
| CROSS JOIN | 全排列 m×n | — | 生成规格组合表 | ★★ 看场景 |
| SELF JOIN | 自己连自己 | 取决于配的 JOIN | 树形/层级（上级-下级） | ★★ 看场景 |
| NATURAL JOIN | 同名列自动等值 | — | —— | ☆ 别用，易错 |

### INNER JOIN（内连接）

只留两表都匹配的行（取两表**交集**）：

```sql
SELECT u.name, o.goods
FROM user u INNER JOIN order o ON o.uid = u.id
-- 等价（JOIN 默认就是 INNER）：
FROM user u JOIN order o ON o.uid = u.id
```
- 张三有订单 → 保留；李四有订单 → 保留；王五无订单 → **丢掉**。
- 跟 LEFT JOIN 的区别：LEFT 会用 NULL 把王五也留住，INNER 直接丢。

### 外连接三种方向

- **LEFT [OUTER] JOIN**：保左表全部，右表没匹配填 NULL。做"列表 + 顺便统计关联"最常用。
- **RIGHT [OUTER] JOIN**：保右表全部，左表没匹配填 NULL。和 LEFT 完全对称，换表位置即等价，故几乎不用（很多规范禁用，老 SQLite 3.39 前不支持）。
- **FULL [OUTER] JOIN**：左右两表都全保，没匹配那侧填 NULL。极少用，SQLite 3.39+ 才支持。

### CROSS JOIN（交叉连接，笛卡尔积）

**不写 ON 条件**，把左表每行与右表每行两两配对——A 有 m 行、B 有 n 行，结果 m×n 行：

```sql
SELECT * FROM color CROSS JOIN size   -- 3 颜色 × 4 尺寸 = 12 行组合
```
- 用来生成"全排列组合"（如颜色×尺码的规格表）。
- ⚠️ INNER JOIN 写 `ON 1=1`（永远真）退化成 CROSS JOIN；手滑漏写 ON 条件时 MySQL 自动按 CROSS 处理，结果行数爆炸——常见性能事故。

### SELF JOIN（自连接）

**一张表跟自己连接**，用不同别名区分两份。本质不是新 JOIN 类型，而是"自己连自己"的用法，通常配 INNER/LEFT：

```sql
SELECT e.name AS 员工, m.name AS 上级
FROM employee e LEFT JOIN employee m ON e.manager_id = m.id
--      ^                      ^
--   员工那一份              上级那一份（同一张表，两个别名）
```
- 处理表里有"自引用"的树形结构：分类的 parent_id、评论的 parent_id、员工的 manager_id。

### NATURAL JOIN（自然连接）

**自动**按两表**同名列**做等值连接，不用写 ON：

```sql
SELECT * FROM user NATURAL JOIN user_profile
-- 自动找两表都有的列（如 user_id）作为 ON user.user_id = user_profile.user_id
```
- ⚠️ 看着省事但**很危险**：按"列名相同"自动配对，要是两表碰巧都有 `id` 列，会拿 `user.id = user_profile.id` 连，语义完全错。
- 实际工程**几乎不用**，出 bug 难查；显式写 `ON` 才可控。

### 如何区分左表 / 右表——看写的位置，与表本身无关

```sql
SELECT ... FROM A JOIN B ON ...
--              ^       ^
--            左表     右表
```
- 紧跟 `FROM` 后的 `A` = **左表**（通常是要全部保留的主表）
- 紧跟 `JOIN` 后的 `B` = **右表**（附带匹配信息的表）
- 口诀：**要保哪张表的全部行，就把那张写左边**；`LEFT JOIN` → 保左边。

### 等价互换

`A LEFT JOIN B` ≡ `B RIGHT JOIN A`（两张表换位置即可）。

### 举例（user 左、order 右，王五无订单）

- `FROM user u LEFT JOIN order o ON o.uid=u.id` → 张三/手机、李四/书、王五/NULL（保留没下单用户）
- `FROM user u INNER JOIN order o ON o.uid=u.id` → 张三/手机、李四/书（丢掉王五）
- `FROM user u RIGHT JOIN order o ON o.uid=u.id` → 保留右表 order 全部行（本例无孤儿行，结果同 INNER）

### 为什么实际开发 LEFT JOIN 最多、RIGHT 几乎不用

1. **业务模式天然"主表在左"**：绝大多数查询是"以一张主表为轴，附带关联信息"——列全部用户 + 订单数、列全部标签 + 引用数、列全部订单 + 明细。"要全部保留的表"放左边最自然。
2. **RIGHT JOIN 总能改写成 LEFT JOIN**（换表位置即可），团队统一用 LEFT 风格一致、更易读，很多规范直接禁用 RIGHT JOIN。
3. **兼容性更差**：老版 SQLite（3.39 前）根本不支持 RIGHT JOIN，LEFT JOIN 一直支持。
4. **心智模型一致**："主表全留、附属能附就附、附不上 NULL" 符合"列表 + 可选关联"的标准需求。

### 选择决策树

- 要全部主表行（含没关联的孤儿行）→ `LEFT JOIN`
- 只要两表都匹配的行（交集）→ `INNER JOIN`（写 `JOIN` 即默认 INNER）
- 要右表全部行 → `RIGHT JOIN`（都改写成 LEFT，实际不用）
- 两表都要全部 → `FULL JOIN`（极少用，SQLite 3.39+ 才支持）
- 要两两全排列组合 → `CROSS JOIN`（无 ON 条件）
- 同表树形层级关系 → `SELF JOIN`（配 INNER/LEFT + 别名）
- ——`NATURAL JOIN` 别用，显式写 ON

### 一句话总结

JOIN 按语义分**内连接**和**外连接**两类：INNER 只留两表匹配的行（交集），OUTER 用 NULL 保留没匹配的行（分 LEFT/RIGHT/FULL 三种方向）。另有 CROSS JOIN（笛卡尔积，两两全配）、SELF JOIN（自己连自己，处理树形层级）、NATURAL JOIN（按同名列自动连，工程里别用）。实际开发 INNER JOIN 和 LEFT JOIN 占绝大多数，其余基本碰不到。左/右由 `FROM` 后、`JOIN` 后的位置决定；LEFT 之所以远多于 RIGHT，因主表在左最符合业务直觉，且 RIGHT 可改写为 LEFT、可读性差、老库多不支持。

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
