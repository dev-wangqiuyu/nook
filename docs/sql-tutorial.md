# SQL 从入门到精通（Nook 实战版）

> 个人学习资料，紧扣 Nook 项目表结构（`task` / `note` / `tag` / `task_tag` / `note_tag`）讲解。所有例子都能对照 `src/api/` 里的真实查询。不讲窗口函数/递归 CTE 等高深内容，聚焦日常 CRUD 与常见查询模式。
>
> 配套阅读：`rules/db.md`「JOIN 速查」段（JOIN 全家桶）、`src/api/tag.ts`（每条 SQL 带注释的活例子）。

---

## 〇、先认识 SQLite（本项目用的数据库）

学 SQL 之前，先搞清 Nook 用的是什么数据库、为什么用它。

### SQLite 是什么

SQLite 是一个**嵌入式关系型数据库**——把整个数据库塞进**一个本地文件**（如 Nook 的 `nook.db`）。没有独立的服务端进程，没有"连接到数据库服务器"这一说，应用直接读写那个文件就行。它跟 MySQL/PostgreSQL 是同一套 SQL 方言（CRUD 写法几乎一样），但运行方式完全不同。

### SQLite vs MySQL vs PostgreSQL——三种数据库运行模型对比

| 维度 | SQLite（嵌入式） | MySQL / PostgreSQL（客户端-服务器） |
|---|---|---|
| 运行方式 | 一个文件，应用直接读写 | 独立服务进程，应用通过网络连接 |
| 安装 | 无需安装，零配置 | 要装服务、配置账号密码端口 |
| 部署 | 跟着 App 走（打包进应用） | 单独部署一台数据库服务器 |
| 并发 | 单写者（WAL 下读可并发） | 多用户高并发，适合服务端 |
| 数据量 | 适合 GB 级以下 | 适合 TB 级、海量数据 |
| 多人共享 | 不行（文件锁，不适合跨网络多端） | 天然多人多端共享 |
| 跨设备同步 | 没有，要手动导入导出 | 天然中心库，多端连同一个库 |
| 成本 | 零依赖零运维 | 要运维、要服务器 |

### SQLite 的优点

1. **零配置零依赖**：不用装、不用起服务、不用配端口密码。应用启动直接 `Database.load('sqlite:nook.db')` 就能用。这是它最大的优势。
2. **单文件即整个库**：数据库就是一个 `.db` 文件，复制=备份，删除=卸载，迁移就是拷文件。Nook 的备份导入导出（feat-008）就是复制文件，简单到爆。
3. **跟应用同生命周期**：没有独立进程要管，App 关它就关，不存在"应用挂了数据库还跑着"的运维问题。
4. **跨平台**：同一个 `.db` 文件，Windows/macOS/Linux/手机都能读（字节序兼容）。
5. **体积小、嵌入友好**：库本身几百 KB 级别，完美适配桌面/移动 App 嵌入。
6. **够快**：本地文件读写，无网络往返，单机小数据量下比 MySQL 还快（少了网络层）。
7. **可靠**：事务（ACID）完整支持，断电也不丢已提交数据。
8. **开源免费、无授权费**：公有领域，商用无需付费。

### SQLite 的缺点

1. **不适合高并发写**：整个库同一时刻只允许一个写者（WAL 模式下读可并发，但写仍串行）。多人同时写会排队甚至锁库。
2. **不适合海量数据**：虽然能撑到 TB，但到了几十 GB、上亿行，查询和备份都不如专用服务器数据库顺手。
3. **不适合多人/多端共享**：数据库是本地文件，没有服务端，两台电脑没法同时连同一个库（文件不在一处）。要同步得靠手动导入导出或自建同步逻辑。
4. **没有用户权限系统**：没有 MySQL 那种 `GRANT` 建账号分权限——谁能读文件谁就能看全部（靠文件系统权限兜）。
5. **少数高级特性缺失或晚到**：如 `RIGHT JOIN`/`FULL JOIN` 要 3.39+，没有存储过程、触发器有限、并发模型简单。

### 为什么 Nook 选 SQLite，不选 MySQL 等

