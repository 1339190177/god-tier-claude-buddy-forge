/**
 * @fileoverview Claude Buddy 宠物生成器 - Web 界面主程序
 * @description 使用 FNV-1a 哈希算法（适用于 npm 安装的 Claude Code）
 * @module web/app
 */

// DOM 元素引用
/** @type {HTMLInputElement} */
const speciesSelect = document.getElementById('species');

/** @type {NodeListOf<HTMLInputElement>} */
const rarityRadios = document.querySelectorAll('input[name="rarity"]');

/** @type {HTMLInputElement} */
const shinyCheckbox = document.getElementById('shiny');

/** @type {HTMLInputElement} */
const saltInput = document.getElementById('salt');

/** @type {HTMLInputElement} */
const maxAttemptsInput = document.getElementById('maxAttempts');

/** @type {HTMLButtonElement} */
const startBtn = document.getElementById('startBtn');

/** @type {HTMLButtonElement} */
const stopBtn = document.getElementById('stopBtn');

/** @type {HTMLElement} */
const statusText = document.getElementById('statusText');

/** @type {HTMLElement} */
const attemptsDisplay = document.getElementById('attempts');

/** @type {HTMLElement} */
const foundDisplay = document.getElementById('found');

/** @type {HTMLElement} */
const elapsedDisplay = document.getElementById('elapsed');

/** @type {HTMLElement} */
const progressFill = document.getElementById('progressFill');

/** @type {HTMLElement} */
const resultSection = document.getElementById('resultSection');

/** @type {HTMLElement} */
const resultContent = document.getElementById('resultContent');

// 常量定义（与 lib/constants.js 和 web/constants.js 一致）
/** @constant {string[]} 所有可用的宠物物种列表 */
// eslint-disable-next-line no-unused-vars -- 保留供未来使用
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

/** @constant {string[]} 宠物稀有度列表 */
// eslint-disable-next-line no-unused-vars -- 保留供未来使用
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** @constant {Object.<string, number>} 稀有度权重 */
// eslint-disable-next-line no-unused-vars -- 保留供未来使用
const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/** @constant {Object.<string, number>} 稀有度等级 */
// eslint-disable-next-line no-unused-vars -- 保留供未来使用
const RARITY_RANK = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** @constant {Object.<string, number>} 属性基础值下限 */
// eslint-disable-next-line no-unused-vars -- 保留供未来使用
const RARITY_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
};

// eslint-disable-next-line no-unused-vars -- 保留供未来使用
/** @constant {string[]} 宠物属性名称列表 */
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];

// 应用状态
/** @type {Worker|null */
let worker = null;

/** @type {number} 搜索开始时间戳 */
let searchStartTime = 0;

/** @type {number|null} 计时器ID */
let elapsedInterval = null;

/** @type {PetResult[]} 已找到的结果列表 */
let bestResults = [];

/**
 * 初始化应用
 */
function init() {
  startBtn.addEventListener('click', startSearch);
  stopBtn.addEventListener('click', stopSearch);
}

/**
 * 启动搜索
 */
function startSearch() {
  const params = getSearchParams();

  // 重置状态
  bestResults = [];
  updateResultDisplay();
  attemptsDisplay.textContent = '0';
  foundDisplay.textContent = '0';
  elapsedDisplay.textContent = '0.0s';
  progressFill.style.width = '0%';
  resultSection.style.display = 'none';

  // 更新 UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusText.textContent = '搜索中...';
  document.querySelector('.status-section').classList.add('searching');

  // 启动计时器
  searchStartTime = Date.now();
  elapsedInterval = setInterval(updateElapsed, 100);

  // 创建 Web Worker（添加缓存破坏参数）
  worker = new Worker('worker.js?v=' + Date.now());
  worker.onmessage = handleWorkerMessage;
  worker.postMessage({ type: 'start', params });
}

/**
 * 停止搜索
 */
function stopSearch() {
  if (worker) {
    worker.postMessage({ type: 'stop' });
  }
  cleanup();
}

/**
 * 清理资源
 */
function cleanup() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusText.textContent = '已停止';
  document.querySelector('.status-section').classList.remove('searching');
}

/**
 * 获取搜索参数
 *
 * @returns {SearchParams} 搜索参数对象
 */
function getSearchParams() {
  let minRarity = 'legendary';
  rarityRadios.forEach(radio => {
    if (radio.checked) minRarity = radio.value;
  });

  return {
    species: speciesSelect.value,
    minRarity: minRarity,
    requireShiny: shinyCheckbox.checked,
    salt: saltInput.value || 'friend-2026-401',
    maxAttempts: parseInt(maxAttemptsInput.value) || 500000,
  };
}

/**
 * 处理 Worker 消息
 *
 * @param {MessageEvent} e - 消息事件
 */
function handleWorkerMessage(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'progress':
      updateProgress(data);
      break;
    case 'found':
      addResult(data);
      break;
    case 'complete':
      handleComplete(data);
      break;
    case 'error':
      handleError(data);
      break;
  }
}

/**
 * 更新进度显示
 *
 * @param {ProgressData} data - 进度数据
 */
