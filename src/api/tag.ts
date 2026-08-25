// 标签 API 层：plugin-sql 唯一出口的数据访问（硬约束 #17：组件不裸跑 SQL，走 api）。
// 全部走参数绑定 $1/$2（硬约束 #3，防注入）。首次实跑 query/run 的参数绑定链路（feat-003 全 DDL 未用到）。
// 每条 SQL 都写清注释，便于学习查阅（rules/db.md「SQL 注释规范」）。

import { query, run } from "@/api/db";
import { localNow } from "@/utils/time";
import type { Tag, TagWithCount } from "@/types/tag";

// ──────────────────────────────────────────────────────────────
// 标签列表（含关联数量）
// ──────────────────────────────────────────────────────────────
// 业务：列出【全部】标签，并统计每个标签被多少条待办、多少条笔记使用。
//       必须包含"从没被用过"的新建标签（关联数为 0 也要列出）。
//
// 【为什么必须用 LEFT JOIN，不能用 INNER JOIN】
// JOIN 四种类型回顾（以 tag t LEFT JOIN task_tag tt 为例）：
//   - INNER JOIN：只保留两表都匹配的行。tag 在 task_tag 里没有匹配行 → 该标签被丢弃。
//                 → 刚建还没用过的标签会从列表消失，不符合"列全部"需求。
//   - LEFT  JOIN：保留【左表 tag】全部行，右表 task_tag 无匹配则其列填 NULL。
//                 → 未使用标签也保留，COUNT 结果为 0。本查询要的就是这个。
//   - RIGHT JOIN：保留【右表】全部行，和 LEFT 完全对称——把两表换位用 LEFT JOIN 即等价，
//                 故业界几乎不用 LEFT 之外的方向。SQLite 3.39 前甚至不支持 RIGHT。
//   - FULL  JOIN：两表都全留；SQLite 3.39+ 才支持，本场景不需要。
// 结论：主表 tag 在左、关联表在右、要保留主表全部 → LEFT JOIN。
//
// 【为什么 COUNT(DISTINCT ...) 而不是 COUNT(...)】
// 同时 LEFT JOIN 了 task_tag 和 note_tag 两张表，会产生笛卡尔积：
//   一个标签关联 2 待办 + 3 笔记 → 中间结果 2×3=6 行。
//   COUNT(tt.task_id) 会数 6（把笔记乘进来了），COUNT(DISTINCT tt.task_id) 才得真实 2。
//   DISTINCT 只数不同的 task_id / note_id，滤掉笛卡尔重复。
//
// 【等价写法（子查询，更直观但性能相近）】
//   SELECT t.id, t.name, t.created_at,
//     (SELECT COUNT(*) FROM task_tag tt WHERE tt.tag_id = t.id) AS task_count,
//     (SELECT COUNT(*) FROM note_tag nt WHERE nt.tag_id = t.id) AS note_count
//   FROM tag t ORDER BY t.name;
//   ——无笛卡尔、免 DISTINCT，可读性更好；本文件用 JOIN 版作 LEFT JOIN 教学范例。
//
// 其他要点：
//   - GROUP BY t.id, t.name, t.created_at：按标签分组，每个标签一行。显式列出非聚合列更规范。
//   - ORDER BY t.name：标签名按字母/拼音序，列表稳定。
//   - 无参数：纯查询，不涉及用户输入，无需绑定。
export async function listTags(): Promise<TagWithCount[]> {
  return query<TagWithCount>(`
    SELECT
      t.id            AS id,
      t.name          AS name,
      t.created_at    AS created_at,
      COUNT(DISTINCT tt.task_id) AS task_count,
      COUNT(DISTINCT nt.note_id) AS note_count
    FROM tag t
    LEFT JOIN task_tag tt ON tt.tag_id = t.id
    LEFT JOIN note_tag nt ON nt.tag_id = t.id
    GROUP BY t.id, t.name, t.created_at
    ORDER BY t.name
  `);
}

// ──────────────────────────────────────────────────────────────
// 单个标签（按 id）
// ──────────────────────────────────────────────────────────────
// SQL 要点：
// 1. WHERE id = $1 —— $1 是 plugin-sql 的位置占位符（sqlx 风格，SQLite/Postgres 通用），
//    $1 会被运行时替换为参数数组的第一个元素 [id]，绝不字符串拼接，防 SQL 注入（硬约束 #3）。
// 2. SELECT 只取原始三列，不含关联数量（单查场景通常只需自身信息）。
// 3. 返回单行或 null —— query 返回数组，取 rows[0]，无则 null。
export async function getTag(id: number): Promise<Tag | null> {
  const rows = await query<Tag>("SELECT id, name, created_at FROM tag WHERE id = $1", [id]);
  return rows[0] ?? null;
}

