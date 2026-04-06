# Changelog

All notable changes to this project are documented in this file.

## [v5.0.0] - 2026-04-07

### Added
- **基于大模型的雅思私教智能体（IELTS Tutor Agent）工作流**：听写错词 → 服务端调用 DeepSeek（严格 `json_object` 输出）→ 生成英文范文、中文参考译文与四条「考官划重点」好词好句点评；前端在「语境作文」页完成沉浸式 TypeRacer 打字练习，并展示翻译与考官式解析。
- `llm-prompt.md` 作为可维护的 System / User 提示词模板，由 `POST /api/generate-essay` 动态注入错词列表。
- `app/pages/typing.vue`：语境作文与打字主流程；实时 WPM / 准确率 / 用时；错字锁定、跳过当前字符、范文侧栏等交互（随迭代持续优化）。

### Changed
- `nuxt.config.ts`：配置 `serverDir: app/server`，确保 Nitro 稳定注册服务端 API。
- `package.json`：`dev` / `build` 使用提高 Node 堆上限，降低本地全量重建时 OOM 概率。
- 主导航与 Dashboard 入口指向「语境作文」模块。

### Notes
- API 密钥通过环境变量 `DEEPSEEK_API_KEY` 配置，勿提交到仓库。

## [v4.0.0] - 2026-04-06

### Added
- Dictation now supports custom round size (`1-200`, default `5`) with local persistence.
- Round queue generation supports cyclic fill when selected round size exceeds vocabulary size.
- Round-size changes can be applied immediately in the active round.

### Changed
- Dictation page visual hierarchy was upgraded (progress cards, stronger core action emphasis, refined feedback cards).
- Review page visual design for all three modules was upgraded to highlight core workflows:
  - Sound distinction (`近音辨析`)
  - Spelling reinforcement (`拼写强化`)
  - Unknown-word relearning (`生词重学`)
- Session metadata now supports syncing the current round word count while a session is in progress.

### Known Pending
- `Typing Practice` is still under development and not yet fully completed.

