const crypto = require('crypto')
const fs = require('fs')

const SALT = 'friend-2026-401'
const SPECIES = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']
const EYES = ['·', '✦', '×', '◉', '@', '°']
const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }

// FNV-1a hash (for Node standard installation)
function hashString(s) {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function mulberry32(seed) {
    let a = seed >>> 0
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }

function rollRarity(rng) {
    let roll = rng() * 100
    for (const rarity of RARITIES) {
        roll -= RARITY_WEIGHTS[rarity]
        if (roll < 0) return rarity
    }
    return 'common'
}

const RARITY_FLOOR = {
    common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50,
}

function rollStats(rng, rarity) {
    const floor = RARITY_FLOOR[rarity]
    const peak = pick(rng, STAT_NAMES)
    let dump = pick(rng, STAT_NAMES)
    while (dump === peak) dump = pick(rng, STAT_NAMES)

    const stats = {}
    for (const name of STAT_NAMES) {
        if (name === peak) {
            stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
        } else if (name === dump) {
            stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
        } else {
            stats[name] = floor + Math.floor(rng() * 40)
        }
    }
    return stats
}

const TARGET_SPECIES = process.argv[2] || 'dragon'
const RUN_SECONDS = parseInt(process.argv[3]) || 15

if (!SPECIES.includes(TARGET_SPECIES)) {
    console.error(`未知物种: ${TARGET_SPECIES}\n可选: ${SPECIES.join(', ')}`)
    process.exit(1)
}

let best = { sum: 0, uid: '', stats: {}, shiny: false, rarity: 'common', species: '' }
console.log(`===============================================`)
console.log(`开始在 ${RUN_SECONDS} 秒内暴力刷取 传说级 + 闪光 + ${TARGET_SPECIES}！`)
console.log(`程序将自动保留运行时间内遇到的总属性最高的极品个体...`)
console.log(`===============================================`)

const endTime = Date.now() + RUN_SECONDS * 1000
let loops = 0

// 大规模高频循环
while (Date.now() < endTime) {
    loops++
    // Batch processing
    for (let j = 0; j < 50000; j++) {
        const uid = crypto.randomBytes(32).toString('hex')
        const key = uid + SALT
        const rng = mulberry32(hashString(key))

        // Exact same RNG order as buddy/companion.ts
        const rarity = rollRarity(rng)
        if (rarity !== 'legendary') continue

        const species = pick(rng, SPECIES)
        if (species !== TARGET_SPECIES) continue

        // Must call these for RNG state
        const eye = pick(rng, EYES)
        const hat = rarity === 'common' ? 'none' : pick(rng, HATS)
        const shiny = rng() < 0.01

        if (!shiny) continue

        const stats = rollStats(rng, rarity)
        const sum = Object.values(stats).reduce((a, b) => a + b, 0)

        if (sum > best.sum) {
            best = { uid, rarity, species, shiny, stats, sum }
            console.log(`[新纪录] 寻找出闪光传说体！总属性=${sum} / UID: ${uid.substring(0, 8)}... (${(loops * 50000 + j) / 10000}万次运算)`)
        }
    }
}

console.log(`\n===============================================`)
console.log(`搜索结束！总共运行了 ${Math.floor((loops * 50000) / 10000)} 万次哈希运算。`)
if (!best.uid) {
    console.log("运气不佳，在设定时间内未刷到神级极品，请增加时间或重试。")
} else {
    console.log(`🏆 最佳捕获: ${best.rarity} ${best.shiny ? '✨ Shiny✨ ' : ''}${best.species}`)
    console.log(`💥 隐藏属性面板 (总评: ${best.sum}分，理论极端分421分):`)
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
