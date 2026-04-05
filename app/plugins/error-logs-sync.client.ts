import type { ErrorLogEntry } from '~/composables/useWordStore'
import {
  ERROR_LOGS_STORAGE_KEY,
  parseStoredErrorLogs,
  persistErrorLogsToStorage,
  readErrorLogsFromStorage
} from '~/utils/errorLogsStorage'

/**
 * 错题池与 localStorage 的中间同步层：
 * - 在插件阶段尽早从 LS 灌入 useState，减轻 SSR payload 把 errorLogs 冲成 [] 的影响
 * - app:mounted 再拉一次：若内存条数少于 LS（例如被 payload 覆盖），用 LS 恢复
 * - watch flush:sync + 业务里同步 persist，避免跳转过快时还未写入 LS
 * - storage 事件：其它标签页写入时同步到当前页
 */
export default defineNuxtPlugin((nuxtApp) => {
  const errorLogs = useState<ErrorLogEntry[]>('word-store:error-logs', () => [])

  function pullFromStorageIfRicher() {
    const fromLs = readErrorLogsFromStorage()
    if (fromLs.length > errorLogs.value.length) {
      errorLogs.value = fromLs
    }
  }

  function applyStorageEventPayload(newValue: string | null) {
    const parsed = parseStoredErrorLogs(newValue)
    errorLogs.value = parsed
  }

  pullFromStorageIfRicher()

  const router = useRouter()
  router.afterEach(() => {
    pullFromStorageIfRicher()
  })

  watch(
    errorLogs,
    (v) => persistErrorLogsToStorage(v),
    { deep: true, flush: 'sync' }
  )

  if (import.meta.client) {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== ERROR_LOGS_STORAGE_KEY) return
      applyStorageEventPayload(e.newValue)
    })
  }
})
