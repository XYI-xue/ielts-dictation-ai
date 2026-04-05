export interface WordEntry {
  word: string
  phonetic: string
  translation: string
  example_sentence: string
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

  return {
    words
  }
}
