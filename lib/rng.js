'use strict';

const {
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_FLOOR,
  STAT_NAMES,
} = require('./constants');

/**
 * Mulberry32 PRNG — 32位状态种子伪随机数生成器
 *
 * 这是 Claude Code buddy 系统使用的 PRNG 算法。
 * Mulberry32 是一种快速、高质量的 32 位种子 PRNG，
 * 适用于游戏和模拟应用。
 *
 * @param {number} seed - 32位整数种子
 * @returns {() => number} 返回一个生成 [0, 1) 范围内随机数的函数
 * @example
 * const rng = mulberry32(12345)
 * console.log(rng()) // 0.123456...
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
 * 从数组中随机选择一个元素
 *
 * @param {() => number} rng - 随机数生成器函数
 * @param {Array} arr - 要选择的数组
 * @returns {*} 数组中的随机元素
 * @example
 * const rng = mulberry32(42)
 * const species = pick(rng, ['cat', 'dog', 'dragon'])
 */
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 根据权重随机选择稀有度
 *
 * 稀有度权重分配：
 * - common: 60%
 * - uncommon: 25%
 * - rare: 10%
 * - epic: 4%
 * - legendary: 1%
 *
 * @param {() => number} rng - 随机数生成器函数
 * @returns {'common'|'uncommon'|'rare'|'epic'|'legendary'} 随机选择的稀有度
 * @example
 * const rng = mulberry32(42)
 * const rarity = rollRarity(rng) // 可能返回 'rare'
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
 * 根据稀有度生成五个属性值：
 * - peak 属性：最高值（floor + 50~80）
 * - dump 属性：最低值（floor - 10~4）
 * - 其他属性：中等值（floor ~ floor + 40）
 *
 * @param {() => number} rng - 随机数生成器函数
 * @param {'common'|'uncommon'|'rare'|'epic'|'legendary'} rarity - 稀有度
 * @returns {Object.<string, number>} 属性名到属性值的映射
 * @example
 * const rng = mulberry32(42)
 * const stats = rollStats(rng, 'legendary')
 * // 可能返回: { DEBUGGING: 95, PATIENCE: 88, ... }
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
 * FNV-1a hash — npm 安装的 Claude Code 使用此算法
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
 * Bun.hash wrapper — 原生安装的 Claude Code 使用 Bun.hash
 * 仅在 Bun 运行时下可用
 *
 * @param {string} s - 要哈希的字符串
 * @returns {number} 32位无符号整数哈希值
 */
function hashStringBun(s) {
  /* eslint-disable-next-line no-undef -- Bun 是全局对象（仅 Bun 运行时） */
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn);
}

module.exports = {
  mulberry32,
  pick,
  rollRarity,
  rollStats,
  hashStringFnv1a,
  hashStringBun,
};
