'use strict'

const { RARITIES, RARITY_WEIGHTS, RARITY_FLOOR, STAT_NAMES } = require('./constants')

/**
 * Mulberry32 PRNG — 32-bit state seeded PRNG used by Claude Code buddy system
 */
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function rollRarity(rng) {
  let roll = rng() * 100
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity]
    if (roll < 0) return rarity
  }
  return 'common'
}

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

/**
 * FNV-1a hash — npm 安装的 Claude Code 使用此算法
 */
function hashStringFnv1a(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Bun.hash wrapper — 原生安装的 Claude Code 使用 Bun.hash
 * 仅在 Bun 运行时下可用
 */
function hashStringBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
}

module.exports = {
  mulberry32,
  pick,
  rollRarity,
  rollStats,
  hashStringFnv1a,
  hashStringBun,
}
