// 建表 DDL：11 张表，程序启动时 CREATE TABLE IF NOT EXISTS 执行。
// 与 PRD「数据库设计」段对齐（v1.1：子表 FOREIGN KEY ... ON DELETE CASCADE 已补全）。
// PRAGMA（foreign_keys=ON / journal_mode=WAL）不在此数组——由 initDb 在建表前先执行，
// 因外键约束影响 DML 而非 DDL，但养成"连接一开就开外键"的习惯（硬约束 #5）。

export const SCHEMA_STATEMENTS: readonly string[] = [
  // 任务表
  `CREATE TABLE IF NOT EXISTS task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  plan_date TEXT,
  deadline TEXT,
  status INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);`,

  // 笔记表
  `CREATE TABLE IF NOT EXISTS note (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT,
  created_at TEXT,
  updated_at TEXT
);`,

  // 标签表
  `CREATE TABLE IF NOT EXISTS tag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT
);`,

  // 任务标签关联表
  `CREATE TABLE IF NOT EXISTS task_tag (
  task_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);`,

  // 笔记标签关联表
  `CREATE TABLE IF NOT EXISTS note_tag (
  note_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES note(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);`,

  // 宇宙订单表
  `CREATE TABLE IF NOT EXISTS cosmic_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT,
  delivered_at TEXT
);`,

  // 感恩记录表
  `CREATE TABLE IF NOT EXISTS gratitude (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  record_date TEXT,
  created_at TEXT
);`,

  // 视觉化记录表
  `CREATE TABLE IF NOT EXISTS visualization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  feeling TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);`,

  // 行动脚印表
  `CREATE TABLE IF NOT EXISTS action_step (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  action_date TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);`,

  // 信号日记表（order_id 可为空，用于通用灵感，不强制关联订单）
  `CREATE TABLE IF NOT EXISTS manifestation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  content TEXT NOT NULL,
  log_date TEXT,
  created_at TEXT,
  FOREIGN KEY (order_id) REFERENCES cosmic_order(id) ON DELETE CASCADE
);`,

  // 应用设置表（KV）
  `CREATE TABLE IF NOT EXISTS app_setting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  value TEXT
);`,
];
