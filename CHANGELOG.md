# Changelog

All notable changes to this project are documented in this file.

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

