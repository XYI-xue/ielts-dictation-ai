import { doubleMetaphone } from 'double-metaphone'
import { stemmer } from 'stemmer'

import commonWordsRaw from './common-words.txt?raw'

/**
 * PRD 3.3 错误分类（听写拼写与目标不一致时的分流逻辑）
 */
export type SpellingDiagnosisCategory =
  | 'correct'
  | 'sound_alike'
  | 'morphological'
  | 'typo'
  | 'completely_unknown'

/** 与复习池对应的专项名称（展示用） */
export const DIAGNOSIS_POOL_LABEL: Record<SpellingDiagnosisCategory, string> = {
  correct: '正确',
  sound_alike: '近音辨析专项',
  morphological: '语法变形专项',
  typo: '易混拼写专项',
  completely_unknown: '生词重学专项'
}

/** 与 MOCK 词表对齐，保证雅思词在「合法词」判定中可用（10k 常用词未必覆盖） */
const CURRICULUM_WORDS = [
  'ubiquitous',
  'mitigate',
  'paradigm',
  'resilient',
  'articulate',
  'exacerbate',
  'coherent',
  'sustainable',
  'unprecedented',
  'discern'
] as const

let dictionary: Set<string> | null = null

function getDictionary(): Set<string> {
  if (!dictionary) {
    const set = new Set<string>()
    for (const line of commonWordsRaw.split(/\r?\n/)) {
      const w = line.trim().toLowerCase()
      if (w) set.add(w)
    }
    for (const w of CURRICULUM_WORDS) {
      set.add(w)
    }
    dictionary = set
  }
  return dictionary
}

/** 手写 Levenshtein（PRD 要求的编辑距离） */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const row = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) row[j] = j

  for (let i = 1; i <= m; i++) {
    let prev = row[0]!
    row[0] = i
    const ac = a.charCodeAt(i - 1)
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]!
      const cost = ac === b.charCodeAt(j - 1) ? 0 : 1
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost)
      prev = tmp
    }
  }
  return row[n]!
}

function normalizeToken(raw: string): string | null {
  const t = raw.trim().toLowerCase()
  if (!t) return null
  if (!/^[a-z]+$/.test(t)) return null
  return t
}

function isValidEnglishWord(token: string): boolean {
  return getDictionary().has(token)
}

/**
 * Porter 词干完全一致，或词干编辑距离 ≤2（缓解 analysis / analyze 等在 Porter 下不完全相等的情况）
 */
function stemsAlign(userToken: string, targetToken: string): boolean {
  const su = stemmer(userToken)
  const st = stemmer(targetToken)
  if (su === st) return true
  if (su.length < 2 || st.length < 2) return false
  return levenshtein(su, st) <= 2
}

/** Double Metaphone：主/次码任一交叉相等，或主码编辑距离 ≤1 视为发音编码高度相近 */
function metaphoneSimilar(userToken: string, targetToken: string): boolean {
  const [up, us] = doubleMetaphone(userToken)
  const [tp, ts] = doubleMetaphone(targetToken)

  if (up && (up === tp || up === ts)) return true
  if (us && (us === tp || us === ts)) return true
  if (tp && tp === us) return true
  if (ts && ts === up) return true

  if (up && tp && levenshtein(up, tp) <= 1) return true
  return false
}

/**
 * 主入口：根据 PRD 3.3 判定错误类别（不含「查看答案」检测，由调用方处理）
 */
export function analyzeSpellingError(
  targetWord: string,
  userInput: string
): SpellingDiagnosisCategory {
  const target = normalizeToken(targetWord)
  const input = normalizeToken(userInput)

  if (!target) return 'completely_unknown'
  if (!input) return 'completely_unknown'
  if (input === target) return 'correct'

  const validUser = isValidEnglishWord(input)
  const validTarget = isValidEnglishWord(target)

  if (validUser && validTarget && stemsAlign(input, target)) {
    return 'morphological'
  }

  if (validUser && validTarget && metaphoneSimilar(input, target)) {
    return 'sound_alike'
  }

  if (!validUser) {
    const dist = levenshtein(input, target)
    if (dist <= 2) return 'typo'
    return 'completely_unknown'
  }

  return 'completely_unknown'
}
