/**
 * ESLint 配置
 * 基于 Google 风格，适配 Node.js 项目
 */
module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // 代码风格
    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'eol-last': ['error', 'unix'],

    // 最佳实践
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],

    // 注释规范
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
  },
  overrides: [
    {
      files: ['web/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
    },
  ],
};
