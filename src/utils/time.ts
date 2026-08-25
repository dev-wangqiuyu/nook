// 时间工具：所有模块写 created_at / updated_at / *_date 用它取本地时间（硬约束，rules/db.md「时间字段」）。
// 存本地时间 YYYY-MM-DD HH:mm:ss，不跨时区、不上云。

// pad2: 补零到两位
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// 本地当前时间字符串 YYYY-MM-DD HH:mm:ss
export function localNow(): string {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    ` ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
}

// 本地当前日期字符串 YYYY-MM-DD（plan_date / record_date / log_date 用）
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
