#!/usr/bin/env bun
/**
 * Claude Code /buddy 宠物刷取脚本
 *
 * 用法:
 *   bun buddy-reroll.js <物种> [最大尝试次数]
 *   bun buddy-reroll.js dragon 500000
 *
 * 物种列表:
 *   duck, goose, blob, cat, dragon, octopus, owl,
 *   penguin, turtle, snail, ghost, axolotl, capybara,
 *   cactus, robot, rabbit, mushroom, chonk
 *
 * 稀有度 (自动刷到最高):
 *   common(60%) > uncommon(25%) > rare(10%) > epic(4%) > legendary(1%)
 *
 * 前置要求:
 *   - 安装 Bun: curl -fsSL https://bun.sh/install | bash
 *   - 脚本必须用 Bun 运行 (Claude Code 使用 Bun.hash，Node.js 结果不一致)
 */

const crypto = require('crypto')
const SALT = 'friend-2026-401'
const SPECIES = ['duck','goose','blob','cat','dragon','octopus','owl',
  'penguin','turtle','snail','ghost','axolotl','capybara','cactus',
  'robot','rabbit','mushroom','chonk']
const RARITIES = ['common','uncommon','rare','epic','legendary']
const RARITY_WEIGHTS = { common:60, uncommon:25, rare:10, epic:4, legendary:1 }
const RARITY_RANK = { common:0, uncommon:1, rare:2, epic:3, legendary:4 }

function mulberry32(seed) {
  let a = seed >>> 0
  return function() {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }

function rollRarity(rng) {
  let roll = rng() * 100
  for (const r of RARITIES) { roll -= RARITY_WEIGHTS[r]; if (roll < 0) return r }
  return 'common'
}

const TARGET = process.argv[2] || 'dragon'
const MAX = parseInt(process.argv[3]) || 500000

if (!SPECIES.includes(TARGET)) {
  console.error(`未知物种: ${TARGET}`)
  console.error(`可选: ${SPECIES.join(', ')}`)
  process.exit(1)
}

console.log(`正在搜索 legendary ${TARGET} (最多 ${MAX} 次)...`)
let best = { rarity: 'common', uid: '' }
for (let i = 0; i < MAX; i++) {
  const uid = crypto.randomBytes(32).toString('hex')
  const rng = mulberry32(hashString(uid + SALT))
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  if (species === TARGET && RARITY_RANK[rarity] > RARITY_RANK[best.rarity]) {
    best = { rarity, uid }
    console.log(`found: ${rarity} ${species} -> ${uid}`)
    if (rarity === 'legendary') break
  }
}
console.log(`\nBest: ${best.rarity} ${TARGET}`)
console.log(`userID: ${best.uid}`)
