'use strict'

const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
]

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }

const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }

const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }

const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']

const EYES = ['\u00b7', '\u2726', '\u00d7', '\u25c9', '@', '\u00b0']

const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']

const DEFAULT_SALT = 'friend-2026-401'

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
}
