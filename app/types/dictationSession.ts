/** 听写训练轮次（Session / Round），用于 Dashboard 与复习、打字模块联动 */
export type SessionStatus = 'completed' | 'ongoing'

export interface DictationSession {
  /** 唯一标识（时间戳或带前缀） */
  id: string
  /** 练习日期 YYYY-MM-DD（本地日历日） */
  date: string
  /** 本轮总词数 */
  wordsCount: number
  /** 答对提交次数（含同一词改正后再次答对） */
  correctCount: number
  /** 本轮涉及的错题记录 id（同一词 upsert 复用 id，不重复） */
  errorIds: string[]
  status: SessionStatus
}
