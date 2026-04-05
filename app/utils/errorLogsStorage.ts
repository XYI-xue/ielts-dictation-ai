import type { ErrorLogEntry, WordEntry } from '~/composables/useWordStore'

export const ERROR_LOGS_STORAGE_KEY = 'ielts-dictation:error-logs'

export function isValidErrorLogEntry(x: unknown): x is ErrorLogEntry {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (
    typeof o.id !== 'string' ||
    typeof o.wrongInput !== 'string' ||
    typeof o.category !== 'string' ||
    o.target === null ||
    typeof o.target !== 'object' ||
    typeof (o.target as WordEntry).word !== 'string'
  ) {
    return false
  }
  if (o.source !== undefined && o.source !== 'dictation') return false
  if (o.recordedAt !== undefined && typeof o.recordedAt !== 'string') return false
  return true
}

export function parseStoredErrorLogs(raw: string | null): ErrorLogEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidErrorLogEntry)
  } catch {
    return []
  }
}

export function persistErrorLogsToStorage(logs: ErrorLogEntry[]): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(ERROR_LOGS_STORAGE_KEY, JSON.stringify(logs))
  } catch {
    /* quota / private mode */
  }
}

export function readErrorLogsFromStorage(): ErrorLogEntry[] {
  if (!import.meta.client) return []
  return parseStoredErrorLogs(localStorage.getItem(ERROR_LOGS_STORAGE_KEY))
}
