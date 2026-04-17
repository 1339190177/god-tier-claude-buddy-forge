/**
 * Claude Buddy 宠物搜索 Web Worker
 * 在后台线程执行搜索，避免阻塞 UI
 */

// 常量（与 lib/constants.js 一致）
const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
];

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 };
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];

// 搜索状态
let isRunning = false;
let shouldStop = false;
let params = null;
let foundCount = 0;

/**
 * Mulberry32 PRNG — 与 lib/rng.js 一致
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a hash — 与 lib/rng.js 一致
 * npm 安装的 Claude Code 使用此算法
 */
function hashStringFnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 滚动稀有度
 */
function rollRarity(rng) {
  let roll = rng() * 100;
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity];
    if (roll < 0) return rarity;
  }
  return 'common';
}

/**
 * 滚动属性
 */
function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity];
  const peak = pick(rng, STAT_NAMES);
  let dump = pick(rng, STAT_NAMES);
  while (dump === peak) dump = pick(rng, STAT_NAMES);

  const stats = {};
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30));
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15));
    } else {
      stats[name] = floor + Math.floor(rng() * 40);
    }
  }
  return stats;
}

/**
 * 生成随机 userID (hex string)
 */
function generateUserID(seed) {
  const chars = '0123456789abcdef';
  let result = '';
  const rng = mulberry32(seed);
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(rng() * 16)];
  }
  return result;
}

/**
 * 从 userID 生成宠物
 */
function generatePet(userID, salt) {
  const hash = hashStringFnv1a(userID + salt);
  const rng = mulberry32(hash);

  const species = pick(rng, SPECIES);
  const rarity = rollRarity(rng);
  const stats = rollStats(rng, rarity);
  const shiny = rng() < 0.05; // 5% 闪光概率

  return { species, rarity, stats, shiny };
}

/**
 * 判断宠物是否符合条件
 */
function matchesCriteria(pet, criteria) {
  // 检查稀有度
  if (RARITY_RANK[pet.rarity] < RARITY_RANK[criteria.minRarity]) {
    return false;
  }
  // 检查闪光
  if (criteria.requireShiny && !pet.shiny) {
    return false;
  }
  // 检查物种（只检查指定的，其他也返回作为额外发现）
  return pet.species === criteria.species;
}

/**
 * 发送进度更新
 */
function sendProgress(attempts) {
  self.postMessage({
    type: 'progress',
    data: { attempts, found: foundCount, maxAttempts: params.maxAttempts }
  });
}

/**
 * 发送找到的结果
 */
function sendFound(pet, userID) {
  self.postMessage({
    type: 'found',
    data: { ...pet, userID }
  });
}

/**
 * 主搜索循环
 */
function search() {
  const { species, minRarity, requireShiny, salt, maxAttempts } = params;
  const criteria = { species, minRarity, requireShiny };

  // 每次批量处理的数量
  const BATCH_SIZE = 1000;
  const PROGRESS_INTERVAL = 10000; // 每 1 万次发送一次进度

  for (let i = 0; i < maxAttempts && !shouldStop; i++) {
    const userID = generateUserID(i);
    const pet = generatePet(userID, salt);

    if (matchesCriteria(pet, criteria)) {
      foundCount++;
      sendFound(pet, userID);
    }

    // 定期发送进度
    if (i % PROGRESS_INTERVAL === 0 || i === maxAttempts - 1) {
      sendProgress(i + 1);
    }

    // 让出控制权，避免阻塞
    if (i % BATCH_SIZE === 0 && i > 0) {
      // 使用 setTimeout 让事件循环有机会处理其他任务
      yieldToMain();
    }
  }

  // 搜索完成
  self.postMessage({
    type: 'complete',
    data: { totalFound: foundCount, totalAttempts: maxAttempts }
  });

  isRunning = false;
}

/**
 * 让出控制权给主线程
 */
function yieldToMain() {
  // 在 Worker 中，我们不需要真正的 yield，
  // 但分批处理有助于定期发送进度更新
}

/**
 * 消息处理
 */
self.onmessage = function(e) {
  const { type, params: searchParams } = e.data;

  switch (type) {
    case 'start':
      if (!isRunning) {
        params = searchParams;
        shouldStop = false;
        foundCount = 0;
        isRunning = true;
        search();
      }
      break;

    case 'stop':
      shouldStop = true;
      break;
  }
};
