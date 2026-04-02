const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const os = require('os')
const fs = require('fs')
const SPECIES_LIST = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']

if (isMainThread) {
    // 接受命令行参数：node script.js [物种] [时限秒] [最大线程数]
    const TARGET_SPECIES = process.argv[2] || 'dragon'
    const runSeconds = parseInt(process.argv[3]) || 60
    const numWorkers = parseInt(process.argv[4]) || os.cpus().length || 4

    if (!SPECIES_LIST.includes(TARGET_SPECIES)) {
        console.error(`未知物种: ${TARGET_SPECIES}\n可选: ${SPECIES_LIST.join(', ')}`)
        process.exit(1)
    }

    let bestGlobal = { sum: 0 }
    let finishedWorkers = 0
    let totalHashes = 0

    console.log(`===============================================`)
    console.log(`[战神机制启动] 调动全部 ${numWorkers} 个 CPU 核心矩阵并发暴力寻址...`)
    console.log(`目标：不篡改源码内的最终极天花板（传说级闪光 ✨ ${TARGET_SPECIES}）`)
    console.log(`请耐心等待 ${runSeconds} 秒钟...`)
    console.log(`===============================================`)

    const workers = []
    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(__filename, { workerData: { runSeconds, TARGET_SPECIES } })
        workers.push(worker)
        worker.on('message', (msg) => {
            if (msg.type === 'best') {
                if (msg.best.sum > bestGlobal.sum) {
                    bestGlobal = msg.best
                    console.log(`[新王诞生] 🎯 计算节点破纪录！当前最强总分: ${bestGlobal.sum} \t(天花板421分) / UID: ${bestGlobal.uid.substring(0, 8)}...`)
                }
            }
            if (msg.type === 'done') {
                totalHashes += msg.loops * 50000
                finishedWorkers++
                if (finishedWorkers === numWorkers) {
                    console.log(`\n===============================================`)
                    console.log(`[运算中止] 跨核并发搜查宣告结束！群集节点总共核算了约 ${Math.floor(totalHashes / 10000)} 万个宇宙平行可能。`)
                    if (bestGlobal.uid) {
                        console.log(`🏆 迎回不可思议的绝品宠王: ${bestGlobal.rarity} ${bestGlobal.shiny ? '✨ Shiny✨ ' : ''}${bestGlobal.species}`)
                        console.log(`💥 霸道面板 (实分: ${bestGlobal.sum}，距源码数学计算封顶理论值仅相差区区 ${421 - bestGlobal.sum} 分!):`)
                        for (const [key, val] of Object.entries(bestGlobal.stats)) {
                            console.log(`   - ${key.padEnd(10)}: ${val}  \t${val >= 95 ? '<--- Peak主天赋!' : (val <= 54 ? '<--- 系统必定残缺的Dump底层限定' : '')}`)
                        }
                        console.log(`\n💎 您的跨时代 UID 为：\n   ${bestGlobal.uid}`)

                        const configFile = require('os').homedir() + '/.claude.json'
                        try {
                            if (fs.existsSync(configFile)) {
                                const config = JSON.parse(fs.readFileSync(configFile))
                                config.userID = bestGlobal.uid
                                delete config.companion
                                fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
                                console.log(`\n✅ 已经用雷霆般的速度将该 UID 安全覆写至 ~/.claude.json ，直接去 /buddy 吸宠吧！！`)
                            }
                        } catch (e) {
                            console.log(`写入替换配置失败，请手动写入 UID。`)
                        }
                    }
                }
            }
        })
    }

} else {
    // Worker code logic
    const crypto = require('crypto')
    const SALT = 'friend-2026-401'
    const SPECIES = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']
    const EYES = ['·', '✦', '×', '◉', '@', '°']
    const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']
    const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']
    const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }

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
            a |= 0; a = (a + 0x6d2b79f5) | 0
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

    const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }

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

    const endTime = Date.now() + workerData.runSeconds * 1000
    const TARGET_SPECIES = workerData.TARGET_SPECIES
    let best = { sum: 0 }
    let loops = 0

    while (Date.now() < endTime) {
        loops++
        for (let j = 0; j < 50000; j++) {
            const uid = crypto.randomBytes(32).toString('hex')
            const rng = mulberry32(hashString(uid + SALT))

            const rarity = rollRarity(rng)
            if (rarity !== 'legendary') continue

            const species = pick(rng, SPECIES)
            if (species !== TARGET_SPECIES) continue

            pick(rng, EYES)
            if (rarity !== 'common') pick(rng, HATS)
            if (rng() >= 0.01) continue

            const stats = rollStats(rng, rarity)
            const sum = Object.values(stats).reduce((a, b) => a + b, 0)
            if (sum > best.sum) {
                best = { uid, rarity, species, shiny: true, stats, sum }
                parentPort.postMessage({ type: 'best', best })
            }
        }
    }
    parentPort.postMessage({ type: 'done', loops })
}
