/**
 * TypeScript 类型定义
 * 为项目提供完整的类型支持
 */

/**
 * 物种类型 (18 种)
 */
export type Species =
  | 'duck'
  | 'goose'
  | 'blob'
  | 'cat'
  | 'dragon'
  | 'octopus'
  | 'owl'
  | 'penguin'
  | 'turtle'
  | 'snail'
  | 'ghost'
  | 'axolotl'
  | 'capybara'
  | 'cactus'
  | 'robot'
  | 'rabbit'
  | 'mushroom'
  | 'chonk';

/**
 * 稀有度类型
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * 属性名称
 */
export type StatName = 'DEBUGGING' | 'PATIENCE' | 'CHAOS' | 'WISDOM' | 'SNARK';

/**
 * 眼睛样式
 */
export type Eye = '\u00b7' | '\u2726' | '\u00d7' | '\u25c9' | '@' | '\u00b0';

/**
 * 帽子样式
 */
export type Hat =
  | 'none'
  | 'crown'
  | 'tophat'
  | 'propeller'
  | 'halo'
  | 'wizard'
  | 'beanie'
  | 'tinyduck';

/**
 * 属性值对象
 */
export type Stats = Record<StatName, number>;

/**
 * 宠物生成结果
 */
export interface BuddyResult {
  /** 物种 */
  species: Species;
  /** 稀有度 */
  rarity: Rarity;
  /** 是否闪光 */
  shiny: boolean;
  /** 属性值 */
  stats: Stats;
  /** 眼睛样式 */
  eyes: Eye;
  /** 帽子样式 */
  hat: Hat;
  /** 用户ID */
  userID: string;
}

/**
 * PRNG 随机数生成器函数类型
 */
export type RNG = () => number;

/**
 * PRNG 种子生成函数
 */
export type SeededRNG = (seed: number) => RNG;

/**
 * 字符串哈希函数
 */
export type HashFunction = (s: string) => number;

/**
 * 命令行参数定义
 */
export interface ParamDefinition {
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean';
  /** 默认值 */
  default: string | number | boolean;
  /** 参数描述 */
  desc: string;
  /** 校验函数 */
  validate?: (value: string | number | boolean) => boolean;
  /** 错误消息生成函数 */
  errMsg?: (value: string | number | boolean) => string;
}

/**
 * 命令行参数集合
 */
export interface Params {
  [key: string]: ParamDefinition;
}

/**
 * 解析后的参数对象
 */
export interface ParsedArgs {
  species?: Species;
  minRarity?: Rarity;
  requireShiny?: boolean;
  salt?: string;
  max?: number;
  timeout?: number;
  threads?: number;
  dumpStat?: StatName;
  help?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 命令行解析选项
 */
export interface ParseOptions {
  scriptName?: string;
  description?: string;
  examples?: string[];
}

/**
 * 搜索结果
 */
export interface SearchResult {
  species: Species;
  rarity: Rarity;
  shiny: boolean;
  stats: Stats;
  userID: string;
}

/**
 * Web Worker 消息类型
 */
export type WorkerMessageType =
  | 'start'
  | 'stop'
  | 'progress'
  | 'found'
  | 'complete'
  | 'error';

/**
 * Web Worker 消息
 */
export interface WorkerMessage {
  type: WorkerMessageType;
  data?: unknown;
}

/**
 * 搜索参数
 */
export interface SearchParams {
  species: Species;
  minRarity: Rarity;
  requireShiny: boolean;
  salt: string;
  maxAttempts: number;
}

/**
 * 进度数据
 */
export interface ProgressData {
  attempts: number;
  found: number;
  maxAttempts: number;
}

/**
 * 完成数据
 */
export interface CompleteData {
  totalFound: number;
}
