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
# 刷传奇龙
bun buddy-reroll.js dragon

# 刷传奇猫
bun buddy-reroll.js cat

# 刷传奇幽灵
bun buddy-reroll.js ghost

# 其他物种同理
bun buddy-reroll.js <物种名>

# 增大搜索范围 (默认50万次，通常几秒就能出 legendary)
bun buddy-reroll.js dragon 1000000
```

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

## 🚀 进阶玩法：寻找极限神明宠物（属性全满/闪光）

如果常规的传说级物种已经无法满足您，项目中现已新增了三款**全本地暴力破解级别**的底层验证脚本，能在极短时间内历遍上千万乃至整个 42.9亿 宇宙范围的 32 位数学随机种子，帮您找到满评的绝对天花板级面板！

### 硬件要求 (Hardware Requirements)
- **处理器 (CPU)**：十分消耗核心数与多线程压榨性能。推荐至少使用 **8核/16线程** 的现代级高性能 CPU（例如 Intel i7-11700K / Ryzen 7 5800X 及以上），只有高主频的 CPU 才能支撑上亿次不掉帧的 FNV-1a 并行哈希计算，算力偏低可能会引起等待时间的成倍增加。
- **内存 (RAM)**：消耗正常，无大量持续占用，预留 4GB 空闲内存即可。
- **环境要求**: 原生支持 Node.js 环境运行，建议使用 Node.js v16 及以上版本，从而充分利用 V8 JIT 引擎编译带来的优化。

### 进阶脚本列表

1. **时间限定单核全开**： 
   ```bash
   # 用法: node buddy-reroll-advanced.js [物种: 默认dragon] [限时秒数: 默认15]
   node buddy-reroll-advanced.js cat 20
   ```
   - **描述**：轻度压榨。通过极短的限时执行周期在主存中全力寻找出各项属性极高（总分逼近峰值）的传说闪光神宠，并在末尾一键自动替换至您的全局 `~/.claude.json` 环境。适合基础刷分尝试。

2. **多核多线程狂飙极限压榨**： 
   ```bash
   # 用法: node buddy-reroll-advanced-mt.js [物种: 默认dragon] [限时秒数: 默认60] [最大线程数: 默认系统全核]
   node buddy-reroll-advanced-mt.js ghost 60 16
   ```
   - **描述**：重度压榨。该方案直接调用您计算机目前物理层的可满载的全部 CPU 核心矩阵，在一个长时连轴转的空间内跑出几亿次的运算并发力战！该策略仅推荐用来直接寻找极低概率（数亿分之一分布）的巅峰怪兽（比如 412 分的神级面板）。

3. **真神·降维全量通算打击（终章）**： 
   ```bash
   # 用法: node crack-universe.js [物种: 默认dragon] [要求垫底Dump的弱点属性: 默认SNARK] [最大线程数: 默认系统全核]
   # 属性可选英文值: DEBUGGING(捉虫), PATIENCE(耐心), CHAOS(混沌), WISDOM(智慧), SNARK(吐槽)
   node crack-universe.js duck WISDOM 16
   ```
   - **描述**：破解终局核心法。彻底放弃掷骰子，直接在几十秒内拉满多线程降维排查并一览 42.9 亿个全宇宙空间的所有密码结果。
   - **效果**：不仅能锁定传说等级加闪光特性，更能**强制指派必定产生的缺陷弱点（Dump）**底层分布，找到在绝对物理真理下最高评分的造物主独孤防伪神宠 UID！

## 注意事项

- `SALT = "friend-2026-401"` 基于 Claude Code 2.1.89-2.1.90，后续版本可能变化。
- 使用第三方 API 代理（如 BigModel）时，buddy 的 reaction 回复功能可能不可用，但宠物本身正常显示。
- 如果更新后 SALT 变了，需要用新版源码中的 SALT 重新运行脚本。
- **高负载警告：以上提到的三大进阶并发脚本，因为引擎需要吃满配置的所有线程池，在运行的长途数十秒内因严重压榨算力可能引起风扇转速猛增和轻微锁频卡顿属于正常现象，静候佳音即可。**
