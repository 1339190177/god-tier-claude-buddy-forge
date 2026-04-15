#!/usr/bin/env node
/**
 * Claude Code /buddy 宠物刷取脚本 — 限时单核模式
 *
 * 用法:
 *   node buddy-reroll-advanced.js --species dragon --timeout 15
 *   node buddy-reroll-advanced.js dragon 15                 (向后兼容位置参数)
 *   node buddy-reroll-advanced.js --help
 */

const crypto = require('crypto')
const fs = require('fs')
const { SPECIES, RARITY_RANK, EYES, HATS } = require('./lib/constants')
const { mulberry32, pick, rollRarity, rollStats, hashStringFnv1a } = require('./lib/rng')
const { resolveArgs } = require('./lib/args-parser')

const args = resolveArgs(process.argv, {
  timeout: {
    type: 'number',
    default: 15,
    desc: '限时搜索秒数',
  },
}, {
  scriptName: 'node buddy-reroll-advanced.js',
  description: '限时单核暴力刷取传说级闪光宠物',
  examples: [
    'node buddy-reroll-advanced.js --species dragon --timeout 15',
    'node buddy-reroll-advanced.js dragon 15',
    'node buddy-reroll-advanced.js --species cat --min-rarity epic --require-shiny --timeout 30',
    'node buddy-reroll-advanced.js --species owl --salt custom-salt-123 --timeout 60',
  ],
})

const {
  species: TARGET_SPECIES,
  timeout: RUN_SECONDS,
  salt: SALT,
  'min-rarity': MIN_RARITY,
  'require-shiny': REQUIRE_SHINY,
} = args

const minRarityRank = RARITY_RANK[MIN_RARITY]

let best = { sum: 0, uid: '', stats: {}, shiny: false, rarity: 'common', species: '' }
console.log(`===============================================`)
console.log(`开始在 ${RUN_SECONDS} 秒内暴力刷取 ${MIN_RARITY}+${REQUIRE_SHINY ? ' 闪光' : ''} ${TARGET_SPECIES}！`)
console.log(`程序将自动保留运行时间内遇到的总属性最高的极品个体...`)
console.log(`===============================================`)

const endTime = Date.now() + RUN_SECONDS * 1000
let loops = 0

while (Date.now() < endTime) {
  loops++
  for (let j = 0; j < 50000; j++) {
    const uid = crypto.randomBytes(32).toString('hex')
    const key = uid + SALT
    const rng = mulberry32(hashStringFnv1a(key))

    const rarity = rollRarity(rng)
    if (RARITY_RANK[rarity] < minRarityRank) continue

    const species = pick(rng, SPECIES)
    if (species !== TARGET_SPECIES) continue

    // Must call these for RNG state consistency
    const eye = pick(rng, EYES)
    const hat = rarity === 'common' ? 'none' : pick(rng, HATS)
    const shiny = rng() < 0.01

    if (REQUIRE_SHINY && !shiny) continue

    const stats = rollStats(rng, rarity)
    const sum = Object.values(stats).reduce((a, b) => a + b, 0)

    if (sum > best.sum) {
      best = { uid, rarity, species, shiny, stats, sum }
      console.log(`[新纪录] ${rarity}${shiny ? ' 闪光' : ''} ${species}！总属性=${sum} / UID: ${uid.substring(0, 8)}... (${(loops * 50000 + j) / 10000}万次运算)`)
    }
  }
}

console.log(`\n===============================================`)
console.log(`搜索结束！总共运行了 ${Math.floor((loops * 50000) / 10000)} 万次哈希运算。`)
if (!best.uid) {
  console.log('运气不佳，在设定时间内未刷到符合条件的个体，请增加时间或放宽条件后重试。')
} else {
  console.log(`最佳捕获: ${best.rarity} ${best.shiny ? '✨ Shiny✨ ' : ''}${best.species}`)
  console.log(`隐藏属性面板 (总评: ${best.sum}分，理论极端分421分):`)
  for (const [key, val] of Object.entries(best.stats)) {
    console.log(`   - ${key.padEnd(10)}: ${val}  ${val >= 95 ? '<--- Peak' : (val <= 54 ? '<--- Dump' : '')}`)
  }
  console.log(`   ${best.uid}`)

  // Update ~/.claude.json
  const configFile = require('os').homedir() + '/.claude.json'
  try {
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile))
      config.userID = best.uid
      delete config.companion
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
      console.log(`\n✅ 已自动为您将最佳记录的 userID 替换至 ~/.claude.json 配置文件！并清除了历史档案！`)
      console.log(`马上重开一段对话，立刻启动 /buddy 领养神明！`)
    }
  } catch (err) {
    console.log(`\n❌ 更新 ~/.claude.json 时发生错误：`, err)
  }
}