Nook 是**单机桌面个人管理应用**，这几点决定了 SQLite 是最合适的：

1. **个人单机，不存在多人并发**：一个用户一台电脑，没有"多用户同时写"的需求，SQLite 的"单写者"限制完全无所谓。用 MySQL 反而是杀鸡用牛刀。
2. **不想让用户装数据库服务**：用户装 Nook 应该"下载即用"，而不是"先去装配置 MySQL 服务、设密码、起进程"。SQLite 零配置，体验最好。这是桌面/移动 App 嵌入数据库的行业标准（Chrome 的 Cookie、Firefox 的书签、微信的本地聊天记录都是 SQLite）。
3. **数据天然属于用户本地**：Nook 是"私人管理"工具，数据就该放在用户自己机器里，不上云、不联网。SQLite 的"单文件本地库"正好。
4. **备份就是拷文件**：feat-008 导出备份=复制 `nook.db`，导入恢复=覆盖回去。MySQL 要 dump/restore 一大堆，对普通用户太复杂。
5. **数据量小**：个人待办/笔记/订单，撑死几十万行，SQLite 飞快，完全不需要 MySQL 的容量。
6. **跨平台一致**：Nook 要发 macOS/Windows，SQLite 文件格式跨平台一致，不用为每个平台单独处理数据库。

> 反过来，什么场景该用 MySQL/PostgreSQL 而不是 SQLite？
> - 多人协作、多端共享同一份数据（如团队任务系统）；
> - 高并发写入（如电商订单、网站后台）；
> - 数据量大到要专门服务器承载；
> - 需要精细的账号权限管理。
> Nook 都不沾边，所以 SQLite 是正确选择。

### 一句话总结

SQLite 是"一个文件一个库"的嵌入式数据库，零配置、跟 App 走、备份即拷文件，适合单机个人/桌面移动嵌入场景；MySQL 等是"独立服务进程"的客户端-服务器数据库，适合多人高并发共享场景。Nook 是单机个人应用，要"下载即用、数据本地、备份简单"，所以选 SQLite 而非 MySQL——这是桌面 App 嵌入数据库的行业标准做法。

---

## 〇、先建立全局认知：SQL 语句分四大类

| 类别 | 全称 | 关键字 | 干什么 | Nook 用到吗 |
|---|---|---|---|---|
| **DDL** | 数据定义 | `CREATE` `ALTER` `DROP` | 建改删表结构 | ✅ `schema.ts` 建表 |
| **DML** | 数据操作 | `INSERT` `UPDATE` `DELETE` `SELECT` | 增删改查**数据** | ✅ CRUD 主体 |
| **DCL** | 数据控制 | `GRANT` `REVOKE` | 权限管理 | ❌ 单机本地用不上 |
| **TCL** | 事务控制 | `BEGIN` `COMMIT` `ROLLBACK` | 事务提交回滚 | ✅ 批量操作时用 |

**CRUD = Create(INSERT) / Read(SELECT) / Update(UPDATE) / Delete(DELETE)**，全在 DML 里。这就是日常写的 90%。

> 顺带一提：虽然 `SELECT` 在标准里属于 DQL（数据查询语言），但实操上大家都把它归进 DML 一起记。

---

## 一、查 SELECT（最重点，拆成多层讲）

查询是 SQL 里用得最多、变化最多的部分。**牢记 SQL 的执行顺序**（不是书写顺序！）：

```
书写顺序:  SELECT → FROM → JOIN → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT
执行顺序:  FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```
> 先定位表(FROM/JOIN)，再过滤行(WHERE)，再分组聚合(GROUP BY/HAVING)，再选列(SELECT)，最后排序截取(ORDER BY/LIMIT)。理解了这个顺序，SQL 的很多"为什么"就通了。

### 1.1 最简单的查询

```sql
-- 查全部列（* 是"所有列"，开发中少用，明确列名更安全可读）
SELECT * FROM tag;

-- 查指定列（推荐）
SELECT id, name FROM tag;

-- 列起别名 AS（AS 可省略）
SELECT id AS 标签id, name AS 标签名 FROM tag;
-- Nook 实例：listTags 里 t.id AS id 就是给列起别名

-- 去重 DISTINCT
SELECT DISTINCT tag_id FROM task_tag;   -- 所有被用过的标签 id（不重复）
```

