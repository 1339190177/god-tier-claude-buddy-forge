# Claude-Buddy-Universe-Cracker

> 适用于 Claude Code >= 2.1.89，帮你在 `/buddy` 中刷到想要的传奇宠物。

## 原理

宠物由 `hash(userID + "friend-2026-401")` 确定性生成，同一个 `userID` 永远出同一只宠物。
通过暴力搜索不同的 `userID`，可以定向刷出指定物种 + 传奇稀有度。

## 物种列表 (18 种)

```
duck  goose  blob  cat  dragon  octopus  owl
penguin  turtle  snail  ghost  axolotl  capybara
cactus  robot  rabbit  mushroom  chonk
```

## 稀有度

| 稀有度 | 概率 |
|--------|------|
| common | 60% |
| uncommon | 25% |
| rare | 10% |
| epic | 4% |
| legendary | 1% |

## 步骤

### 1. 启用 buddy 功能

检查 `~/.claude/settings.json`，**删除** `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 这个环境变量（如果有的话）。

### 2. 安装 Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

> **必须用 Bun！** Claude Code 是 Bun 打包的，用的是 `Bun.hash()`。Node.js 的 FNV-1a 结果完全不同，跑出来的 userID 写进去宠物对不上。

### 3. 运行刷取脚本

```bash
# 刷传奇龙（命名参数）
bun buddy-reroll.js --species dragon

# 向后兼容位置参数
bun buddy-reroll.js dragon

# 指定最低稀有度 + 自定义 SALT
bun buddy-reroll.js --species cat --min-rarity epic --salt friend-2026-401

# 增大搜索范围 (默认50万次)
bun buddy-reroll.js --species dragon --max 1000000

# 查看帮助
bun buddy-reroll.js --help
```

> **Node.js 用户**：如果用 npm 安装的 Claude Code，请使用 `node buddy-reroll-node.js` 代替 `bun buddy-reroll.js`，参数完全一致。

输出示例：
```
found: uncommon dragon -> c3353bb4...
found: rare dragon -> 7de701d1...
found: epic dragon -> b0731246...
found: legendary dragon -> 4794e751...

Best: legendary dragon
userID: 4794e751b52e18dbd0a478aab3c8f6b9bf758405028cf5b2326e5e0941f7b4bc
```

### 4. 写入配置

编辑 `~/.claude.json`：

1. **删除** `companion` 字段（如果存在）
2. **删除** `userID` 字段（如果存在）
3. **添加** 脚本输出的 `userID`

```json
{
  "userID": "4794e751b52e18dbd0a478aab3c8f6b9bf758405028cf5b2326e5e0941f7b4bc"
}
```

> `userID` 只用于遥测 device_id、A/B 分桶、buddy 种子，跟对话历史、API key 完全无关，放心换。

### 5. 领取宠物

重启 Claude Code，运行：

```
/buddy
```

## 想换一只？

重复步骤 3-5 即可。每次生成新的 `userID` 就会得到不同的宠物。

## 🌐 Web 可视化界面（无需命令行）

如果你不熟悉命令行，可以使用 Web 可视化界面：

```bash
# 启动本地服务器
cd web
python -m http.server 8000
# 或使用 Node.js: npx serve web -p 8000
```

然后在浏览器打开 http://localhost:8000

**功能特点**：
- 18 种物种下拉选择
- 稀有度和闪光选项可视化配置
- 实时搜索进度显示
- 一键复制 userID

> **注意**：Web 界面使用 FNV-1a 哈希算法，适用于 **npm 安装的 Claude Code**。如果使用原生安装（Bun 版本），请使用 CLI 工具。

详细说明请查看 [web/README.md](web/README.md)

## 统一参数体系

所有脚本共享统一的命名参数格式，支持 `--key value`、`--key=value`、`--boolean-flag` 以及向后兼容的位置参数。

### 通用参数（所有脚本共享）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--species` | string | dragon | 目标物种 |
| `--min-rarity` | string | legendary | 最低目标稀有度 (common/uncommon/rare/epic/legendary) |
| `--require-shiny` | boolean | false | 限定只搜索闪光个体 |
| `--salt` | string | friend-2026-401 | 自定义 SALT 值（适配不同 Claude Code 版本） |
| `--help` | boolean | false | 显示帮助信息 |

### 脚本特有参数

| 参数 | 适用脚本 | 类型 | 默认值 | 说明 |
|------|----------|------|--------|------|
| `--max` | buddy-reroll.js, buddy-reroll-node.js | number | 500000 | 最大尝试次数 |
| `--timeout` | buddy-reroll-advanced.js, buddy-reroll-advanced-mt.js | number | 15/60 | 限时搜索秒数 |
| `--threads` | buddy-reroll-advanced-mt.js, crack-universe.js | number | CPU核数 | 最大线程数 |
| `--dump-stat` | crack-universe.js | string | SNARK | 短板属性 (DEBUGGING/PATIENCE/CHAOS/WISDOM/SNARK) |

## 🚀 进阶玩法：寻找极限神明宠物（属性全满/闪光）

如果常规的传说级物种已经无法满足您，项目中现已新增了三款**全本地暴力破解级别**的底层验证脚本，能在极短时间内历遍上千万乃至整个 42.9亿 宇宙范围的 32 位数学随机种子，帮您找到满评的绝对天花板级面板！

