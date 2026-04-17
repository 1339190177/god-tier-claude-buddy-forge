#!/usr/bin/env node
/**
 * Claude Code /buddy 宠物刷取脚本 — 全量宇宙搜索
 *
 * 用法:
 *   node crack-universe.js --species dragon --dump-stat SNARK --threads 8
 *   node crack-universe.js dragon SNARK 8               (向后兼容位置参数)
 *   node crack-universe.js --help
 *
 * 注意: --dump-stat 仅限此模式，用于指定短板属性
 */

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require('worker_threads');
const os = require('os');
const fs = require('fs');

if (isMainThread) {
  const { STAT_NAMES } = require('./lib/constants');
  const { resolveArgs } = require('./lib/args-parser');

  const args = resolveArgs(
    process.argv,
    {
      threads: {
        type: 'number',
        default: os.cpus().length || 4,
        desc: '最大线程数',
      },
      'dump-stat': {
        type: 'string',
        default: 'SNARK',
        desc: '短板属性 (仅限全量宇宙搜索模式)',
        validate: v => STAT_NAMES.includes(v),
        errMsg: v => `未知Dump属性: ${v}\n可选: ${STAT_NAMES.join(', ')}`,
      },
    },
    {
      scriptName: 'node crack-universe.js',
      description: '全量宇宙搜索 — 遍历 42.9 亿种 RNG 状态寻找完美个体',
      examples: [
        'node crack-universe.js --species dragon --dump-stat SNARK --threads 8',
        'node crack-universe.js dragon SNARK 8',
        'node crack-universe.js --species cat --dump-stat CHAOS --salt custom-salt',
        'node crack-universe.js --species owl --dump-stat PATIENCE --min-rarity epic',
      ],
    },
  );

  const {
    species: TARGET_SPECIES,
    'dump-stat': TARGET_DUMP,
    threads: numWorkers,
    salt: SALT,
    'min-rarity': MIN_RARITY,
    'require-shiny': REQUIRE_SHINY,
  } = args;

  const SEED_MAX = 0xffffffff;
  const CHUNK_SIZE = Math.ceil(SEED_MAX / numWorkers);

  console.log('========================================================');
  console.log('[降维打击程序启动] 开始介入底层数学铁律。');
  console.log(
    '已知：系统 RNG 为 32位，全宇宙平行的随机状态上限有且仅有 42.9亿 种。',
  );
  console.log('动作：放弃传统随缘抽卡，开始直接历遍整个宇宙的所有运行结果！');
  console.log(
    `我们将在几十秒内找出宇宙中所有 【短板=${TARGET_DUMP}】 且物种为【${TARGET_SPECIES}】的最高个体！`,
  );
  console.log('========================================================');

  let bestGlobalSeed = -1;
  let bestGlobalSum = -1;
  let bestGlobalStats = null;
  let stage1Finished = 0;

  for (let i = 0; i < numWorkers; i++) {
    const startSeed = i * CHUNK_SIZE;
    const endSeed = Math.min(SEED_MAX, startSeed + CHUNK_SIZE - 1);

    const worker = new Worker(__filename, {
      workerData: {
        phase: 1,
        startSeed,
        endSeed,
        TARGET_SPECIES,
        TARGET_DUMP,
        SALT,
        MIN_RARITY,
        REQUIRE_SHINY,
      },
    });

    worker.on('message', msg => {
      if (msg.type === 'phase1_done') {
        stage1Finished++;
        if (msg.bestSum > bestGlobalSum) {
          bestGlobalSum = msg.bestSum;
          bestGlobalSeed = msg.bestSeed;
          bestGlobalStats = msg.bestStats;
        }

        console.log(
          `[全知之眼] 探针节点 ${stage1Finished}/${numWorkers} 返回搜索报告。`,
        );

        if (stage1Finished === numWorkers) {
          console.log('\n✅ 宇宙切面全状态扫描完毕！！！');
          console.log('在全部 42.9 亿种命运空间中：');
          if (bestGlobalSum === 421) {
            console.log(
              `🎉 奇迹震旦！全宇宙中居然真的存在 421 分满级且短板为 ${TARGET_DUMP} 的种子！`,
            );
          } else if (bestGlobalSum === -1) {
            console.log(
              '⚠️ 无效结果：宇宙中不存在同时闪光传说且复合这些条件的组合。',
            );
            process.exit(1);
          } else {
            console.log(
              `⚠️ 铁证真理：即便找遍宇宙，指定被削弱属性为 ${TARGET_DUMP} 的最高形态只能是 ${bestGlobalSum} 分！这就是世界的尽头。`,
            );
          }
          console.log(`提取出的造物主密码种子 ID 为: ${bestGlobalSeed >>> 0}`);
          console.log('其出土究极神圣面板:', bestGlobalStats);

          console.log(
            '\n🚀 [第二阶段启动]：进入高频哈希碰撞解码槽...（耗时取决于算力脸）',
          );

          let collisionFound = false;
          for (let j = 0; j < numWorkers; j++) {
            const hashWorker = new Worker(__filename, {
              workerData: {
                phase: 2,
                targetSeed: bestGlobalSeed,
                SALT,
                prefix: `THE_ONE_${Math.random().toString(36).substring(2, 6)}_${j}_`,
              },
            });
            hashWorker.on('message', m => {
              if (m.type === 'found' && !collisionFound) {
                collisionFound = true;
                console.log(
                  `\n🎉🎉 逆向碰撞密码破译成功！！我们为您抢回了降临此神明所对应的通行证 UID: \n   ${m.uid}`,
                );

                const configFile = require('os').homedir() + '/.claude.json';
                try {
                  if (fs.existsSync(configFile)) {
                    const config = JSON.parse(fs.readFileSync(configFile));
                    config.userID = m.uid;
                    delete config.companion;
                    fs.writeFileSync(
                      configFile,
                      JSON.stringify(config, null, 2),
                    );
                    console.log(
                      '\n✅ 神级面板通行证已经强行注入至您的 ~/.claude.json ！！您做到了！！',
                    );
                  }
                } catch (e) {
                  // Ignore config write errors
                }
                process.exit(0);
              }
            });
          }
        }
      }
    });
  }
} else {
  // Worker Thread Content
  const {
    SPECIES,
    STAT_NAMES,
    RARITIES,
    RARITY_WEIGHTS,
    RARITY_RANK,
  } = require('./lib/constants');

  if (workerData.phase === 1) {
    let bestSum = 0;
    let bestSeed = -1;
    let bestStats = null;

    const targetSpIdx = SPECIES.indexOf(workerData.TARGET_SPECIES);
    const targetDumpIdx = STAT_NAMES.indexOf(workerData.TARGET_DUMP);
    const minRarityRank = RARITY_RANK[workerData.MIN_RARITY];

    for (let seed = workerData.startSeed; seed <= workerData.endSeed; seed++) {
      let a = seed >>> 0;
      // eslint-disable-next-line no-inner-declarations
      function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }

      // Rarity check — must meet min-rarity threshold
      const roll = next() * 100;
      let rarityIdx = 0;
      let rarityVal = roll;
      for (let ri = 0; ri < RARITIES.length; ri++) {
        rarityVal -= RARITY_WEIGHTS[RARITIES[ri]];
        if (rarityVal < 0) {
          rarityIdx = ri;
          break;
        }
      }
      if (rarityIdx < minRarityRank) continue;
      // Only legendary (index 4) passes the original 99% skip
      if (rarityIdx < 4) continue;

      const sp = Math.floor(next() * 18);
      if (sp !== targetSpIdx) continue;

      next();
      next(); // eye + hat

      if (next() >= 0.01) continue; // shiny check — always required for crack-universe

      const peakIdx = Math.floor(next() * 5);
      let dumpIdx = Math.floor(next() * 5);
      while (dumpIdx === peakIdx) {
        dumpIdx = Math.floor(next() * 5);
      }

      if (dumpIdx !== targetDumpIdx) continue;

      let sum = 0;
      const stats = {};

      for (let i = 0; i < 5; i++) {
        const nm = STAT_NAMES[i];
        if (i === peakIdx) {
          const v = Math.min(100, 100 + Math.floor(next() * 30));
          stats[nm] = v;
          sum += v;
        } else if (i === dumpIdx) {
          const v = Math.max(1, 40 + Math.floor(next() * 15));
          stats[nm] = v;
          sum += v;
        } else {
          const v = 50 + Math.floor(next() * 40);
          stats[nm] = v;
          sum += v;
        }
      }

      if (sum > bestSum) {
        bestSum = sum;
        bestSeed = seed;
        bestStats = stats;
      }
    }

    parentPort.postMessage({
      type: 'phase1_done',
      bestSum,
      bestSeed,
      bestStats,
    });
  } else if (workerData.phase === 2) {
    const target = workerData.targetSeed;
    const prefix = workerData.prefix;
    const saltStr = workerData.SALT;

    let counter = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const uidStr = prefix + counter;
      let h = 2166136261;
      const composite = uidStr + saltStr;
      for (let i = 0; i < composite.length; i++) {
        h ^= composite.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      if (h >>> 0 === target) {
        parentPort.postMessage({ type: 'found', uid: uidStr });
        break;
      }
      counter++;
    }
  }
}