// ──────────────────────────────────────────────────────────────
// 创建标签
// ──────────────────────────────────────────────────────────────
// 业务：name 唯一（tag.name 有 UNIQUE 约束），先查后插给友好提示。单机本地无并发竞态。
//
// SQL 要点：
// 1. 唯一校验：SELECT id FROM tag WHERE name = $1 —— 先查同名是否存在，
//    存在则抛"标签名已存在"。比直接 INSERT 等数据库抛 UNIQUE 异常再解析更可控、提示更友好。
// 2. INSERT INTO tag (name, created_at) VALUES ($1, $2) —— $1=name, $2=本地当前时间。
//    列名表 (name, created_at) 显式写出，不依赖列顺序，比 INSERT ... VALUES 隐式更安全。
// 3. run() 返回 { rowsAffected, lastInsertId } —— lastInsertId 即新标签的 id（SQLite 自增主键）。
//
// 抛错：标签名不能为空 / 标签名已存在 / 创建失败。
export async function createTag(name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("标签名不能为空");
  // 唯一校验：查同名标签是否存在
  const dup = await query<{ id: number }>("SELECT id FROM tag WHERE name = $1", [trimmed]);
  if (dup.length > 0) throw new Error("标签名已存在");
  // 插入：name + 本地当前时间（rules/db.md「时间字段」存本地时间）
  const res = await run(
    "INSERT INTO tag (name, created_at) VALUES ($1, $2)",
    [trimmed, localNow()]
  );
  if (!res.lastInsertId) throw new Error("创建标签失败");
  return res.lastInsertId;
}

// ──────────────────────────────────────────────────────────────
// 编辑标签（改名）
// ──────────────────────────────────────────────────────────────
// 业务：改标签名。关联表 task_tag/note_tag 用 tag_id 外键引用，改名不影响关联（关联存的是 id 不是 name），
// 所以改名后所有已打标签的待办/笔记自动"同步"（无需额外操作）。
//
// SQL 要点：
// 1. 唯一校验排除自身：WHERE name = $1 AND id != $2 —— 不能用 WHERE name = $1，
//    否则查到自己会误判"已存在"。$1=新名, $2=当前标签 id。
// 2. UPDATE tag SET name = $1 WHERE id = $2 —— 只改 name（tag 表无 updated_at 列，见 schema.ts）。
// 3. rowsAffected === 0 判定标签不存在（如已被删），抛错。
export async function updateTag(id: number, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("标签名不能为空");
  // 唯一校验：排除自身 id
  const dup = await query<{ id: number }>(
    "SELECT id FROM tag WHERE name = $1 AND id != $2",
    [trimmed, id]
  );
  if (dup.length > 0) throw new Error("标签名已存在");
  // 改名（关联表引用 id，改名自动同步，无需改 task_tag/note_tag）
  const res = await run("UPDATE tag SET name = $1 WHERE id = $2", [trimmed, id]);
  if (res.rowsAffected === 0) throw new Error("标签不存在或未改动");
}

// ──────────────────────────────────────────────────────────────
// 删除标签
// ──────────────────────────────────────────────────────────────
// 业务：删标签。关联记录（task_tag / note_tag）靠外键 ON DELETE CASCADE 自动级联清理，
// 不需要手写 DELETE FROM task_tag WHERE tag_id = ?（硬约束 #6，禁手写删子表）。
//
// SQL 要点：
// 1. DELETE FROM tag WHERE id = $1 —— 只删主表 tag 一行；子表关联由 SQLite 外键级联自动删。
//    前提：连接开了 PRAGMA foreign_keys = ON（initDb 已开，硬约束 #5），否则级联失效留孤儿数据。
// 2. 返回 rowsAffected —— 0 表示标签不存在（可能已被删），调用方可据此提示。
// 3. 删除前的二次确认在 UI 层做（TagManager 的内联确认 / ElMessageBox），api 只负责执行。
export async function deleteTag(id: number): Promise<number> {
  const res = await run("DELETE FROM tag WHERE id = $1", [id]);
  return res.rowsAffected;
}
