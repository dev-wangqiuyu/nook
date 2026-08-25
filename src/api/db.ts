// 数据库 API 层：plugin-sql 的唯一出口（硬约束 #17：api 层封装 SQL，组件不裸跑）。
// 连接单例 + PRAGMA + 建表（幂等）+ query/run 参数绑定封装（硬约束 #3/#5）。

import Database from "@tauri-apps/plugin-sql";
import { SCHEMA_STATEMENTS } from "@/api/schema";

// dev 库放项目 db/（绝对路径覆盖 app_config_dir），prod 库落 app_config_dir。
// 两套独立库，靠 feat-008 手动导入/导出同步（PRD 设计如此）。
const DB_URL = import.meta.env.DEV
  ? `sqlite:${__DEV_DB_PATH__}`
  : "sqlite:nook.db";

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

// 初始化数据库：加载连接 → 开外键/WAL → 建表。幂等，并发调用复用同一 Promise。
export async function initDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await Database.load(DB_URL);
    // 硬约束 #5：每次连接必开外键，否则 ON DELETE CASCADE 全失效
    await db.execute("PRAGMA foreign_keys = ON;");
    await db.execute("PRAGMA journal_mode = WAL;");
    for (const stmt of SCHEMA_STATEMENTS) {
      await db.execute(stmt);
    }
    dbInstance = db;
    return db;
  })();

  try {
    return await initPromise;
  } catch (err) {
    // 失败清掉 Promise 允许重试
    initPromise = null;
    throw err;
  }
}

// 获取连接（确保已初始化）。业务层调它拿连接，或直接用 query/run。
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  return initDb();
}

// 查询：返回行数组。T 为行类型，由调用方指定（配 types/<module>.ts 行接口）。
// 走 plugin-sql 的泛型 select<T[]>，免类型断言。
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const db = await getDb();
  return db.select<T[]>(sql, [...params]);
}

// 执行：INSERT/UPDATE/DELETE，返回受影响行数与 lastInsertId（SQLite 下必有值）。
export async function run(
  sql: string,
  params: readonly unknown[] = []
): Promise<{ rowsAffected: number; lastInsertId?: number }> {
  const db = await getDb();
  return db.execute(sql, [...params]);
}

// 关闭连接：导入恢复需先关连接再覆盖 nook.db（feat-008 用）。
export async function closeDb(): Promise<void> {
  if (!dbInstance) return;
  await dbInstance.close();
  dbInstance = null;
  initPromise = null;
}
