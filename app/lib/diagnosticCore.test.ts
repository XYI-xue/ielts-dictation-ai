import { describe, expect, it } from 'vitest'

import {
  diagnoseError,
  DIAGNOSIS_POOL_LABEL,
  type SpellingDiagnosisCategory
} from './diagnosticCore'

describe('diagnoseError', () => {
  it('returns correct for exact match (case-insensitive)', () => {
    const dict = new Set(['hello'])
    expect(diagnoseError('HELLO', 'hello', dict)).toBe('correct')
  })

  it('returns completely_unknown for empty input', () => {
    const dict = new Set(['hello'])
    expect(diagnoseError('  ', 'hello', dict)).toBe('completely_unknown')
    expect(diagnoseError('', 'hello', dict)).toBe('completely_unknown')
  })

  it('classifies morphological when both tokens are dictionary words with aligned stems', () => {
    const dict = new Set(['cat', 'cats'])
    expect(diagnoseError('cats', 'cat', dict)).toBe('morphological')
    expect(diagnoseError('cat', 'cats', dict)).toBe('morphological')
  })

  it('classifies sound_alike when dictionary words share Metaphone but stems are not aligned', () => {
    const dict = new Set(['right', 'write'])
    expect(diagnoseError('right', 'write', dict)).toBe('sound_alike')
  })

  it('classifies typo when input is not a dictionary word and Levenshtein distance ≤ 2', () => {
    const dict = new Set(['rhythm'])
    expect(diagnoseError('rythm', 'rhythm', dict)).toBe('typo')
    expect(diagnoseError('rhythn', 'rhythm', dict)).toBe('typo')
  })

  it('classifies completely_unknown when typo path has distance > 2', () => {
    const dict = new Set(['rhythm'])
    expect(diagnoseError('xyzabc', 'rhythm', dict)).toBe('completely_unknown')
  })

  it('classifies completely_unknown for valid but unrelated dictionary words', () => {
    const dict = new Set(['hello', 'world'])
    expect(diagnoseError('hello', 'world', dict)).toBe('completely_unknown')
  })

  it('maps every non-correct category to a pool label', () => {
    const categories: SpellingDiagnosisCategory[] = [
      'correct',
      'sound_alike',
      'morphological',
      'typo',
      'completely_unknown'
    ]
    for (const c of categories) {
      expect(DIAGNOSIS_POOL_LABEL[c]).toMatch(/\S/)
    }
  })
})
