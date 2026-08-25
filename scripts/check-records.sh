#!/bin/bash
# 记录一致性门禁（harness 规范：init.sh 是唯一验证门禁，本脚本被 init.sh 末尾调用）
# 非 git 仓库，基于 mtime + 内容核对。跨 agent，不依赖 Claude 专属 hook。
#
# 能力边界（务必读）：
# ✅ 抓「改了代码、根本没碰 progress.md / 当日日志」的存在性漏填（最高频偷懒）
# ❌ 抓不了「碰了记录、但内容敷衍」的深度问题——后者靠 AGENTS.md 强制记录的分段 checklist 兜
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROGRESS="progress.md"

fail() { echo "记录门禁失败: $1" >&2; exit 1; }

[ -f "$PROGRESS" ] || fail "$PROGRESS 不存在"

# 取文件 mtime（秒，跨平台：GNU stat -c / BSD stat -f）
mtime() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null; }

# 找 src/ 与 src-tauri/src 下最新的代码文件
#   前端：ts/tsx/js/jsx/mjs/css/vue
#   Rust：rs
# 用临时文件存 find 结果，避免 macOS bash 3.2 不支持进程替换 <(...) 且管道 while 会开子 shell 丢变量
TMPF=$(mktemp)
find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.css' -o -name '*.vue' \) 2>/dev/null > "$TMPF"
find src-tauri/src -type f -name '*.rs' 2>/dev/null >> "$TMPF"

NEWEST=""
NEWEST_M=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  m=$(mtime "$f")
  [ -z "$m" ] && continue
  if [ "$m" -gt "$NEWEST_M" ]; then
    NEWEST_M=$m
    NEWEST=$f
  fi
done < "$TMPF"
rm -f "$TMPF"

[ -z "$NEWEST" ] && { echo "src/ 与 src-tauri/src 无代码文件可比，跳过"; exit 0; }

# 1) mtime：progress.md 不得比最新代码文件旧
PROG_M=$(mtime "$PROGRESS")
if [ "$NEWEST_M" -gt "$PROG_M" ]; then
  fail "代码 $NEWEST 比 progress.md 新 -- progress.md 未同步本次改动 (见 AGENTS.md 强制记录)"
fi

# 2) 内容核对：最新改动文件的 basename 应出现在 progress.md
BASENAME="$(basename "$NEWEST")"
if ! grep -qF "$BASENAME" "$PROGRESS"; then
  fail "progress.md 未提及本次最新改动文件 $BASENAME ($NEWEST) -- 在 当前已验证状态 或会话记录里补上文件名"
fi

# 3) 当日日志：若最新代码改动发生在今天，今日 logs 必须存在且不比代码旧
TODAY=$(date +%Y-%m-%d)
LOG_FILE="logs/${TODAY}.md"
CODE_DAY=$(date -d "@$NEWEST_M" +%Y-%m-%d 2>/dev/null || date -r "$NEWEST_M" +%Y-%m-%d 2>/dev/null)
if [ "$CODE_DAY" = "$TODAY" ]; then
  [ -f "$LOG_FILE" ] || fail "今日代码有改动但 $LOG_FILE 不存在 -- 必须立即追加当日日志"
  LOG_M=$(mtime "$LOG_FILE")
  [ "$NEWEST_M" -gt "$LOG_M" ] && fail "代码 $NEWEST 比当日日志 $LOG_FILE 新 -- 日志未追加本次改动"
fi

echo "记录门禁通过: progress.md 与当日日志均与最新代码改动同步 ($NEWEST)"
