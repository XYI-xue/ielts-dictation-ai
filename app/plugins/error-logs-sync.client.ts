import type { DictationSession } from '~/types/dictationSession'
import type { ErrorLogEntry } from '~/composables/useWordStore'
import {
  ERROR_LOGS_STORAGE_KEY,
  parseStoredErrorLogs,
  persistErrorLogsToStorage,
  readErrorLogsFromStorage
} from '~/utils/errorLogsStorage'
import {
  CURRENT_SESSION_KEY,
  HISTORY_SESSIONS_KEY,
  parseCurrentSession,
  parseHistorySessions,
  persistCurrentSession,
  persistHistorySessions,
  readCurrentSessionFromStorage,
  readHistorySessionsFromStorage
} from '~/utils/trainingSessionStorage'

/**
 * 错题池、训练轮次与 localStorage 同步：
 * - 尽早从 LS 灌入 useState，减轻 SSR payload 把状态冲成默认的影响
 * - 路由切换后尝试用更「全」的错题 LS 合并内存
 * - watch flush:sync + 业务内同步 persist
 * - storage 事件：其它标签页写入时同步
 */
export default defineNuxtPlugin(() => {
  const errorLogs = useState<ErrorLogEntry[]>('word-store:error-logs', () => [])
  const historySessions = useState<DictationSession[]>('word-store:history-sessions', () => [])
  const currentSession = useState<DictationSession | null>('word-store:current-session', () => null)

  function pullErrorLogsIfRicher() {
    const fromLs = readErrorLogsFromStorage()
    if (fromLs.length > errorLogs.value.length) {
      errorLogs.value = fromLs
    }
  }

  function hydrateSessionsFromLocalStorage() {
    historySessions.value = readHistorySessionsFromStorage()
    currentSession.value = readCurrentSessionFromStorage()
  }

  function applyErrorLogsStorageEvent(newValue: string | null) {
    errorLogs.value = parseStoredErrorLogs(newValue)
  }

  pullErrorLogsIfRicher()
  hydrateSessionsFromLocalStorage()

  const router = useRouter()
  router.afterEach(() => {
    pullErrorLogsIfRicher()
  })

  watch(errorLogs, (v) => persistErrorLogsToStorage(v), { deep: true, flush: 'sync' })
  watch(historySessions, (v) => persistHistorySessions(v), { deep: true, flush: 'sync' })
  watch(currentSession, (v) => persistCurrentSession(v), { deep: true, flush: 'sync' })

  if (import.meta.client) {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === ERROR_LOGS_STORAGE_KEY) {
        applyErrorLogsStorageEvent(e.newValue)
        return
      }
      if (e.key === HISTORY_SESSIONS_KEY) {
        historySessions.value = parseHistorySessions(e.newValue)
        return
      }
      if (e.key === CURRENT_SESSION_KEY) {
        currentSession.value = parseCurrentSession(e.newValue)
      }
    })
  }
})
