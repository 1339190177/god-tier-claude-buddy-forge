#!/bin/bash
# Claude Code Buddy 重置脚本
# 用法: 在启动 claude 之前运行此脚本
#   ./reset-buddy.sh          # 删除 companion，保留当前 userID
#   ./reset-buddy.sh <新的userID>  # 替换 userID 并删除 companion

CONFIG="$HOME/.claude.json"

if [ ! -f "$CONFIG" ]; then
  echo "错误: 找不到 $CONFIG"
  exit 1
fi

python3 -c "
import json, sys

config_path = '$CONFIG'
new_uid = sys.argv[1] if len(sys.argv) > 1 else None

with open(config_path) as f:
    d = json.load(f)

if new_uid:
    d['userID'] = new_uid
    print(f'userID 已设置: {new_uid[:20]}...')

if 'companion' in d:
    del d['companion']
    print('companion 已删除')
else:
    print('companion 不存在，跳过')

with open(config_path, 'w') as f:
    json.dump(d, f, indent=2)

print('完成! 现在请启动 claude 并运行 /buddy')
" "$1"
