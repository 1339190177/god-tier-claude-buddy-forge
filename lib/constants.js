'use strict';

/**
 * @fileoverview 常量定义模块
 * @description 定义 Claude Code buddy 系统使用的所有常量，
 *              包括物种、稀有度、属性、外观等配置
 */

/**
 * 所有可用的宠物物种列表 (18 种)
 *
 * @constant {string[]}
 * @default
 */
const SPECIES = [
  'duck',
  'goose',
  'blob',
  'cat',
  'dragon',
  'octopus',
  'owl',
  'penguin',
  'turtle',
  'snail',
  'ghost',
  'axolotl',
  'capybara',
  'cactus',
  'robot',
  'rabbit',
  'mushroom',
  'chonk',
];

/**
 * 宠物稀有度列表
 *
 * 按从低到高的顺序排列
 * @constant {string[]}
 */
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * 稀有度生成权重
 *
 * 各稀有度的出现概率权重（总和为 100）
 * @constant {Object.<string, number>}
 */
const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/**
 * 稀有度等级排序
 *
 * 用于比较稀有度高低，数值越大越稀有
 * @constant {Object.<string, number>}
 */
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

/**
 * 属性基础值下限
 *
 * 各稀有度属性的最低起始值
 * @constant {Object.<string, number>}
 */
const RARITY_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
};

/**
 * 宠物属性名称列表
 *
 * @constant {string[]}
 */
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];

/**
 * 可用的眼睛样式列表
 *
 * @constant {string[]}
 */
const EYES = ['\u00b7', '\u2726', '\u00d7', '\u25c9', '@', '\u00b0'];

/**
 * 可用的帽子样式列表
 *
 * @constant {string[]}
 */
const HATS = [
  'none',
  'crown',
  'tophat',
  'propeller',
  'halo',
  'wizard',
  'beanie',
  'tinyduck',
];

/**
 * 默认哈希盐值
 *
 * 用于 Claude Code 2.1.89-2.1.90 版本
 * @constant {string}
 */
const DEFAULT_SALT = 'friend-2026-401';

module.exports = {
  SPECIES,
  RARITIES,
  RARITY_WEIGHTS,
  RARITY_RANK,
  RARITY_FLOOR,
  STAT_NAMES,
  EYES,
  HATS,
  DEFAULT_SALT,
};
