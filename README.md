# IELTS Dictation · 雅思词汇听写与巩固闭环

面向雅思备考的 **听写暴露弱点 → 拼写错误诊断 → 专项复习分流 → 语境打字巩固 → 数据看板汇总** 训练工具（Web MVP）。产品愿景与详细需求见仓库根目录 [`PRD.md`](./PRD.md)。

---

## 产品定位

传统背词多强调「认读」，本项目强调 **在听音与拼写压力下暴露真实错误**，再用 **规则化诊断** 将错题分流到不同交互的复习池，并可通过 **大模型生成雅思大作文范文** 做沉浸式打字，强化肌肉记忆与语境感知。

---

## 核心闭环（当前实现）

```mermaid
flowchart LR
  A[统计面板] --> B[听写检测]
  B --> C{提交拼写}
  C -->|正确| B
  C -->|错误| D[智能诊断分流]
  D --> E[专项复习]
  E --> F[语境作文 / 打字]
  F --> A
```

| 环节 | 路由 | 说明 |
|------|------|------|
| 统计面板 | `/` | 听写轮次、错题概况；可与语境打字实时统计同屏展示（见 `CHANGELOG` v5.1.0） |
| 听写检测 | `/dictation` | 浏览器 TTS 朗读；自定义每轮题量（1–200，默认 5，可持久化）；队列与错题写入本地 |
| 专项复习 | `/review` | 仅消费听写来源错题；**近音辨析 / 拼写强化 / 生词重学** 三板块差异化交互 |
| 语境作文 | `/typing` | 基于听写错词调用 DeepSeek 生成范文与点评；TypeRacer 式逐字打字与 WPM 等统计 |

---

## 功能亮点

- **听写**：大字号输入、答错揭示与盲听阶段、专项复习池联动；轮次会话归档供首页统计。
- **诊断分流**（与 PRD 3.2 对齐）：结合词典与算法（如 Metaphone、编辑距离、词干等）将错误归入 `近音辨析`、`拼写错误`、`完全生词`，再映射到三个复习 Tab。
- **专项复习**：近音二选一 + 可选默写；拼写强化 **连续盲打正确 3 次移出错题池**；生词整词释义例句 + 默写自测。
- **语境作文**：服务端 `POST /api/generate-essay` 读取提示词模板（提前写好的`llm-prompt.md`），严格 JSON 输出；前端沉浸式打字与实时指标。

更多迭代记录见 [`CHANGELOG.md`](./CHANGELOG.md)。

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | [Nuxt 4](https://nuxt.com/) · Vue 3 · [Tailwind CSS](https://tailwindcss.com/) |
| 诊断与 NLP 辅助 | `natural`、`fast-levenshtein` |
| 数据持久化 | 浏览器 `localStorage`（无账号时数据仅在本机） |
| 大模型 | DeepSeek-V3.2（思考模式）| 

---

## 快速开始

### 环境要求

- Node.js（建议 LTS）
- npm（或 pnpm / yarn）

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

### 生产构建与预览

```bash
npm run build
npm run preview
```

### 测试

```bash
npm test
```

---

## 环境变量（语境作文）

语境作文接口需要 DeepSeek API 密钥（**勿提交到仓库**）：

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | 服务端调用 DeepSeek 时使用 |

本地可在项目根目录创建 `.env`（已被 `.gitignore` 忽略），例如：

```env
DEEPSEEK_API_KEY=your_key_here
```

---

## 仓库结构（摘要）

```
app/
  composables/     # 全局状态与组合式逻辑（如词表、错题、听写会话、打字实时统计）
  pages/
    index.vue      # 统计面板
    dictation.vue  # 听写检测
    review.vue     # 专项复习
    typing.vue     # 语境作文 + 打字
    typing-practice.vue  # 占位页（当前主导航未挂载，保留作扩展）
  server/api/      # Nitro API（如 generate-essay）
  utils/           # 诊断引擎等
PRD.md             # 产品需求文档（最新版以仓库内文件为准）
CHANGELOG.md       # 版本与变更说明
```

服务端目录通过 `nuxt.config.ts` 的 `serverDir: 'app/server'` 与 `app/` 源码同树，保证 API 路由稳定注册。

---

## 与 PRD 的对照说明

- **已实现**：Dashboard 式首页、听写工作流、诊断与三池复习、语境作文与打字主线、本地持久化、DeepSeek 接入思路（见 PRD 第 2–3 节与 `CHANGELOG` v5.x）。
- **词库规模**：PRD 提及约 300 词等规划；当前内置词表以 `useWordStore` 中数据为准，可后续替换为完整词书。
- **占位**：`app/pages/typing-practice.vue` 仍为 Step 1 骨架，与主导航中的「语境作文」(`/typing`) 不同；若产品统一为单一打字入口，可在后续迭代中合并或接入导航。

---

## 版本与文档

- 版本历史与发行说明：**[`CHANGELOG.md`](./CHANGELOG.md)**
- 产品目标、业务流程、模块原型：**[`PRD.md`](./PRD.md)**

---

## 贡献与许可

欢迎通过 Issue / Pull Request 反馈问题或提交改进。仓库当前未附带 `LICENSE` 文件；如需开源分发，建议补充许可证条款。