### 1.2 WHERE 过滤行

```sql
-- 比较运算符：=  <>（不等于，也可写 !=）  >  <  >=  <=
SELECT * FROM task WHERE status = '待完成';
SELECT * FROM task WHERE priority >= 2;

-- 逻辑组合 AND / OR / NOT
SELECT * FROM task WHERE status = '待完成' AND priority >= 2;
SELECT * FROM task WHERE status = '已完成' OR status = '已放弃';
SELECT * FROM task WHERE NOT status = '已完成';

-- IN：多个值任一匹配（比连写 OR 简洁）
SELECT * FROM task WHERE status IN ('待完成', '进行中');

-- BETWEEN：范围（含两端）
SELECT * FROM task WHERE priority BETWEEN 1 AND 3;

-- LIKE：模糊匹配。% = 任意多个字符，_ = 单个字符
SELECT * FROM task WHERE title LIKE '%报告%';     -- 标题含"报告"
SELECT * FROM tag WHERE name LIKE '工_';          -- "工作""工作2"（两字开头第二字任意）

-- IS NULL / IS NOT NULL：判空（重要！见下方 NULL 专节）
SELECT * FROM task WHERE plan_date IS NULL;        -- 没排日期的任务
```

> ⚠️ `=` 能匹配 NULL 吗？**不能**。`WHERE plan_date = NULL` 永远查不到任何行，必须写 `IS NULL`。这是新手最常踩的坑。

### 1.3 ORDER BY 排序

```sql
-- ASC 升序（默认），DESC 降序
SELECT * FROM task ORDER BY priority DESC;              -- 优先级从高到低
SELECT * FROM task ORDER BY created_at DESC;            -- 新建的在前

-- 多列排序：先按第一列，相同时按第二列
SELECT * FROM task ORDER BY status ASC, priority DESC;  -- 先按状态，同状态里优先级高的在前
```

### 1.4 LIMIT / OFFSET 分页

SQLite 用 `LIMIT 数量 OFFSET 偏移` 做分页：

```sql
-- 每页 20 条，取第 1 页（偏移 0）
SELECT * FROM task ORDER BY id DESC LIMIT 20 OFFSET 0;
-- 第 2 页（偏移 20）
SELECT * FROM task ORDER BY id DESC LIMIT 20 OFFSET 20;
-- 通用公式：OFFSET = (页码 - 1) × 每页条数
```
> Nook 是单机桌面应用，列表通常不大，分页用得少，但记着这个模式，数据多了迟早要用。

### 1.5 聚合函数

对一组行算一个汇总值：

| 函数 | 作用 | 例子 |
|---|---|---|
| `COUNT(*)` | 数行数（含 NULL 行） | `SELECT COUNT(*) FROM task` |
| `COUNT(col)` | 数该列非 NULL 的行数 | `COUNT(plan_date)` |
| `COUNT(DISTINCT col)` | 数去重后的值个数 | `COUNT(DISTINCT tag_id)` |
| `SUM(col)` | 求和 | `SUM(priority)` |
| `AVG(col)` | 平均 | `AVG(priority)` |
| `MAX(col)` / `MIN(col)` | 最大/最小 | `MAX(created_at)` 最近时间 |

```sql
SELECT COUNT(*) AS 任务总数 FROM task;
SELECT MAX(created_at) AS 最新任务时间 FROM task;
```

> **聚合函数自动忽略 NULL**（除了 `COUNT(*)`）。`AVG` 只算非 NULL 的行，分母会变——要留意。

### 1.6 GROUP BY 分组 + HAVING

`GROUP BY` 把行按某列分组，每组配聚合函数出一个结果：

```sql
-- 每个状态各有多少任务
SELECT status, COUNT(*) AS 数量
FROM task
GROUP BY status;
-- 结果形如：待完成 5 / 进行中 3 / 已完成 10

-- Nook 实例：listTags 就是 GROUP BY t.id，每个标签一行，配 COUNT 算关联数
SELECT t.id, t.name, COUNT(DISTINCT tt.task_id) AS task_count
FROM tag t LEFT JOIN task_tag tt ON tt.tag_id = t.id
GROUP BY t.id, t.name;
```

