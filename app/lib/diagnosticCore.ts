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

/** Metaphone：编码相等，或编辑距离 ≤1 视为发音编码高度相近 */
function metaphoneSimilar(userToken: string, targetToken: string): boolean {
  const u = metaphone.process(userToken)
  const t = metaphone.process(targetToken)
  if (!u || !t) return false
  if (u === t) return true
  return levenshtein.get(u, t) <= 1
}

/**
 * 根据 PRD 3.3：`dict` 为合法英文小写词集合（用于判定用户输入 / 目标词是否在词典中）。
 * 目标词通常也应出现在 `dict` 中，否则「合法词」相关分支可能无法触发。
 */
export function diagnoseError(
  inputWord: string,
  targetWord: string,
  dict: ReadonlySet<string>
): SpellingDiagnosisCategory {
  const target = normalizeToken(targetWord)
  const input = normalizeToken(inputWord)

  if (!target) return 'completely_unknown'
  if (!input) return 'completely_unknown'
  if (input === target) return 'correct'

  const validUser = isValidEnglishWord(input, dict)
  const validTarget = isValidEnglishWord(target, dict)

  if (validUser && validTarget && stemsAlign(input, target)) {
    return 'morphological'
  }

  if (validUser && validTarget && metaphoneSimilar(input, target)) {
    return 'sound_alike'
  }

  if (!validUser) {
    const dist = levenshtein.get(input, target)
    if (dist <= 2) return 'typo'
    return 'completely_unknown'
  }

  return 'completely_unknown'
}
