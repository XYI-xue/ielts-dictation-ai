/**
 * 语境打字页实时统计（WPM / 准确率 / 用时），供 Dashboard 等同屏展示。
 * 模块级 ref，全应用单例。
 */
const wpm = ref(0)
const accuracyPct = ref(100)
const timeFormatted = ref('0:00')

export interface TypingLiveStatsPayload {
  wpm: number
  accuracyPct: number
  timeFormatted: string
}

export function useTypingLiveStats() {
  function sync(payload: TypingLiveStatsPayload) {
    wpm.value = payload.wpm
    accuracyPct.value = payload.accuracyPct
    timeFormatted.value = payload.timeFormatted
  }

  function reset() {
    wpm.value = 0
    accuracyPct.value = 100
    timeFormatted.value = '0:00'
  }

  return {
    wpm,
    accuracyPct,
    timeFormatted,
    sync,
    reset
  }
}