**HAVING vs WHERE（经典面试题）**：
- `WHERE`：在分组**前**过滤行（不能写聚合函数）。
- `HAVING`：在分组**后**过滤组（可以写聚合函数）。

```sql
-- 找"被 2 个以上任务使用"的标签
SELECT tag_id, COUNT(*) AS 使用次数
FROM task_tag
GROUP BY tag_id
HAVING COUNT(*) >= 2;        -- 分组后过滤，用 HAVING
-- WHERE 用不了 COUNT(*)，因为还没分组

-- 组合：先 WHERE 过滤行，再 GROUP BY 分组，再 HAVING 过滤组
SELECT tag_id, COUNT(*) AS 次数
FROM task_tag
WHERE task_id > 100          -- 先只看 task_id>100 的行
GROUP BY tag_id
HAVING COUNT(*) >= 2;        -- 再在这些组里挑次数≥2的
```

### 1.7 JOIN（连接）——速查见 `rules/db.md`

一句话回顾四种：
- **INNER JOIN**：只留两表都匹配的行（交集）。
- **LEFT JOIN**：保左表全部，右表没匹配填 NULL（最常用，做"列表+附带关联"）。
- **RIGHT JOIN**：保右表全部（极少用，可改写成 LEFT）。
- **FULL JOIN**：两表都保（极少，SQLite 3.39+）。

```sql
-- Nook 实例：列全部标签 + 各自关联数（LEFT JOIN 保住没被用过的标签）
SELECT t.name,
       COUNT(DISTINCT tt.task_id) AS task_count
FROM tag t
LEFT JOIN task_tag tt ON tt.tag_id = t.id
GROUP BY t.id, t.name;
```

### 1.8 子查询

查询里嵌查询，分三种常见用法：

```sql
-- ① 标量子查询：返回单个值，可当列用
SELECT t.name,
  (SELECT COUNT(*) FROM task_tag tt WHERE tt.tag_id = t.id) AS task_count
FROM tag t;
-- Nook listTags 的"等价子查询写法"就是这个，免笛卡尔积免 DISTINCT

-- ② IN 子查询：返回一列，用于 IN 过滤
SELECT * FROM task
WHERE id IN (SELECT task_id FROM task_tag WHERE tag_id = 5);
-- 查"打了 id=5 标签"的所有任务

-- ③ 派生表（子查询当表用）：必须起别名
SELECT t.title FROM (
  SELECT * FROM task WHERE priority >= 2
) t                          -- ← 子查询结果当表，必须起别名 t
WHERE t.status = '待完成';
```

> 还有个 `EXISTS`：判断子查询是否"有结果行"，有就真。常用于关联判断，比 IN 有时更高效：
> ```sql
> SELECT * FROM task t
> WHERE EXISTS (SELECT 1 FROM task_tag tt WHERE tt.task_id = t.id);
> -- 有打标签的任务
> ```

### 1.9 CASE 条件表达式

SQL 里的 if-else，返回值当列用：

```sql
-- 给任务按优先级贴中文标签
SELECT title,
  CASE priority
    WHEN 1 THEN '低'
    WHEN 2 THEN '中'
    WHEN 3 THEN '高'
    ELSE '未知'
  END AS 优先级文字
FROM task;

-- 也可写搜索式 CASE（条件可不同字段）
SELECT title,
  CASE
    WHEN status = '已完成' THEN '✅'
    WHEN status = '已放弃' THEN '❌'
    ELSE '⏳'
  END AS 图标
FROM task;
```

### 1.10 集合运算 UNION / INTERSECT / EXCEPT

把多个查询结果拼一起：
- `UNION`：合并两结果（自动去重）；`UNION ALL` 不去重（更快，知道没重复就用 ALL）。
- `INTERSECT`：取交集。
- `EXCEPT`：取差集（前者有、后者没有）。

