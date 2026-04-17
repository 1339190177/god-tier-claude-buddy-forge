#!/usr/bin/env bun
/**
 * Claude Code /buddy 宠物刷取脚本 (Bun 版)
 *
 * 用法:
 *   bun buddy-reroll.js --species dragon --max 500000
 *   bun buddy-reroll.js dragon 500000          (向后兼容位置参数)
 *   bun buddy-reroll.js --help
 *
 * 前置要求:
 *   - 安装 Bun: curl -fsSL https://bun.sh/install | bash
 *   - 脚本必须用 Bun 运行 (Claude Code 使用 Bun.hash，Node.js 结果不一致)
 */

const crypto = require('crypto');
const { SPECIES, RARITY_RANK } = require('./lib/constants');
const { mulberry32, pick, rollRarity, hashStringBun } = require('./lib/rng');
const { resolveArgs } = require('./lib/args-parser');

const args = resolveArgs(
  process.argv,
  {
    max: {
      type: 'number',
      default: 500000,
      desc: '最大尝试次数',
    },
  },
  {
    scriptName: 'bun buddy-reroll.js',
    description: '基础宠物刷取脚本（Bun 运行时）',
    examples: [
      'bun buddy-reroll.js --species dragon --max 500000',
      'bun buddy-reroll.js dragon 500000',
      'bun buddy-reroll.js --species cat --min-rarity epic --salt friend-2026-401',
    ],
  },
);

const {
  species: TARGET,
  max: MAX,
  salt: SALT,
  'min-rarity': MIN_RARITY,
} = args;
const minRarityRank = RARITY_RANK[MIN_RARITY];

function hashString(s) {
  return hashStringBun(s);
}

console.log(`正在搜索 ${MIN_RARITY}+ ${TARGET} (最多 ${MAX} 次)...`);
let best = { rarity: 'common', uid: '' };
for (let i = 0; i < MAX; i++) {
  const uid = crypto.randomBytes(32).toString('hex');
  const rng = mulberry32(hashString(uid + SALT));
  const rarity = rollRarity(rng);
  const species = pick(rng, SPECIES);
  if (
    species === TARGET &&
    RARITY_RANK[rarity] >= minRarityRank &&
    RARITY_RANK[rarity] > RARITY_RANK[best.rarity]
  ) {
    best = { rarity, uid };
    console.log(`found: ${rarity} ${species} -> ${uid}`);
    if (rarity === 'legendary') break;
  }
}
console.log(`\nBest: ${best.rarity} ${TARGET}`);
console.log(`userID: ${best.uid}`);
