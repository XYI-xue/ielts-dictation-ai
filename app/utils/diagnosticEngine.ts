import commonWordsRaw from './common-words.txt?raw'

import levenshtein from 'fast-levenshtein'
// Deep imports avoid pulling WordNet / classifiers / mongoose into the client bundle.
import Metaphone from 'natural/lib/natural/phonetics/metaphone.js'
import PorterStemmer from 'natural/lib/natural/stemmers/porter_stemmer.js'

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

/** Toast / 卡片中的简短判定文案 */
export const DIAGNOSIS_SHORT_LABEL: Record<
  Exclude<SpellingDiagnosisCategory, 'correct'>,
  string
> = {
  sound_alike: '近音/词义混淆',
  morphological: '词缀变形',
  typo: '视觉易混淆',
  completely_unknown: '完全生词'
}

const metaphone = new Metaphone()

function normalizeToken(raw: string): string | null {
  const t = raw.trim().toLowerCase()
  if (!t) return null
  if (!/^[a-z]+$/.test(t)) return null
  return t
}

function isValidEnglishWord(token: string, dict: ReadonlySet<string>): boolean {
  return dict.has(token)
}

/**
 * Porter 词干完全一致，或词干编辑距离 ≤2（缓解 analysis / analyze 等在 Porter 下不完全相等的情况）
 */
function stemsAlign(userToken: string, targetToken: string): boolean {
  const su = PorterStemmer.stem(userToken)
  const st = PorterStemmer.stem(targetToken)
  if (su === st) return true
  if (su.length < 2 || st.length < 2) return false
  return levenshtein.get(su, st) <= 2
}

/**
 * 根据 PRD 3.3：`dict` 为合法英文小写词集合（用于判定用户输入 / 目标词是否在词典中）。
 * 目标词通常也应出现在 `dict` 中，否则「合法词」相关分支可能无法触发。
 *
 * 近音 / 易混：先比 Metaphone 编码；编码相同且拼写不同 → 近音辨析；编码不同 → 用 Levenshtein（≤2）判易混拼写。
 */
export function diagnoseError(
  inputWord: string,
  targetWord: string,
  dict?: ReadonlySet<string>
): SpellingDiagnosisCategory {
  const d = dict ?? getDefaultDictionary()
  const target = normalizeToken(targetWord)
  const input = normalizeToken(inputWord)

  if (!target) return 'completely_unknown'
  if (!input) return 'completely_unknown'
  if (input === target) return 'correct'

  const validUser = isValidEnglishWord(input, d)
  const validTarget = isValidEnglishWord(target, d)

  if (validUser && validTarget && stemsAlign(input, target)) {
    return 'morphological'
  }

  const uMeta = metaphone.process(input)
  const tMeta = metaphone.process(target)
  if (uMeta && tMeta && uMeta === tMeta && input !== target) {
    return 'sound_alike'
  }

  const dist = levenshtein.get(input, target)
  if (dist <= 2) return 'typo'
  return 'completely_unknown'
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
  return diagnoseError(userInput, targetWord, getDefaultDictionary())
}