```sql
-- 所有被任务或笔记用过的标签 id（合并去重）
SELECT tag_id FROM task_tag
UNION
SELECT tag_id FROM note_tag;

-- 只被任务用、没被笔记用的标签
SELECT tag_id FROM task_tag
EXCEPT
SELECT tag_id FROM note_tag;
```
> 要求：两查询列数和类型对应一致。

---

## 二、增 INSERT（Create）

```sql
-- 单行插入：列名表 + VALUES
INSERT INTO tag (name, created_at) VALUES ('工作', '2026-08-25 11:40:23');
-- Nook createTag 就是这条（$1/$2 是参数绑定占位符）

-- 多行插入：一组列名表，VALUES 后跟多个括号
INSERT INTO task_tag (task_id, tag_id) VALUES (1, 5), (1, 6), (2, 5);

-- 省略列名表（不推荐）：按表定义的列顺序填，容易错位
INSERT INTO tag VALUES (3, '生活', '2026-08-25 11:00:00');  -- 得记得 id 在前 name 其次
```

**SQLite 两个实用变体**：

```sql
-- INSERT OR IGNORE：唯一约束冲突时静默跳过（不报错）
INSERT OR IGNORE INTO tag (name, created_at) VALUES ('工作', '...');
-- 若 tag.name 已有"工作"，这条不插入也不报错

-- INSERT ... ON CONFLICT ... DO UPDATE：冲突时改（即 upsert，更新或插入）
INSERT INTO task_tag (task_id, tag_id) VALUES (1, 5)
ON CONFLICT(task_id, tag_id) DO UPDATE SET tag_id = excluded.tag_id;
-- 若 (task_id,tag_id) 已存在，改成后面的值；不存在则插入
```

> 参数绑定提醒：上面 `VALUES ('工作', ...)` 是讲解用字面量，真实代码里一律用 `VALUES ($1, $2)` 绑定参数，防注入（硬约束 #3）。

---

## 三、改 UPDATE

```sql
-- 单列更新
UPDATE task SET status = '已完成' WHERE id = 10;

-- 多列更新（SET 用逗号分隔）
UPDATE task SET status = '已完成', priority = 1 WHERE id = 10;

-- 全表更新（危险！漏写 WHERE 会改光全表）
UPDATE task SET priority = 1;   -- 所有任务优先级都变 1，几乎一定不是你想要的
```

> ⚠️ **UPDATE 不写 WHERE = 全表改光**。删改前永远先想 WHERE 在不在。养成习惯：先写 `WHERE`，再回头补 `SET`。

**基于另一张表更新**（SQLite 不支持 `UPDATE ... JOIN`，用子查询）：

```sql
-- 给"打了 id=5 标签"的所有任务优先级 +1
UPDATE task
SET priority = priority + 1
WHERE id IN (SELECT task_id FROM task_tag WHERE tag_id = 5);
```

---

## 四、删 DELETE

```sql
-- 按条件删
DELETE FROM task WHERE id = 10;

-- 全表删（危险！同 UPDATE，漏 WHERE 删光）
DELETE FROM task;   -- 删光所有任务（但表结构还在）
```

**DELETE vs DROP vs TRUNCATE（面试常问）**：

| 操作 | 作用 | 表结构 | 可回滚 | 速度 |
|---|---|---|---|---|
| `DELETE FROM t WHERE...` | 按条件删行 | 保留 | 事务内可 | 慢（逐行） |
| `DELETE FROM t`（无条件） | 删光所有行 | 保留 | 事务内可 | 慢 |
| `TRUNCATE TABLE t` | 清空表 | 保留 | 通常不可 | 快（不逐行） |
| `DROP TABLE t` | 删整张表 | **连结构一起删** | 事务内可 | — |

> SQLite **没有 `TRUNCATE`**，清空用 `DELETE FROM t`（数据量不大无所谓）。

**级联删除（Nook 用法）**：删标签时，`task_tag`/`note_tag` 里的关联靠外键 `ON DELETE CASCADE` 自动清，不手写子表删除（硬约束 #6）：
```sql
DELETE FROM tag WHERE id = 5;
-- task_tag / note_tag 里 tag_id=5 的行被 SQLite 自动删掉
-- 前提：连接开了 PRAGMA foreign_keys = ON
```

