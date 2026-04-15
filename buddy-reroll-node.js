#!/usr/bin/env node
/**
 * Claude Code /buddy 宠物刷取脚本 (Node 版)
 *
 * 用法:
 *   node buddy-reroll-node.js --species dragon --max 500000
 *   node buddy-reroll-node.js dragon 500000          (向后兼容位置参数)
 *   node buddy-reroll-node.js --help
 *
 * 注意: npm 安装的 Claude Code 使用 FNV-1a hash
 *       原生安装的 Claude Code 使用 Bun.hash (请用 buddy-reroll.js + Bun 运行)
 */

const crypto = require('crypto')
const { SPECIES, RARITY_RANK } = require('./lib/constants')
const { mulberry32, pick, rollRarity, hashStringFnv1a } = require('./lib/rng')
const { resolveArgs } = require('./lib/args-parser')

const args = resolveArgs(process.argv, {
  max: {
    type: 'number',
    default: 500000,
    desc: '最大尝试次数',
  },
}, {
  scriptName: 'node buddy-reroll-node.js',
  description: '基础宠物刷取脚本（Node.js 运行时，使用 FNV-1a hash）',
  examples: [
    'node buddy-reroll-node.js --species dragon --max 500000',
    'node buddy-reroll-node.js dragon 500000',
    'node buddy-reroll-node.js --species cat --min-rarity epic --salt friend-2026-401',
  ],
})

const { species: TARGET, max: MAX, salt: SALT, 'min-rarity': MIN_RARITY } = args
const minRarityRank = RARITY_RANK[MIN_RARITY]

console.log(`正在搜索 ${MIN_RARITY}+ ${TARGET} (最多 ${MAX} 次)...`)
let best = { rarity: 'common', uid: '' }
for (let i = 0; i < MAX; i++) {
  const uid = crypto.randomBytes(32).toString('hex')
  const rng = mulberry32(hashStringFnv1a(uid + SALT))
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  if (species === TARGET && RARITY_RANK[rarity] >= minRarityRank && RARITY_RANK[rarity] > RARITY_RANK[best.rarity]) {
    best = { rarity, uid }
    console.log(`found: ${rarity} ${species} -> ${uid}`)
    if (rarity === 'legendary') break
  }
}
console.log(`\nBest: ${best.rarity} ${TARGET}`)
console.log(`userID: ${best.uid}`)
