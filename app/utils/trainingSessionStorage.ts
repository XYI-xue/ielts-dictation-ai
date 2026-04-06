import type { DictationSession, SessionStatus } from '~/types/dictationSession'

export const HISTORY_SESSIONS_KEY = 'ielts-dictation:history-sessions'
export const CURRENT_SESSION_KEY = 'ielts-dictation:current-session'

function isSessionStatus(x: unknown): x is SessionStatus {
  return x === 'completed' || x === 'ongoing'
}

export function isValidDictationSession(x: unknown): x is DictationSession {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.date !== 'string') return false
  if (typeof o.wordsCount !== 'number' || typeof o.correctCount !== 'number') return false
  if (!Array.isArray(o.errorIds) || !o.errorIds.every((id) => typeof id === 'string')) return false
  if (!isSessionStatus(o.status)) return false
  return true
}

export function parseHistorySessions(raw: string | null): DictationSession[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidDictationSession)
  } catch {
    return []
  }
}

export function parseCurrentSession(raw: string | null): DictationSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isValidDictationSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function persistHistorySessions(sessions: DictationSession[]): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(HISTORY_SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    /* quota / private mode */
  }
}

export function persistCurrentSession(session: DictationSession | null): void {
  if (!import.meta.client) return
  try {
    if (session === null) {
      localStorage.removeItem(CURRENT_SESSION_KEY)
    } else {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))
    }
  } catch {
    /* quota / private mode */
  }
}

export function readHistorySessionsFromStorage(): DictationSession[] {
  if (!import.meta.client) return []
  return parseHistorySessions(localStorage.getItem(HISTORY_SESSIONS_KEY))
}

export function readCurrentSessionFromStorage(): DictationSession | null {
  if (!import.meta.client) return null
  return parseCurrentSession(localStorage.getItem(CURRENT_SESSION_KEY))
}
