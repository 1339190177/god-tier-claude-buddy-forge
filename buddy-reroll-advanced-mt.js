#!/usr/bin/env node
/**
 * Claude Code /buddy 宠物刷取脚本 — 多线程模式
 *
 * 用法:
 *   node buddy-reroll-advanced-mt.js --species dragon --timeout 60 --threads 8
 *   node buddy-reroll-advanced-mt.js dragon 60 8               (向后兼容位置参数)
 *   node buddy-reroll-advanced-mt.js --help
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
  const { resolveArgs } = require('./lib/args-parser');

  const args = resolveArgs(
    process.argv,
    {
      timeout: {
        type: 'number',
        default: 60,
        desc: '限时搜索秒数',
      },
      threads: {
        type: 'number',
        default: os.cpus().length || 4,
        desc: '最大线程数',
      },
    },
    {
      scriptName: 'node buddy-reroll-advanced-mt.js',
      description: '多线程暴力刷取传说级闪光宠物',
      examples: [
        'node buddy-reroll-advanced-mt.js --species dragon --timeout 60 --threads 8',
        'node buddy-reroll-advanced-mt.js dragon 60 8',
        'node buddy-reroll-advanced-mt.js --species cat --min-rarity epic --require-shiny --timeout 120',
        'node buddy-reroll-advanced-mt.js --species owl --salt custom-salt --threads 16 --timeout 30',
      ],
    },
  );

  const {
    species: TARGET_SPECIES,
    timeout: runSeconds,
    threads: numWorkers,
    salt: SALT,
    'min-rarity': MIN_RARITY,
    'require-shiny': REQUIRE_SHINY,
  } = args;

  let bestGlobal = { sum: 0 };
  let finishedWorkers = 0;
  let totalHashes = 0;

  console.log('===============================================');
  console.log(
    `[战神机制启动] 调动全部 ${numWorkers} 个 CPU 核心矩阵并发暴力寻址...`,
  );
  console.log(
    `目标：${MIN_RARITY}+${REQUIRE_SHINY ? ' 闪光' : ''} ${TARGET_SPECIES}`,
  );
  console.log(`请耐心等待 ${runSeconds} 秒钟...`);
  console.log('===============================================');

  const workers = [];
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        runSeconds,
        TARGET_SPECIES,
        SALT,
        MIN_RARITY,
        REQUIRE_SHINY,
      },
    });
    workers.push(worker);
    worker.on('message', msg => {
      if (msg.type === 'best') {
        if (msg.best.sum > bestGlobal.sum) {
          bestGlobal = msg.best;
          console.log(
            `[新王诞生] 🎯 计算节点破纪录！当前最强总分: ${bestGlobal.sum} \t(天花板421分) / UID: ${bestGlobal.uid.substring(0, 8)}...`,
          );
        }
      }
      if (msg.type === 'done') {
        totalHashes += msg.loops * 50000;
        finishedWorkers++;
        if (finishedWorkers === numWorkers) {
          console.log('\n===============================================');
          console.log(
            `[运算中止] 跨核并发搜查宣告结束！群集节点总共核算了约 ${Math.floor(totalHashes / 10000)} 万个宇宙平行可能。`,
          );
          if (bestGlobal.uid) {
            console.log(
              `🏆 迎回不可思议的绝品宠王: ${bestGlobal.rarity} ${bestGlobal.shiny ? '✨ Shiny✨ ' : ''}${bestGlobal.species}`,
            );
            console.log(
              `💥 霸道面板 (实分: ${bestGlobal.sum}，距源码数学计算封顶理论值仅相差区区 ${421 - bestGlobal.sum} 分!):`,
            );
            for (const [key, val] of Object.entries(bestGlobal.stats)) {
              console.log(
                `   - ${key.padEnd(10)}: ${val}  \t${val >= 95 ? '<--- Peak主天赋!' : val <= 54 ? '<--- 系统必定残缺的Dump底层限定' : ''}`,
              );
            }
            console.log(`\n💎 您的跨时代 UID 为：\n   ${bestGlobal.uid}`);

            const configFile = require('os').homedir() + '/.claude.json';
            try {
              if (fs.existsSync(configFile)) {
                const config = JSON.parse(fs.readFileSync(configFile));
                config.userID = bestGlobal.uid;
                delete config.companion;
                fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
                console.log(
                  '\n✅ 已经用雷霆般的速度将该 UID 安全覆写至 ~/.claude.json ，直接去 /buddy 吸宠吧！！',
                );
              }
            } catch (e) {
              console.log('写入替换配置失败，请手动写入 UID。');
            }
          }
        }
      }
    });
  }
} else {
  // Worker code logic
  const crypto = require('crypto');
  const { SPECIES, RARITY_RANK, EYES, HATS } = require('./lib/constants');
  const {
    mulberry32,
    pick,
    rollRarity,
    rollStats,
    hashStringFnv1a,
  } = require('./lib/rng');

  const { runSeconds, TARGET_SPECIES, SALT, MIN_RARITY, REQUIRE_SHINY } =
    workerData;
  const minRarityRank = RARITY_RANK[MIN_RARITY];

  const endTime = Date.now() + runSeconds * 1000;
  let best = { sum: 0 };
  let loops = 0;

  while (Date.now() < endTime) {
    loops++;
    for (let j = 0; j < 50000; j++) {
      const uid = crypto.randomBytes(32).toString('hex');
      const rng = mulberry32(hashStringFnv1a(uid + SALT));

      const rarity = rollRarity(rng);
      if (RARITY_RANK[rarity] < minRarityRank) continue;

      const species = pick(rng, SPECIES);
      if (species !== TARGET_SPECIES) continue;

      pick(rng, EYES);
      if (rarity !== 'common') pick(rng, HATS);
      const shiny = rng() < 0.01;

      if (REQUIRE_SHINY && !shiny) continue;

      const stats = rollStats(rng, rarity);
      const sum = Object.values(stats).reduce((a, b) => a + b, 0);
      if (sum > best.sum) {
        best = { uid, rarity, species, shiny, stats, sum };
        parentPort.postMessage({ type: 'best', best });
      }
    }
  }
  parentPort.postMessage({ type: 'done', loops });
}
