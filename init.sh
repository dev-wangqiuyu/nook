#!/bin/bash
set -e

echo "=== Harness Initialization (Nook) ==="

# 确保 cargo 在 PATH（init.sh 可能从非 zsh 登录 shell 调起）
export PATH="$HOME/.cargo/bin:$PATH"

echo "=== 安装依赖 (pnpm) ==="
pnpm install

echo "=== 前端构建 + 类型检查 (vue-tsc --noEmit && vite build) ==="
pnpm build

echo "=== Rust 后端编译检查 (cargo check) ==="
( cd src-tauri && cargo check )

echo "=== 记录一致性检查 (check-records) ==="
bash scripts/check-records.sh

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done (./init.sh)"