---

## 五、NULL 的坑（专门一节，新手必踩）

SQL 里 NULL 表示"未知/不存在"，它**不是 0 也不是空字符串**。它带来"三值逻辑"：比较 NULL 得到的是 `UNKNOWN`，不是 `TRUE` 也不是 `FALSE`。

```sql
-- ❌ 永远查不到（= NULL 是 UNKNOWN，被 WHERE 当成"不匹配"）
SELECT * FROM task WHERE plan_date = NULL;

-- ✅ 判空必须用 IS NULL
SELECT * FROM task WHERE plan_date IS NULL;
SELECT * FROM task WHERE plan_date IS NOT NULL;
```

**三个处理 NULL 的函数**：

```sql
-- COALESCE(a, b, c, ...)：返回第一个非 NULL 的值，常用"给 NULL 兜底默认值"
SELECT COALESCE(plan_date, '未排期') FROM task;
-- plan_date 有值就显示原值，是 NULL 就显示"未排期"

-- NULLIF(a, b)：a=b 时返回 NULL，否则返回 a。常用于"避免除以 0"
SELECT NULLIF(status, '') FROM task;   -- 空串转成 NULL，便于后续 IS NULL 判空

-- IFNULL(a, b)：SQLite 专有，等价于两参 COALESCE
SELECT IFNULL(plan_date, '未排期') FROM task;
```

> **聚合函数忽略 NULL**：`COUNT(plan_date)` 不数 NULL 行；`AVG(priority)` 只对非 NULL 求平均。只有 `COUNT(*)` 数所有行。

---

## 六、常用函数（SQLite）

### 字符串

```sql
LENGTH('你好')           -- 长度
SUBSTR('Hello', 2, 3)    -- 截取：从第2字符取3个 → 'ell'
UPPER('abc') / LOWER('ABC')   -- 大小写转换
TRIM('  hi  ')           -- 去两端空格
REPLACE('a-b-c', '-', '_')   -- 替换 → 'a_b_c'
INSTR('hello', 'll')     -- 子串首次出现位置 → 3（找不到 0）
'工' || '作'             -- || 拼接字符串 → '工作'（SQLite 用 ||，不认 +）
```

### 日期时间

```sql
DATE('now')                       -- 今天日期 '2026-08-25'
DATETIME('now')                   -- 现在 '2026-08-25 11:40:23'
DATE('now', '+1 day')             -- 明天
DATE('now', '-7 day')             -- 7 天前
DATE('now', '+1 month')           -- 下月今天
STRFTIME('%Y-%m', 'now')          -- 按格式化 → '2026-08'
```
> Nook 用 `localNow()` 在 TS 层算好时间再绑定进 SQL（`rules/db.md`「时间字段」存本地时间），不依赖数据库的 `'now'`（那是 UTC）。知道有这些函数即可。

### 数值与转换

```sql
ROUND(3.14159, 2)    -- 四舍五入 → 3.14
ABS(-5)              -- 绝对值 → 5
CAST('123' AS INTEGER)   -- 类型转换 → 123
CAST(priority AS TEXT)   -- 数值转文本
```

---

## 七、索引（性能入门）

数据多了，查询变慢，索引就是给表加"目录"加速查找：

```sql
-- 建索引
CREATE INDEX idx_task_status ON task (status);
-- 查"按 status 过滤"时就能走索引，快很多

-- 复合索引（多列）
CREATE INDEX idx_task_status_priority ON task (status, priority);
-- 服从"最左前缀"：能加速 status 查询、status+priority 查询，
-- 但加速不了"只查 priority"（少了最左的 status）

-- 看查询走没走索引
EXPLAIN QUERY PLAN SELECT * FROM task WHERE status = '已完成';
-- 输出里出现 "USING INDEX idx_task_status" 就是走索引了
```

**何时建索引**：
- 经常出现在 `WHERE` / `ORDER BY` / `JOIN ON` 的列适合建。
- **代价**：索引占空间，且每次 INSERT/UPDATE/DELETE 都要维护索引，写变慢。所以不是越多越好——读多写少的列才建。
- Nook 数据量小（单机个人），绝大多数查询不用索引也飞快，等数据量真大了再加。

