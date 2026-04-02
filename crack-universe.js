const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const os = require('os')
const fs = require('fs')

const SPECIES_LIST = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']
const STAT_NAMES_LIST = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']

if (isMainThread) {
    // 接受命令行参数：node crack-universe.js [物种] [短板属性] [最大线程数]
    const TARGET_SPECIES = process.argv[2] || 'dragon'
    const TARGET_DUMP = process.argv[3] || 'SNARK'
    const numWorkers = parseInt(process.argv[4]) || os.cpus().length || 4

    if (!SPECIES_LIST.includes(TARGET_SPECIES)) {
        console.error(`未知物种: ${TARGET_SPECIES}\n可选: ${SPECIES_LIST.join(', ')}`)
        process.exit(1)
    }
    if (!STAT_NAMES_LIST.includes(TARGET_DUMP)) {
        console.error(`未知Dump属性: ${TARGET_DUMP}\n可选: ${STAT_NAMES_LIST.join(', ')}`)
        process.exit(1)
    }

    const SEED_MAX = 0xffffffff
    const CHUNK_SIZE = Math.ceil(SEED_MAX / numWorkers)

    console.log(`========================================================`)
    console.log(`[降维打击程序启动] 开始介入底层数学铁律。`)
    console.log(`已知：系统 RNG 为 32位，全宇宙平行的随机状态上限有且仅有 42.9亿 种。`)
    console.log(`动作：放弃传统随缘抽卡，开始直接历遍整个宇宙的所有运行结果！`)
    console.log(`我们将在几十秒内找出宇宙中所有 【短板=${TARGET_DUMP}】 且物种为【${TARGET_SPECIES}】的最高个体！`)
    console.log(`========================================================`)

    let bestGlobalSeed = -1
    let bestGlobalSum = -1
    let bestGlobalStats = null
    let stage1Finished = 0

    for (let i = 0; i < numWorkers; i++) {
        const startSeed = i * CHUNK_SIZE
        const endSeed = Math.min(SEED_MAX, startSeed + CHUNK_SIZE - 1)

        const worker = new Worker(__filename, {
            workerData: { phase: 1, startSeed, endSeed, TARGET_SPECIES, TARGET_DUMP }
        })

        worker.on('message', (msg) => {
            if (msg.type === 'phase1_done') {
                stage1Finished++
                if (msg.bestSum > bestGlobalSum) {
                    bestGlobalSum = msg.bestSum
                    bestGlobalSeed = msg.bestSeed
                    bestGlobalStats = msg.bestStats
                }

                console.log(`[全知之眼] 探针节点 ${stage1Finished}/${numWorkers} 返回搜索报告。`)

                if (stage1Finished === numWorkers) {
                    console.log(`\n✅ 宇宙切面全状态扫描完毕！！！`)
                    console.log(`在全部 42.9 亿种命运空间中：`)
                    if (bestGlobalSum === 421) {
                        console.log(`🎉 奇迹震旦！全宇宙中居然真的存在 421 分满级且短板为 ${TARGET_DUMP} 的种子！`)
                    } else if (bestGlobalSum === -1) {
                        console.log(`⚠️ 无效结果：宇宙中不存在同时闪光传说且复合这些条件的组合。`)
                        process.exit(1)
                    } else {
                        console.log(`⚠️ 铁证真理：即便找遍宇宙，指定被削弱属性为 ${TARGET_DUMP} 的最高形态只能是 ${bestGlobalSum} 分！这就是世界的尽头。`)
                    }
                    console.log(`提取出的造物主密码种子 ID 为: ${bestGlobalSeed >>> 0}`)
                    console.log(`其出土究极神圣面板:`, bestGlobalStats)

                    console.log(`\n🚀 [第二阶段启动]：进入高频哈希碰撞解码槽...（耗时取决于算力脸）`)

                    let collisionFound = false
                    for (let j = 0; j < numWorkers; j++) {
                        const hashWorker = new Worker(__filename, {
                            workerData: { phase: 2, targetSeed: bestGlobalSeed, prefix: `THE_ONE_${Math.random().toString(36).substring(2, 6)}_${j}_` }
                        })
                        hashWorker.on('message', (m) => {
                            if (m.type === 'found' && !collisionFound) {
                                collisionFound = true
                                console.log(`\n🎉🎉 逆向碰撞密码破译成功！！我们为您抢回了降临此神明所对应的通行证 UID: \n   ${m.uid}`)

                                const configFile = require('os').homedir() + '/.claude.json'
                                try {
                                    if (fs.existsSync(configFile)) {
                                        const config = JSON.parse(fs.readFileSync(configFile))
                                        config.userID = m.uid
                                        delete config.companion
                                        fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
                                        console.log(`\n✅ 神级面板通行证已经强行注入至您的 ~/.claude.json ！！您做到了！！`)
                                    }
                                } catch (e) { }
                                process.exit(0)
                            }
                        })
                    }
                }
            }
        })
    }
} else {
    // Worker Thread Content
    if (workerData.phase === 1) {
        let bestSum = 0
        let bestSeed = -1
        let bestStats = null

        const SPECIES = ['duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk']
        const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']

        const targetSpIdx = SPECIES.indexOf(workerData.TARGET_SPECIES)
        const targetDumpIdx = STAT_NAMES.indexOf(workerData.TARGET_DUMP)

        for (let seed = workerData.startSeed; seed <= workerData.endSeed; seed++) {
            let a = seed >>> 0
            function next() {
                a |= 0; a = (a + 0x6d2b79f5) | 0
                let t = Math.imul(a ^ (a >>> 15), 1 | a)
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296
            }

            let roll = next() * 100
            if (roll < 99) continue

            let sp = Math.floor(next() * 18)
            if (sp !== targetSpIdx) continue

            next(); next()

            if (next() >= 0.01) continue

            const peakIdx = Math.floor(next() * 5)
            let dumpIdx = Math.floor(next() * 5)
            while (dumpIdx === peakIdx) {
                dumpIdx = Math.floor(next() * 5)
            }

            if (dumpIdx !== targetDumpIdx) continue

            let sum = 0
            let stats = {}

            for (let i = 0; i < 5; i++) {
                let nm = STAT_NAMES[i]
                if (i === peakIdx) {
                    let v = Math.min(100, 100 + Math.floor(next() * 30))
                    stats[nm] = v
                    sum += v
                } else if (i === dumpIdx) {
                    let v = Math.max(1, 40 + Math.floor(next() * 15))
                    stats[nm] = v
                    sum += v
                } else {
                    let v = 50 + Math.floor(next() * 40)
                    stats[nm] = v
                    sum += v
                }
            }

            if (sum > bestSum) {
                bestSum = sum
                bestSeed = seed
                bestStats = stats
            }
        }

        parentPort.postMessage({ type: 'phase1_done', bestSum, bestSeed, bestStats })
    }
    else if (workerData.phase === 2) {
        const target = workerData.targetSeed
        const prefix = workerData.prefix
        const saltStr = "friend-2026-401"

        let counter = 0
        while (true) {
            const uidStr = prefix + counter
            let h = 2166136261
            const composite = uidStr + saltStr
            for (let i = 0; i < composite.length; i++) {
                h ^= composite.charCodeAt(i)
                h = Math.imul(h, 16777619)
            }
            if ((h >>> 0) === target) {
                parentPort.postMessage({ type: 'found', uid: uidStr })
                break
            }
            counter++
        }
    }
}