function updateProgress(data) {
  attemptsDisplay.textContent = data.attempts.toLocaleString();
  foundDisplay.textContent = data.found.toLocaleString();
  const progress = (data.attempts / data.maxAttempts) * 100;
  progressFill.style.width = `${Math.min(progress, 100)}%`;
}

/**
 * 添加搜索结果
 *
 * @param {PetResult} data - 宠物结果数据
 */
function addResult(data) {
  bestResults.push(data);
  updateResultDisplay();
}

/**
 * 更新结果显示
 */
function updateResultDisplay() {
  if (bestResults.length === 0) {
    resultSection.style.display = 'none';
    return;
  }

  resultSection.style.display = 'block';
  resultContent.innerHTML = bestResults
    .map((result, index) => createResultCard(result, index))
    .join('');

  // 添加复制按钮事件
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', handleCopy);
  });
}

/**
 * 创建结果卡片 HTML
 *
 * @param {PetResult} result - 宠物结果
 * @param {number} index - 结果索引
 * @returns {string} HTML 字符串
 */
function createResultCard(result, index) {
  const { species, rarity, shiny, stats, userID } = result;

  const rarityClass = rarity.toLowerCase();
  const shinyBadge = shiny
    ? '<span class="result-badge badge-shiny">✨ Shiny</span>'
    : '';
  const peakStat = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
  const dumpStat = Object.entries(stats).sort((a, b) => a[1] - b[1])[0];

  const statsHtml = STAT_NAMES.map(name => {
    const value = stats[name];
    const statClass =
      name === peakStat[0]
        ? 'stat-peak'
        : name === dumpStat[0]
          ? 'stat-dump'
          : '';
    return `
      <div class="stat-item">
        <div class="stat-name">${name}</div>
        <div class="stat-value ${statClass}">${value}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="result-card">
      <div class="result-header">
        <div class="result-title">
          ${index + 1}. ${getSpeciesEmoji(species)} ${species}
          <span class="result-badge badge-${rarityClass}">${rarity}</span>
          ${shinyBadge}
        </div>
      </div>
      <div class="result-stats">${statsHtml}</div>
      <div class="result-userid">
        <input type="text" value="${userID}" readonly>
        <button class="copy-btn" data-userid="${userID}">📋 复制</button>
      </div>
    </div>
  `;
}

/**
 * 获取物种对应的 emoji
 *
 * @param {string} species - 物种名称
 * @returns {string} emoji 字符
 */
function getSpeciesEmoji(species) {
  const emojis = {
    duck: '🦆',
    goose: '🪿',
    blob: '🫧',
    cat: '🐱',
    dragon: '🐉',
    octopus: '🐙',
    owl: '🦉',
    penguin: '🐧',
    turtle: '🐢',
    snail: '🐌',
    ghost: '👻',
    axolotl: '🦎',
    capybara: '🦫',
    cactus: '🌵',
    robot: '🤖',
    rabbit: '🐰',
    mushroom: '🍄',
    chonk: '🐱',
  };
  return emojis[species] || '🐾';
}

/**
 * 处理复制按钮点击
 *
 * @param {Event} e - 点击事件
 */
function handleCopy(e) {
  const btn = e.target;
  const userID = btn.dataset.userid;

  navigator.clipboard
    .writeText(userID)
    .then(() => {
      btn.textContent = '✅ 已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 复制';
        btn.classList.remove('copied');
      }, 2000);
    })
    .catch(() => {
      // 降级方案
      const input = btn.previousElementSibling;
      input.select();
      document.execCommand('copy');
      btn.textContent = '✅ 已复制';
      setTimeout(() => (btn.textContent = '📋 复制'), 2000);
    });
}

/**
 * 更新用时显示
 */
function updateElapsed() {
  const elapsed = (Date.now() - searchStartTime) / 1000;
  elapsedDisplay.textContent = `${elapsed.toFixed(1)}s`;
}

/**
 * 处理搜索完成
 *
 * @param {CompleteData} data - 完成数据
 */
function handleComplete(data) {
  cleanup();
  statusText.textContent = `完成！找到 ${data.totalFound} 个结果`;
  progressFill.style.width = '100%';
}

/**
 * 处理错误
 *
 * @param {ErrorData} data - 错误数据
 */
function handleError(data) {
  cleanup();
  statusText.textContent = `错误: ${data.message}`;
  alert(`搜索出错: ${data.message}`);
}

// 启动应用
init();

/**
 * @typedef {Object} PetResult
 * @property {string} species - 物种
 * @property {string} rarity - 稀有度
 * @property {boolean} shiny - 是否闪光
 * @property {Object.<string, number>} stats - 属性值
 * @property {string} userID - 用户ID
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} species - 目标物种
 * @property {string} minRarity - 最低稀有度
 * @property {boolean} requireShiny - 是否要求闪光
 * @property {string} salt - 哈希盐值
 * @property {number} maxAttempts - 最大尝试次数
 */

/**
 * @typedef {Object} ProgressData
 * @property {number} attempts - 当前尝试次数
 * @property {number} found - 已找到数量
 * @property {number} maxAttempts - 最大尝试次数
 */

/**
 * @typedef {Object} CompleteData
 * @property {number} totalFound - 总找到数量
 * @property {number} totalAttempts - 总尝试次数
 */

/**
 * @typedef {Object} ErrorData
 * @property {string} message - 错误消息
 */