---

## 八、事务（保证多步要么全成要么全败）

```sql
BEGIN;                          -- 开启事务
INSERT INTO task (title) VALUES ('任务A');
INSERT INTO task (title) VALUES ('任务B');
UPDATE task SET status = '已完成' WHERE id = 1;
COMMIT;                         -- 全部成功 → 提交（一次落盘）
-- 若中途出错：ROLLBACK; → 上面三条全部撤销，回到 BEGIN 前
```

**ACID**（面试概念，了解即可）：
- **A**tomicity 原子性：事务要么全做、要么全不做。
- **C**onsistency 一致性：事务前后数据满足约束。
- **I**solation 隔离性：并发事务互不干扰。
- **D**urability 持久性：提交后即使断电也不丢。

**何时用事务**：一个业务动作要改好几条数据、且要求"要么一起成功要么一起回滚"时。Nook 单机本地、单用户、低并发，多数 CRUD 一条一条直接执行即可；批量导入或级联多表改时才需要显式事务。

---

## 九、PRAGMA（SQLite 专有配置）

```sql
PRAGMA foreign_keys = ON;       -- 开外键约束（SQLite 默认关！不开级联失效）
PRAGMA journal_mode = WAL;     -- 写时用 WAL，提升并发读性能
PRAGMA table_info(task);        -- 看表结构（列名/类型/是否可空/主键）
PRAGMA foreign_key_list(task_tag);  -- 看外键
PRAGMA database_list;           -- 看当前库文件路径
```
> Nook 在 `initDb()` 里就跑了前两条（硬约束 #5）。

---

## 十、安全与性能要点（实战心法）

1. **永远参数绑定**：用户输入绝不字符串拼接进 SQL，用 `$1/$2` 占位符（硬约束 #3）。这是防 SQL 注入的底线。
2. **别用 `SELECT *`**：明确写列名，表结构变了不会炸、传输量小、可读。
3. **写 WHERE 再写 SET/DELETE**：先定好过滤条件，避免全表误伤。
4. **查慢了用 `EXPLAIN QUERY PLAN`**：看是不是全表扫描，该加索引加索引。
5. **警惕 N+1 查询**：循环里对每行再发一条查询，是性能杀手。能用 JOIN/IN 子查询一次拿的别循环。
6. **聚合留意 NULL**：`COUNT(col)` 不数 NULL，`AVG` 分母不含 NULL。
7. **分页大偏移慢**：`LIMIT 20 OFFSET 100000` 会扫前面 10 万行，数据量大时换"游标分页"（按 id > 上次最大 id）。

---

## 附：Nook 实战查询对照表

| 想做什么 | 用什么 | Nook 出处在哪 |
|---|---|---|
| 列全部标签 + 各自关联数 | LEFT JOIN + COUNT(DISTINCT) + GROUP BY | `src/api/tag.ts` listTags |
| 按 id 查单个 | WHERE id = $1 | `src/api/tag.ts` getTag |
| 新建 | INSERT ... VALUES ($1, $2) | `src/api/tag.ts` createTag |
| 改名 | UPDATE ... SET ... WHERE id = $2 | `src/api/tag.ts` updateTag |
| 删除（级联清子表） | DELETE + FK CASCADE | `src/api/tag.ts` deleteTag |
| 查同名是否已存在 | WHERE name = $1 | createTag/updateTag 唯一校验 |
| 排除自身的唯一校验 | WHERE name = $1 AND id != $2 | updateTag |

---

## 一句话总览

SQL 核心 = **SELECT（查，含 WHERE/ORDER BY/聚合/GROUP BY/JOIN/子查询）+ INSERT（增）+ UPDATE（改）+ DELETE（删）**，外加 NULL 处理、索引、事务三块常识。日常开发 90% 在写这四件套的各种组合；把 SELECT 的执行顺序、JOIN 的方向、NULL 的三值逻辑、参数绑定这四点吃透，就过了"能干活"的门槛。剩下的窗口函数、递归 CTE、查询优化等高阶内容，等遇到具体瓶颈再深入也来得及。
