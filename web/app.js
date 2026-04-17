/**
 * Claude Buddy 宠物生成器 - Web 界面
 * 使用 FNV-1a 哈希算法（适用于 npm 安装的 Claude Code）
 */

// 常量定义（用于显示属性）
const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];

// DOM 元素
const elements = {
  species: document.getElementById('species'),
  rarityRadios: document.querySelectorAll('input[name="rarity"]'),
  shiny: document.getElementById('shiny'),
  salt: document.getElementById('salt'),
  maxAttempts: document.getElementById('maxAttempts'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  statusText: document.getElementById('statusText'),
  attempts: document.getElementById('attempts'),
  found: document.getElementById('found'),
  elapsed: document.getElementById('elapsed'),
  progressFill: document.getElementById('progressFill'),
  resultSection: document.getElementById('resultSection'),
  resultContent: document.getElementById('resultContent'),
};

// 状态
let worker = null;
let searchStartTime = 0;
let elapsedInterval = null;
let bestResults = [];

// 初始化
function init() {
  elements.startBtn.addEventListener('click', startSearch);
  elements.stopBtn.addEventListener('click', stopSearch);
}

// 启动搜索
function startSearch() {
  const params = getSearchParams();

  // 重置状态
  bestResults = [];
  updateResultDisplay();
  elements.attempts.textContent = '0';
  elements.found.textContent = '0';
  elements.elapsed.textContent = '0.0s';
  elements.progressFill.style.width = '0%';
  elements.resultSection.style.display = 'none';

  // 更新 UI
  elements.startBtn.disabled = true;
  elements.stopBtn.disabled = false;
  elements.statusText.textContent = '搜索中...';
  document.querySelector('.status-section').classList.add('searching');

  // 启动计时器
  searchStartTime = Date.now();
  elapsedInterval = setInterval(updateElapsed, 100);

  // 创建 Web Worker（添加缓存破坏参数）
  worker = new Worker('worker.js?v=' + Date.now());
  worker.onmessage = handleWorkerMessage;
  worker.postMessage({ type: 'start', params });
}

// 停止搜索
function stopSearch() {
  if (worker) {
    worker.postMessage({ type: 'stop' });
  }
  cleanup();
}

// 清理资源
function cleanup() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (elapsedInterval) {
    clearInterval(elapsedInterval);
    elapsedInterval = null;
  }
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  elements.statusText.textContent = '已停止';
  document.querySelector('.status-section').classList.remove('searching');
}

// 获取搜索参数
function getSearchParams() {
  let minRarity = 'legendary';
  elements.rarityRadios.forEach(radio => {
    if (radio.checked) minRarity = radio.value;
  });

  return {
    species: elements.species.value,
    minRarity: minRarity,
    requireShiny: elements.shiny.checked,
    salt: elements.salt.value || 'friend-2026-401',
    maxAttempts: parseInt(elements.maxAttempts.value) || 500000,
  };
}

// 处理 Worker 消息
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

// 更新进度
function updateProgress(data) {
  elements.attempts.textContent = data.attempts.toLocaleString();
  elements.found.textContent = data.found.toLocaleString();
  const progress = (data.attempts / data.maxAttempts) * 100;
  elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
}

// 添加结果
function addResult(data) {
  bestResults.push(data);
  updateResultDisplay();
}

// 更新结果显示
function updateResultDisplay() {
  if (bestResults.length === 0) {
    elements.resultSection.style.display = 'none';
    return;
  }

  elements.resultSection.style.display = 'block';
  elements.resultContent.innerHTML = bestResults
    .map((result, index) => createResultCard(result, index))
    .join('');

  // 添加复制按钮事件
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', handleCopy);
  });
}

// 创建结果卡片
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

// 获取物种 emoji
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

// 处理复制
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

// 更新用时
function updateElapsed() {
  const elapsed = (Date.now() - searchStartTime) / 1000;
  elements.elapsed.textContent = `${elapsed.toFixed(1)}s`;
}

// 处理完成
function handleComplete(data) {
  cleanup();
  elements.statusText.textContent = `完成！找到 ${data.totalFound} 个结果`;
  elements.progressFill.style.width = '100%';
}

// 处理错误
function handleError(data) {
  cleanup();
  elements.statusText.textContent = `错误: ${data.message}`;
  alert(`搜索出错: ${data.message}`);
}

// 启动
init();
