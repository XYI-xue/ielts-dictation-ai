import commonWordsRaw from './common-words.txt?raw'

import {
  diagnoseError as runDiagnosis,
  type SpellingDiagnosisCategory,
  DIAGNOSIS_POOL_LABEL,
  DIAGNOSIS_SHORT_LABEL
} from '~/lib/diagnosticCore'

export type { SpellingDiagnosisCategory }
export { DIAGNOSIS_POOL_LABEL, DIAGNOSIS_SHORT_LABEL }

export function diagnoseError(
  inputWord: string,
  targetWord: string,
  dict?: ReadonlySet<string>
): SpellingDiagnosisCategory {
  return runDiagnosis(inputWord, targetWord, dict ?? getDefaultDictionary())
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

export function getDefaultDictionary(): Set<string> {
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

/**
 * 应用内默认入口：使用内置词表 + 课内词。
 * 与 `diagnoseError(input, target, dict)` 等价，便于组件侧少传参。
 */
export function analyzeSpellingError(
  targetWord: string,
  userInput: string
): SpellingDiagnosisCategory {
  return runDiagnosis(userInput, targetWord, getDefaultDictionary())
}
