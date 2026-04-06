import type { SpellingDiagnosisCategory } from '~/lib/diagnosticCore'
import type { DictationSession, SessionStatus } from '~/types/dictationSession'
import { persistErrorLogsToStorage } from '~/utils/errorLogsStorage'
import {
  persistCurrentSession,
  persistHistorySessions
} from '~/utils/trainingSessionStorage'

export type { DictationSession, SessionStatus } from '~/types/dictationSession'

export interface WordEntry {
  word: string
  phonetic: string
  translation: string
  example_sentence: string
}

/** 可进入专项复习池的诊断类型（不含答对） */
export type ErrorReviewCategory = Exclude<SpellingDiagnosisCategory, 'correct'>

export interface ErrorLogEntry {
  id: string
  target: WordEntry
  wrongInput: string
  category: ErrorReviewCategory
  /** 听写页写入时为 `dictation`；缺省视为历史数据仍展示在复习中 */
  source?: 'dictation'
  /** 听写提交错答时写入（ISO 8601） */
  recordedAt?: string
}

/** 复习列表：仅听写产生的错题（及未带 source 的旧数据） */
export function isDictationReviewEntry(e: ErrorLogEntry): boolean {
  return e.source === 'dictation' || e.source === undefined
}

const MOCK_VOCABULARY: WordEntry[] = [
  {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    translation: '无处不在的；普遍存在的',
    example_sentence:
      'Smartphones have become ubiquitous in modern urban life.'
  },
  {
    word: 'mitigate',
    phonetic: '/ˈmɪtɪɡeɪt/',
    translation: '减轻；缓和',
    example_sentence: 'Governments should take steps to mitigate climate risks.'
  },
  {
    word: 'paradigm',
    phonetic: '/ˈpærədaɪm/',
    translation: '范式；典范',
    example_sentence: 'The discovery shifted the scientific paradigm of the era.'
  },
  {
    word: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
    translation: '有韧性的；能迅速恢复的',
    example_sentence: 'Communities proved remarkably resilient after the flood.'
  },
  {
    word: 'articulate',
    phonetic: '/ɑːˈtɪkjʊlət/',
    translation: '善于表达的；发音清晰的',
    example_sentence: 'She gave an articulate response to the examiner’s question.'
  },
  {
    word: 'exacerbate',
    phonetic: '/ɪɡˈzæsəbeɪt/',
    translation: '加剧；使恶化',
    example_sentence: 'Poor housing can exacerbate health inequalities.'
  },
  {
    word: 'coherent',
    phonetic: '/kəʊˈhɪərənt/',
    translation: '连贯的；一致的',
    example_sentence: 'A coherent argument requires clear topic sentences.'
  },
  {
    word: 'sustainable',
    phonetic: '/səˈsteɪnəbl/',
    translation: '可持续的',
    example_sentence: 'Cities must pursue sustainable transport policies.'
  },
  {
    word: 'unprecedented',
    phonetic: '/ʌnˈpresɪdentɪd/',
    translation: '前所未有的',
    example_sentence: 'The pandemic caused unprecedented disruption to travel.'
  },
  {
    word: 'discern',
    phonetic: '/dɪˈsɜːn/',
    translation: '辨别；看出',
    example_sentence: 'Readers should discern bias when evaluating online sources.'
  }
]

const ERROR_DIST_KEYS: ErrorReviewCategory[] = [
  'sound_alike',
  'typo',
  'morphological',
  'completely_unknown'
]

function localDateYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useWordStore() {
  const words = useState<WordEntry[]>('word-store', () => [...MOCK_VOCABULARY])
  const errorLogs = useState<ErrorLogEntry[]>('word-store:error-logs', () => [])
  const historySessions = useState<DictationSession[]>('word-store:history-sessions', () => [])
  const currentSession = useState<DictationSession | null>('word-store:current-session', () => null)

  function syncErrorLogsToStorage() {
    persistErrorLogsToStorage(errorLogs.value)
  }

  function syncSessionsToStorage() {
    persistHistorySessions(historySessions.value)
    persistCurrentSession(currentSession.value)
  }

  function removeErrorLog(id: string) {
    errorLogs.value = errorLogs.value.filter((e) => e.id !== id)
    syncErrorLogsToStorage()
  }

  function newErrorLogId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `err-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  function pushErrorLog(entry: Omit<ErrorLogEntry, 'id'>) {
    errorLogs.value = [...errorLogs.value, { ...entry, id: newErrorLogId() }]
    syncErrorLogsToStorage()
  }

  function normalizeWordKey(word: string): string {
    return word.trim().toLowerCase()
  }

  /**
   * 听写答错时写入/更新：同一目标词只保留一条，刷新错因与错拼。
   * 复用已有 id，便于 Session.errorIds 与错题池稳定对应。
   */
  function upsertErrorLog(entry: Omit<ErrorLogEntry, 'id'>): string {
    const key = normalizeWordKey(entry.target.word)
    const existing = errorLogs.value.find((e) => normalizeWordKey(e.target.word) === key)
    const id = existing?.id ?? newErrorLogId()
    const without = errorLogs.value.filter((e) => normalizeWordKey(e.target.word) !== key)
    errorLogs.value = [...without, { ...entry, id }]
    syncErrorLogsToStorage()
    return id
  }

  /** 将当前轮次写入历史并从内存清空（用于换轮或结束） */
  function archiveCurrentSession(status: SessionStatus) {
    const cur = currentSession.value
    if (!cur) return
    historySessions.value = [...historySessions.value, { ...cur, status }]
    currentSession.value = null
    syncSessionsToStorage()
  }

  /**
   * 开始新一轮听写：若存在未归档的当前 Session，先以 `ongoing` 追加到 historySessions。
   * 听写页可在客户端维护「队尾重排队列」：答错会把该词下标追加到本轮队尾，直到每个词各拼对一次后归档；
   * `wordsCount` 为本轮队列长度（用户设置的每轮题量，可与词表长度不同；不足时循环抽词），`correctCount` 为答对提交次数。
   */
  function beginDictationSession(wordsCount: number) {
    if (wordsCount <= 0) return
    if (currentSession.value) {
      archiveCurrentSession('ongoing')
    }
    currentSession.value = {
      id: `sess-${Date.now()}`,
      date: localDateYmd(),
      wordsCount,
      correctCount: 0,
      errorIds: [],
      status: 'ongoing'
    }
    syncSessionsToStorage()
  }

  /** 听写整轮正常完成时调用：当前 Session 以 `completed` 写入 historySessions */
  function completeCurrentDictationSession() {
    archiveCurrentSession('completed')
  }

  /** 本轮进行中调整「每轮题量」时同步 Session 的 wordsCount，不重置 correctCount */
  function setCurrentDictationSessionWordCount(wordsCount: number) {
    const cur = currentSession.value
    if (!cur || wordsCount <= 0) return
    cur.wordsCount = wordsCount
    syncSessionsToStorage()
  }

  /** 单次提交结果：答对增加 correctCount；答错写入 errorIds（按错题 id 去重） */
  function recordDictationSessionAnswer(opts: { correct: boolean; errorLogId?: string }) {
    const cur = currentSession.value
    if (!cur) return
    if (opts.correct) {
      cur.correctCount += 1
    } else if (opts.errorLogId && !cur.errorIds.includes(opts.errorLogId)) {
      cur.errorIds = [...cur.errorIds, opts.errorLogId]
    }
    syncSessionsToStorage()
  }

  const recentSessions = computed(() => {
    const list = historySessions.value
    if (list.length <= 5) return [...list].reverse()
    return list.slice(-5).reverse()
  })

  const errorTypeDistribution = computed(() => {
    const counts: Record<ErrorReviewCategory, number> = {
      sound_alike: 0,
      typo: 0,
      morphological: 0,
      completely_unknown: 0
    }
    const byId = new Map(errorLogs.value.map((e) => [e.id, e]))
    const sessions = [...historySessions.value]
    if (currentSession.value) {
      sessions.push(currentSession.value)
    }
    for (const s of sessions) {
      for (const id of s.errorIds) {
        const log = byId.get(id)
        if (log) {
          counts[log.category] += 1
        }
      }
    }
    const total = ERROR_DIST_KEYS.reduce((sum, k) => sum + counts[k], 0)
    const percentages = {} as Record<ErrorReviewCategory, number>
    for (const k of ERROR_DIST_KEYS) {
      percentages[k] = total > 0 ? Math.round((counts[k] / total) * 1000) / 10 : 0
    }
    return { counts, total, percentages }
  })

  return {
    words,
    errorLogs,
    historySessions,
    currentSession,
    removeErrorLog,
    pushErrorLog,
    upsertErrorLog,
    beginDictationSession,
    completeCurrentDictationSession,
    setCurrentDictationSessionWordCount,
    recordDictationSessionAnswer,
    recentSessions,
    errorTypeDistribution
  }
}
