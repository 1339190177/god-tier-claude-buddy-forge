/**
 * @fileoverview Claude Buddy 宠物搜索 Web Worker
 * @description 在后台线程执行搜索，避免阻塞 UI
 * @module web/worker
 */

import {
  SPECIES,
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_RANK,
  RARITY_FLOOR,
  STAT_NAMES,
} from './constants.js';

// 搜索状态
/** @type {boolean} 是否正在运行 */
let isRunning = false;

/** @type {boolean} 是否应该停止 */
let shouldStop = false;

/** @type {SearchParams|null} 当前搜索参数 */
let params = null;

/** @type {number} 已找到的数量 */
let foundCount = 0;

/**
 * Mulberry32 PRNG — 32位状态种子伪随机数生成器
 *
 * 与 lib/rng.js 一致，Claude Code buddy 系统使用的 PRNG 算法
 *
 * @param {number} seed - 32位整数种子
 * @returns {() => number} 返回一个生成 [0, 1) 范围内随机数的函数
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 哈希函数
 *
 * npm 安装的 Claude Code 使用此算法
 *
 * @param {string} s - 输入字符串
 * @returns {number} 32位哈希值
 */
function hashStringFnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 从数组中随机选择一个元素
 *
 * @param {() => number} rng - 随机数生成器
 * @param {Array} arr - 数组
 * @returns {*} 随机选择的元素
 */
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 根据权重随机选择稀有度
 *
 * @param {() => number} rng - 随机数生成器
 * @returns {'common'|'uncommon'|'rare'|'epic'|'legendary'} 稀有度
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
 * 生成宠物属性值
 *
 * @param {() => number} rng - 随机数生成器
 * @param {'common'|'uncommon'|'rare'|'epic'|'legendary'} rarity - 稀有度
 * @returns {Object.<string, number>} 属性对象
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
 *
 * @param {number} seed - 随机种子
 * @returns {string} 64字符的十六进制字符串
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
 *
 * @param {string} userID - 用户ID
 * @param {string} salt - 哈希盐值
 * @returns {Pet} 宠物对象
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
 *
 * @param {Pet} pet - 宠物对象
 * @param {SearchCriteria} criteria - 搜索条件
 * @returns {boolean} 是否符合条件
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
  // 检查物种
  return pet.species === criteria.species;
}

/**
 * 发送进度更新
 *
 * @param {number} attempts - 当前尝试次数
 */
function sendProgress(attempts) {
  self.postMessage({
    type: 'progress',
    data: { attempts, found: foundCount, maxAttempts: params.maxAttempts },
  });
}

/**
 * 发送找到的结果
 *
 * @param {Pet} pet - 宠物对象
 * @param {string} userID - 用户ID
 */
function sendFound(pet, userID) {
  self.postMessage({
    type: 'found',
    data: { ...pet, userID },
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
      yieldToMain();
    }
  }

  // 搜索完成
  self.postMessage({
    type: 'complete',
    data: { totalFound: foundCount, totalAttempts: maxAttempts },
  });

  isRunning = false;
}

/**
 * 让出控制权给主线程
 * 在 Worker 中不需要真正的 yield，但分批处理有助于定期发送进度更新
 */
function yieldToMain() {
  // 空实现 - Worker 本身就是独立线程
}

/**
 * 消息处理
 * @param {MessageEvent} e - 消息事件
 */
self.onmessage = function (e) {
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

/**
 * @typedef {Object} Pet
 * @property {string} species - 物种
 * @property {string} rarity - 稀有度
 * @property {Object.<string, number>} stats - 属性值
 * @property {boolean} shiny - 是否闪光
 */

/**
 * @typedef {Object} SearchCriteria
 * @property {string} species - 目标物种
 * @property {string} minRarity - 最低稀有度
 * @property {boolean} requireShiny - 是否要求闪光
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} species - 目标物种
 * @property {string} minRarity - 最低稀有度
 * @property {boolean} requireShiny - 是否要求闪光
 * @property {string} salt - 哈希盐值
 * @property {number} maxAttempts - 最大尝试次数
 */
