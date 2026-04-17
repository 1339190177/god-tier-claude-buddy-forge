'use strict';

const { SPECIES, RARITIES } = require('./constants');

/**
 * 统一命令行参数解析器
 *
 * 支持: --key value, --key=value, --boolean-flag
 * 自动校验合法值并生成 --help
 */

// 全局参数定义（所有脚本共享）
const GLOBAL_PARAMS = {
  species: {
    type: 'string',
    default: 'dragon',
    desc: '目标物种',
    validate: v => SPECIES.includes(v),
    errMsg: v => `未知物种: ${v}\n可选: ${SPECIES.join(', ')}`,
  },
  'min-rarity': {
    type: 'string',
    default: 'legendary',
    desc: '最低目标稀有度',
    validate: v => RARITIES.includes(v),
    errMsg: v => `未知稀有度: ${v}\n可选: ${RARITIES.join(', ')}`,
  },
  'require-shiny': {
    type: 'boolean',
    default: false,
    desc: '限定只搜索闪光个体',
  },
  salt: {
    type: 'string',
    default: 'friend-2026-401',
    desc: '自定义 SALT 值（适配不同 Claude Code 版本）',
  },
  help: {
    type: 'boolean',
    default: false,
    desc: '显示帮助信息',
  },
};

/**
 * 解析 process.argv 为命名参数对象
 * @param {string[]} argv - process.argv (前两个元素 script/node 路径会被跳过)
 * @param {Object} extraParams - 脚本特有参数定义，格式同 GLOBAL_PARAMS
 * @param {Object} opts - 选项 { scriptName, description, examples }
 * @returns {Object} 解析后的参数键值对
 */
function parseArgs(argv, extraParams = {}, _opts = {}) {
  const params = { ...GLOBAL_PARAMS, ...extraParams };
  const args = argv.slice(2);
  const result = {};

  // 设置默认值
  for (const [key, def] of Object.entries(params)) {
    result[key] = def.default;
  }

  // 解析 --key value / --key=value / --flag
  let i = 0;
  const positional = [];
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--' || arg === '-h' || arg === '--help') {
      result.help = true;
      i++;
      continue;
    }
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        // --key=value
        const key = arg.slice(2, eqIdx);
        const val = arg.slice(eqIdx + 1);
        applyParam(result, key, val, params);
      } else {
        // --key value 或 --boolean-flag
        const key = arg.slice(2);
        if (params[key] && params[key].type === 'boolean') {
          result[key] = true;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          applyParam(result, key, args[i + 1], params);
          i++;
        } else {
          result[key] = true;
        }
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  // 位置参数向后兼容：第一个位置参数 → species，第二个/第三个按脚本特有参数顺序
  const extraKeys = Object.keys(extraParams);
  if (positional.length > 0 && !args.some(a => a.startsWith('--species'))) {
    applyParam(result, 'species', positional[0], params);
  }
  for (let p = 1; p < positional.length && p - 1 < extraKeys.length; p++) {
    const key = extraKeys[p - 1];
    if (!args.some(a => a.startsWith(`--${key}`))) {
      applyParam(result, key, positional[p], params);
    }
  }

  return result;
}

function applyParam(result, key, val, params) {
  if (!params[key]) return;
  result[key] =
    params[key].type === 'number' ? parseInt(val) || params[key].default : val;
}

/**
 * 校验参数合法性，不合法则打印错误并退出
 */
function validateOrExit(result, extraParams = {}) {
  const params = { ...GLOBAL_PARAMS, ...extraParams };
  for (const [key, def] of Object.entries(params)) {
    if (def.validate && !def.validate(result[key])) {
      console.error(def.errMsg(result[key]));
      process.exit(1);
    }
  }
}

/**
 * 生成并打印 --help 文本
 */
function showHelpAndExit(extraParams = {}, opts = {}) {
  const params = { ...GLOBAL_PARAMS, ...extraParams };
  const { scriptName = 'script', description = '', examples = [] } = opts;

  console.log(`用法: ${scriptName} [选项]`);
  if (description) console.log(`\n${description}`);

  console.log('\n选项:');
  const allKeys = [...Object.keys(GLOBAL_PARAMS), ...Object.keys(extraParams)];
  for (const key of allKeys) {
    const p = params[key];
    const flag = p.type === 'boolean' ? `--${key}` : `--${key} <${p.type}>`;
    const def =
      p.default !== undefined && p.default !== false
        ? ` (默认: ${p.default})`
        : '';
    console.log(`  ${flag.padEnd(28)} ${p.desc}${def}`);
  }

  if (examples.length > 0) {
    console.log('\n示例:');
    for (const ex of examples) {
      console.log(`  ${ex}`);
    }
  }
  process.exit(0);
}

/**
 * 一站式参数处理：解析 + 校验 + help
 */
function resolveArgs(argv, extraParams = {}, opts = {}) {
  const result = parseArgs(argv, extraParams, opts);
  if (result.help) showHelpAndExit(extraParams, opts);
  validateOrExit(result, extraParams);
  return result;
}

module.exports = {
  parseArgs,
  validateOrExit,
  showHelpAndExit,
  resolveArgs,
  GLOBAL_PARAMS,
};
