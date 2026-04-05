import type { SpellingDiagnosisCategory } from '~/lib/diagnosticCore'
import { persistErrorLogsToStorage } from '~/utils/errorLogsStorage'

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

export function useWordStore() {
  const words = useState<WordEntry[]>('word-store', () => [...MOCK_VOCABULARY])
  const errorLogs = useState<ErrorLogEntry[]>('word-store:error-logs', () => [])

  function syncErrorLogsToStorage() {
    persistErrorLogsToStorage(errorLogs.value)
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
   * 听写里后来改对不会删除本条；移出复习池仅在 Review 完成专项（如 removeErrorLog）时进行。
   */
  function upsertErrorLog(entry: Omit<ErrorLogEntry, 'id'>) {
    const key = normalizeWordKey(entry.target.word)
    const without = errorLogs.value.filter((e) => normalizeWordKey(e.target.word) !== key)
    errorLogs.value = [...without, { ...entry, id: newErrorLogId() }]
    syncErrorLogsToStorage()
  }

  return {
    words,
    errorLogs,
    removeErrorLog,
    pushErrorLog,
    upsertErrorLog
  }
}