### 硬件要求 (Hardware Requirements)
- **处理器 (CPU)**：十分消耗核心数与多线程压榨性能。推荐至少使用 **8核/16线程** 的现代级高性能 CPU（例如 Intel i7-11700K / Ryzen 7 5800X 及以上），只有高主频的 CPU 才能支撑上亿次不掉帧的 FNV-1a 并行哈希计算，算力偏低可能会引起等待时间的成倍增加。
- **内存 (RAM)**：消耗正常，无大量持续占用，预留 4GB 空闲内存即可。
- **环境要求**: 原生支持 Node.js 环境运行，建议使用 Node.js v16 及以上版本，从而充分利用 V8 JIT 引擎编译带来的优化。

### 进阶脚本列表

1. **时间限定单核全开**：
   ```bash
   node buddy-reroll-advanced.js --species cat --timeout 20
   # 向后兼容: node buddy-reroll-advanced.js cat 20
   ```
   - **描述**：轻度压榨。通过极短的限时执行周期在主存中全力寻找出各项属性极高（总分逼近峰值）的传说闪光神宠，并在末尾一键自动替换至您的全局 `~/.claude.json` 环境。适合基础刷分尝试。

2. **多核多线程狂飙极限压榨**：
   ```bash
   node buddy-reroll-advanced-mt.js --species ghost --timeout 60 --threads 16
   # 向后兼容: node buddy-reroll-advanced-mt.js ghost 60 16
   ```
   - **描述**：重度压榨。该方案直接调用您计算机目前物理层的可满载的全部 CPU 核心矩阵，在一个长时连轴转的空间内跑出几亿次的运算并发力战！该策略仅推荐用来直接寻找极低概率（数亿分之一分布）的巅峰怪兽（比如 412 分的神级面板）。

3. **真神·降维全量通算打击（终章）**：
   ```bash
   node crack-universe.js --species duck --dump-stat WISDOM --threads 16
   # 向后兼容: node crack-universe.js duck WISDOM 16
   ```
   - **描述**：破解终局核心法。彻底放弃掷骰子，直接在几十秒内拉满多线程降维排查并一览 42.9 亿个全宇宙空间的所有密码结果。
   - **效果**：不仅能锁定传说等级加闪光特性，更能**强制指派必定产生的缺陷弱点（Dump）**底层分布，找到在绝对物理真理下最高评分的造物主独孤防伪神宠 UID！

### 进阶参数示例

```bash
# 只刷 epic 及以上的闪光龙（限时模式）
node buddy-reroll-advanced.js --species dragon --min-rarity epic --require-shiny --timeout 30

# 自定义 SALT 适配新版本
node buddy-reroll-advanced-mt.js --species owl --salt new-salt-value --timeout 120 --threads 8

# 全量搜索指定短板属性
node crack-universe.js --species cat --dump-stat CHAOS --threads 16
```

## 注意事项

- `SALT = "friend-2026-401"` 基于 Claude Code 2.1.89-2.1.90，后续版本可能变化。使用 `--salt` 参数可快速适配新版。
- 使用第三方 API 代理（如 BigModel）时，buddy 的 reaction 回复功能可能不可用，但宠物本身正常显示。
- 如果更新后 SALT 变了，需要用 `--salt <新值>` 重新运行脚本。
- **高负载警告：以上提到的三大进阶并发脚本，因为引擎需要吃满配置的所有线程池，在运行的长途数十秒内因严重压榨算力可能引起风扇转速猛增和轻微锁频卡顿属于正常现象，静候佳音即可。**

## ⚠️ 严正免责声明 (Disclaimer)

**在使用本库内任何穷举脚本及漏洞突破方案前，请务必知晓并同意以下所有条款。若由于使用本项目而引发任何连带后果，开发者与该仓库概不负责：**

1. **仅作底层学术研究与娱乐验证**
   本项目所有用于平行空间穷举、抓宠探索及 PRNG 底层种子切面暴露的源码均为极限哈希碰撞（FNV-1a / PRNG）系统的理论与技术演示。请勿用于任何形式的商业行为。
2. **账号封禁及官方风控风险（首要免责）**
   本作突破原理直接依赖于干预并篡改了本地存放的 `~/.claude.json` 中的系统环境追踪码 `userID`。虽然目前研判其孤立存在，但在未来随着版本更迭，绝不排除 Anthropic 官方在云端加入遥测风控对强行干预该 ID 的用户实施制裁。由此引发的所有连带账号封禁、API 权限收回等严重后果，**全部均由操作者本人承担**。
3. **硬件高温老化与烧损免责**
   由于本项目的"进阶版"及"终章降维版"极度依赖暴力压榨芯片多核心算力强行突破了传统程序的负载墙进行极限寻址，运行时 CPU 极易顶满 100% 出现过热啸叫。因此造成的一切诸如 CPU 过热缩水、蓝屏、硬件烧毁或老化等实体金钱损失，由用户自主承担风险。
4. **非官方授权性质**
   本仓库以及代码属于纯野生逆向民间娱乐项目，绝非官方产品。代码生效存在时效性与不确定性，请三思而行！

