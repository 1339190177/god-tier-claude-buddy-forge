# Claude Buddy Web 界面

Web 可视化界面，无需命令行即可生成 Claude Code buddy 宠物。

## 使用方法

### 方法一：本地 HTTP 服务器（推荐）

由于浏览器安全限制，Web Worker 需要通过 HTTP 协议加载。

```bash
# 使用 Python 3
cd web
python -m http.server 8000

# 使用 Node.js (npx)
npx serve web -p 8000

# 使用 PHP
php -S localhost:8000 -t web
```

然后在浏览器中打开：http://localhost:8000

### 方法二：直接打开 HTML（有限支持）

某些浏览器允许直接打开 `index.html`，但 Web Worker 可能受限。

## 功能说明

- **物种选择**：18 种可选物种
- **稀有度过滤**：从 Common 到 Legendary
- **闪光限定**：只搜索闪光个体（5% 概率）
- **自定义 SALT**：适配不同 Claude Code 版本
- **可视化进度**：实时显示搜索进度和结果
- **一键复制**：直接复制 userID 到剪贴板

## 兼容性

- 使用 FNV-1a 哈希算法
- **适用于 npm 安装的 Claude Code**
- 如果使用原生安装（Bun 版本），请使用 CLI 工具 `buddy-reroll.js`

## 注意事项

- 搜索过程在浏览器中进行，大型搜索会占用 CPU 资源
- 建议最大尝试次数不超过 100 万次
- 搜索完成后，复制 userID 并按主 README 的说明配置到 `~/.claude.json`
