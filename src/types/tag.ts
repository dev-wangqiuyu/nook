// 标签行接口（对齐 schema.ts 的 tag 表）。集中类型，api/组件/ store 共用（硬约束 #17 类型集中）。

// tag 表原始行
export interface Tag {
  id: number;
  name: string;
  created_at: string | null;
}

// 带关联数量的标签（listTags 用 LEFT JOIN + COUNT 聚合得出）
export interface TagWithCount {
  id: number;
  name: string;
  created_at: string | null;
  task_count: number;
  note_count: number;
}
