/**
 * @fileoverview Web 界面共享常量
 * @description 为浏览器环境提供与 lib/constants.js 一致的常量定义
 *              Web Worker 无法使用 Node.js require，因此需要独立定义
 */

/**
 * 所有可用的宠物物种列表 (18 种)
 * 与 lib/constants.js 保持一致
 *
 * @constant {string[]}
 */
export const SPECIES = [
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
 * 宠物稀有度列表（按从低到高顺序）
 *
 * @constant {string[]}
 */
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * 稀有度生成权重（总和为 100）
 *
 * @constant {Object.<string, number>}
 */
export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/**
 * 稀有度等级排序（用于比较）
 *
 * @constant {Object.<string, number>}
 */
export const RARITY_RANK = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/**
 * 属性基础值下限
 *
 * @constant {Object.<string, number>}
 */
export const RARITY_FLOOR = {
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
export const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];
