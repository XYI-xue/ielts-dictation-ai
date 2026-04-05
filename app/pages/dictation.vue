<template>
  <div class="mx-auto max-w-lg pb-12">
    <header class="mb-6 space-y-2">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-50">Dictation</h1>
        <p
          v-if="words.length"
          class="rounded-full border border-zinc-700/80 bg-zinc-900/60 px-3 py-1 text-xs font-medium tabular-nums text-zinc-300"
        >
          第 {{ currentIndex + 1 }} / {{ words.length }} 词
        </p>
      </div>
      <p class="text-sm leading-relaxed text-zinc-400">
        第一个词请点击播放开始；之后每题在跳转后会自动朗读。在下方输入框拼写单词，按
        <kbd
          class="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200"
          >Enter</kbd
        >
        提交。答错会写入专项复习池；听写里后来改对也不会从池中移除，需在 Review
        页完成巩固。答错后会先短暂展示该词正确信息，再进入盲听写；也可随时点卡片
        <span class="text-zinc-300">×</span>
        跳过本题。答对后会先展示完整词条至少数秒，之后才可按
        <kbd
          class="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200"
          >Enter</kbd
        >
        / 点 × 提前下一题，并在更长时间后自动进入下一题。
      </p>
    </header>

    <div
      class="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] ring-1 ring-inset ring-white/[0.06] sm:p-8"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-600/5 blur-3xl"
        aria-hidden="true"
      />

      <div v-if="roundComplete" class="relative z-10 space-y-4 py-10 text-center">
        <p class="text-lg font-medium text-zinc-100">本轮听写已完成</p>
        <p class="text-sm text-zinc-400">
          可以稍后在 Dashboard 查看进度，或重新开始一轮。
        </p>
        <p
          v-if="distinctWrongWordsThisRound > 0"
          class="mx-auto max-w-sm rounded-xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-300"
        >
          本轮共有
          <span class="font-semibold tabular-nums text-zinc-100">{{ distinctWrongWordsThisRound }}</span>
          个词因拼写错误已同步至
          <NuxtLink
            to="/review"
            class="font-medium text-violet-400 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300"
          >
            专项复习
          </NuxtLink>
          ，可按诊断分类巩固。
        </p>
        <button
          type="button"
          class="mt-2 rounded-xl border border-violet-500/40 bg-violet-950/40 px-5 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-900/50"
          @click="restartRound"
        >
          重新开始
        </button>
      </div>

      <template v-else>
        <div class="relative z-10 flex flex-col items-center gap-6">
          <button
            type="button"
            class="group flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-zinc-600/80 bg-zinc-800/50 text-zinc-100 shadow-lg shadow-black/30 transition-all hover:border-violet-500/50 hover:bg-zinc-800 hover:shadow-violet-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-600/80 disabled:hover:bg-zinc-800/50"
            :class="[
              isSpeaking &&
                'border-violet-400/70 bg-violet-950/40 shadow-violet-900/30 ring-4 ring-violet-500/20'
            ]"
            aria-label="播放发音"
            :disabled="!currentWord"
            :aria-busy="isSpeaking"
            @click="speakCurrentWord"
          >
            <span
              class="text-4xl leading-none transition-transform group-hover:scale-105"
              :class="{ 'animate-pulse': isSpeaking }"
              aria-hidden="true"
              >▶</span
            >
            <span class="mt-2 text-xs font-semibold tracking-wide text-zinc-300 group-hover:text-white">
              播放发音
            </span>
          </button>
          <p class="text-center text-xs leading-relaxed text-zinc-400">
            使用本机浏览器的语音合成朗读，需系统已安装英文语音。
          </p>

          <div class="w-full">
            <label for="dictation-input" class="sr-only">听写输入</label>
            <input
              id="dictation-input"
              ref="inputRef"
              v-model="answer"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              enterkeyhint="done"
              placeholder="在此输入单词…"
              :readonly="inputReadonlyForFeedback"
              :class="inputReadonlyForFeedback && 'cursor-default opacity-90'"
              class="w-full rounded-xl border border-zinc-700/90 bg-zinc-950/60 px-4 py-4 text-center text-3xl font-medium tracking-wide text-zinc-50 shadow-inner shadow-black/40 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:text-4xl"
              @keydown.enter.prevent="onEnterKey"
            />
            <p class="mt-2.5 text-center text-xs text-zinc-400">
              <template v-if="feedback && !feedback.match && wrongRevealActive">
                正在展示正确答案（约 {{ wrongRevealLabel }}）；结束后可重新听写并提交。
              </template>
              <template v-else-if="feedback && !feedback.match">
                答案已隐藏，请点「播放发音」重新听写，改正后按
                <kbd
                  class="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-200"
                  >Enter</kbd
                >
                提交；或点卡片
                <span class="font-mono text-zinc-300">×</span>
                跳过本题。
              </template>
              <template v-else-if="feedback?.match && !correctManualUnlocked">
                拼写正确，请先阅读下方完整词条；约 {{ correctMinDisplayLabel }} 后可按
                <kbd
                  class="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-200"
                  >Enter</kbd
                >
                或 × 提前进入下一题（{{ correctAutoAdvanceLabel }} 后仍会自动跳转）。
              </template>
              <template v-else-if="feedback?.match">
                可按
                <kbd
                  class="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-200"
                  >Enter</kbd
                >
                或 × 立即下一题；{{ correctAutoAdvanceLabel }} 内未操作将自动进入下一题。
              </template>
              <template v-else>
                提交快捷键：
                <kbd
                  class="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-200"
                  >Enter</kbd
                >
              </template>
            </p>
          </div>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="feedback" class="w-full space-y-3">
              <!-- 答错 · 阶段一：完整正确答案（短时展示） -->
              <div
                v-if="!feedback.match && wrongRevealActive"
                role="status"
                class="rounded-xl border border-red-500/45 bg-red-950/30 px-4 py-4 text-red-50"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <p
                      v-if="feedback.category && feedback.category !== 'correct'"
                      class="rounded-lg border border-amber-500/35 bg-amber-950/40 px-3 py-2.5 text-xs leading-snug text-amber-100/95"
                    >
                      {{ wrongToastText }}
                    </p>
                    <p class="text-xs font-medium text-red-200/90">正确答案（供你对照）</p>
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">词条</p>
                      <p
                        class="break-words font-mono text-2xl font-semibold tracking-tight text-red-200 sm:text-3xl"
                      >
                        {{ feedback.entry.word }}
                      </p>
                    </div>
                    <p class="text-base text-red-100/90">
                      <span class="font-medium text-zinc-400">音标</span>
                      {{ feedback.entry.phonetic }}
                    </p>
                    <p class="leading-relaxed text-red-100/85">
                      <span class="font-medium text-zinc-400">释义</span>
                      {{ feedback.entry.translation }}
                    </p>
                    <p class="text-xs leading-relaxed text-red-200/80">
                      <span class="font-medium text-zinc-500">例句</span>
                      {{ feedback.entry.example_sentence }}
                    </p>
                    <div class="border-t border-red-500/25 pt-3">
                      <p class="break-words text-zinc-300">
                        你的输入：
                        <span class="font-mono text-zinc-50">{{ feedback.input }}</span>
                      </p>
                    </div>
                    <p class="text-xs text-zinc-500">
                      约 {{ wrongRevealLabel }} 后将隐藏上述答案，请用播放重新盲听写。
                    </p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
                    aria-label="跳过本题并进入下一题"
                    @click="dismissFeedback"
                  >
                    <span class="block text-lg leading-none" aria-hidden="true">×</span>
                  </button>
                </div>
              </div>

              <!-- 答错 · 阶段二：盲听写（仅诊断 + 本次输入） -->
              <div
                v-else-if="!feedback.match"
                role="status"
                class="rounded-xl border border-red-500/45 bg-red-950/30 px-4 py-4 text-red-50"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <p
                      v-if="feedback.category && feedback.category !== 'correct'"
                      class="rounded-lg border border-amber-500/35 bg-amber-950/40 px-3 py-2.5 text-xs leading-snug text-amber-100/95"
                    >
                      {{ wrongToastText }}
                    </p>
                    <p class="break-words text-zinc-300">
                      你的输入：
                      <span class="font-mono text-zinc-50">{{ feedback.input }}</span>
                    </p>
                    <p class="text-xs leading-relaxed text-zinc-500">
                      当前为盲听写，未显示目标词与释义；请用上方播放重新听写，或点 × 跳过本题。
                    </p>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
                    aria-label="跳过本题并进入下一题"
                    @click="dismissFeedback"
                  >
                    <span class="block text-lg leading-none" aria-hidden="true">×</span>
                  </button>
                </div>
              </div>

              <!-- 答对：完整词条信息 -->
              <div
                v-else
                role="status"
                class="rounded-xl border border-emerald-500/45 bg-emerald-950/35 px-4 py-4 text-emerald-50"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">词条</p>
                      <p
                        class="break-words font-mono text-2xl font-semibold tracking-tight text-emerald-300 sm:text-3xl"
                      >
                        {{ feedback.entry.word }}
                      </p>
                    </div>
                    <p class="text-base text-emerald-100/90">
                      <span class="font-medium text-zinc-400">音标</span>
                      {{ feedback.entry.phonetic }}
                    </p>
                    <p class="leading-relaxed text-emerald-100/85">
                      <span class="font-medium text-zinc-400">释义</span>
                      {{ feedback.entry.translation }}
                    </p>
                    <p class="text-xs leading-relaxed text-emerald-200/80">
                      <span class="font-medium text-zinc-500">例句</span>
                      {{ feedback.entry.example_sentence }}
                    </p>
                    <div class="border-t border-emerald-500/20 pt-3">
                      <p class="break-words text-zinc-300">
                        你的输入：
                        <span class="font-mono text-zinc-50">{{ feedback.input }}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-35"
                    :disabled="!correctManualUnlocked"
                    :aria-label="
                      correctManualUnlocked ? '立即进入下一题' : '请稍候，阅读词条后可进入下一题'
                    "
                    @click="dismissFeedback"
                  >
                    <span class="block text-lg leading-none" aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  analyzeSpellingError,
  DIAGNOSIS_POOL_LABEL,
  DIAGNOSIS_SHORT_LABEL,
  type SpellingDiagnosisCategory
} from '~/utils/diagnosticEngine'
import type { ErrorReviewCategory, WordEntry } from '~/composables/useWordStore'

const { words, upsertErrorLog } = useWordStore()

const currentIndex = ref(0)
const answer = ref('')
const isSpeaking = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const roundComplete = ref(false)

/** 本轮听写中至少答错过一次的词（按词形归一化去重），用于结束页摘要 */
const wrongWordKeysThisRound = ref<Set<string>>(new Set())

const distinctWrongWordsThisRound = computed(() => wrongWordKeysThisRound.value.size)

function markWrongWordThisRound(word: string) {
  const k = word.trim().toLowerCase()
  if (wrongWordKeysThisRound.value.has(k)) return
  const next = new Set(wrongWordKeysThisRound.value)
  next.add(k)
  wrongWordKeysThisRound.value = next
}

/** 答错后展示完整正确答案的时长，结束后进入盲听写 */
const WRONG_REVEAL_MS = 3200
/** 答对后至少展示词条的时长，期间不可 Enter/× 提前下一题 */
const CORRECT_MIN_DISPLAY_MS = 2000
/** 答对后自动进入下一题的总等待（须 ≥ CORRECT_MIN_DISPLAY_MS） */
const CORRECT_AUTO_ADVANCE_MS = 3000

const wrongRevealLabel = `${Math.max(1, Math.round(WRONG_REVEAL_MS / 1000))} 秒`
const correctMinDisplayLabel = `${Math.max(1, Math.round(CORRECT_MIN_DISPLAY_MS / 1000))} 秒`
const correctAutoAdvanceLabel = `${Math.max(1, Math.round(CORRECT_AUTO_ADVANCE_MS / 1000))} 秒`

type Feedback = {
  input: string
  target: string
  match: boolean
  category: SpellingDiagnosisCategory | null
  entry: WordEntry
}

const feedback = ref<Feedback | null>(null)
let correctAdvanceTimer: ReturnType<typeof setTimeout> | null = null
let correctManualUnlockTimer: ReturnType<typeof setTimeout> | null = null
const correctManualUnlocked = ref(false)

const wrongRevealActive = ref(false)
let wrongRevealTimer: ReturnType<typeof setTimeout> | null = null

const currentWord = computed(() => {
  const list = words.value
  if (!list.length) return null
  const i = Math.min(Math.max(currentIndex.value, 0), list.length - 1)
  return list[i]!
})

/** 答对等待跳转、或答错揭示答案期间只读 */
const inputReadonlyForFeedback = computed(
  () =>
    Boolean(wrongRevealActive.value) ||
    Boolean(feedback.value?.match && correctAdvanceTimer !== null)
)

function poolToastFragment(category: Exclude<SpellingDiagnosisCategory, 'correct'>): string {
  const base = DIAGNOSIS_POOL_LABEL[category].replace(/专项$/, '')
  return `${base}池`
}

/** 答错提示：不透露目标词拼写，仅分类与分流（你的输入单独展示在卡片中） */
const wrongToastText = computed(() => {
  const f = feedback.value
  if (!f || f.match || !f.category || f.category === 'correct') return ''
  const cat = f.category
  const label = DIAGNOSIS_SHORT_LABEL[cat]
  const pool = poolToastFragment(cat)
  return `⚠️ 拼写错误。系统判定：${label}。已加入${pool}。`
})

function clearWrongRevealTimer() {
  if (wrongRevealTimer) {
    clearTimeout(wrongRevealTimer)
    wrongRevealTimer = null
  }
  wrongRevealActive.value = false
}

function startWrongRevealPhase() {
  clearWrongRevealTimer()
  wrongRevealActive.value = true
  wrongRevealTimer = setTimeout(() => {
    wrongRevealTimer = null
    wrongRevealActive.value = false
    nextTick(() => inputRef.value?.focus())
  }, WRONG_REVEAL_MS)
}

function clearCorrectTimers() {
  if (correctAdvanceTimer) {
    clearTimeout(correctAdvanceTimer)
    correctAdvanceTimer = null
  }
  if (correctManualUnlockTimer) {
    clearTimeout(correctManualUnlockTimer)
    correctManualUnlockTimer = null
  }
  correctManualUnlocked.value = false
}

function dismissFeedback() {
  if (feedback.value?.match) {
    if (!correctManualUnlocked.value) return
    advanceAfterCorrect()
    return
  }
  if (feedback.value && !feedback.value.match) {
    continueAfterWrong()
    return
  }
  feedback.value = null
}

function onEnterKey() {
  if (wrongRevealActive.value) return
  if (feedback.value?.match && correctAdvanceTimer !== null) {
    if (!correctManualUnlocked.value) return
    advanceAfterCorrect()
    return
  }
  submitAnswer()
}

function onGlobalEnter(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (wrongRevealActive.value) return
  if (!feedback.value?.match || correctAdvanceTimer === null) return
  if (!correctManualUnlocked.value) return
  const ae = document.activeElement as HTMLElement | null
  if (ae && ae !== inputRef.value && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
    return
  }
  e.preventDefault()
  advanceAfterCorrect()
}

function speakCurrentWord() {
  if (!import.meta.client) return
  const w = currentWord.value
  if (!w) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(w.word)
  utterance.lang = 'en-US'
  utterance.rate = 0.92
  utterance.onstart = () => {
    isSpeaking.value = true
  }
  utterance.onend = () => {
    isSpeaking.value = false
    nextTick(() => inputRef.value?.focus())
  }
  utterance.onerror = () => {
    isSpeaking.value = false
  }
  window.speechSynthesis.speak(utterance)
}

function advanceAfterCorrect() {
  clearCorrectTimers()
  clearWrongRevealTimer()
  const list = words.value
  if (!list.length) return

  if (currentIndex.value >= list.length - 1) {
    feedback.value = null
    roundComplete.value = true
    return
  }

  currentIndex.value += 1
  feedback.value = null
  nextTick(() => speakCurrentWord())
}

/** 答错状态下点 ×：跳过本题，进入下一题并自动朗读（最后一题则结束本轮） */
function continueAfterWrong() {
  const list = words.value
  if (!list.length) return

  clearCorrectTimers()
  clearWrongRevealTimer()
  feedback.value = null

  if (currentIndex.value >= list.length - 1) {
    roundComplete.value = true
    return
  }

  currentIndex.value += 1
  nextTick(() => speakCurrentWord())
}

function submitAnswer() {
  const w = currentWord.value
  if (!w || roundComplete.value) return
  if (wrongRevealActive.value) return

  const raw = answer.value.trim()
  const displayInput = raw.length ? raw : '（空）'

  const category = analyzeSpellingError(w.word, raw)
  const match = category === 'correct'

  clearCorrectTimers()

  feedback.value = {
    input: displayInput,
    target: w.word,
    match,
    category: match ? 'correct' : category,
    entry: { ...w }
  }
  answer.value = ''

  if (match) {
    // 不在此从复习池删词：听写中改对只表示本轮过关，错题仍应在 Review 专项巩固
    correctManualUnlocked.value = false
    correctManualUnlockTimer = setTimeout(() => {
      correctManualUnlockTimer = null
      correctManualUnlocked.value = true
    }, CORRECT_MIN_DISPLAY_MS)
    correctAdvanceTimer = setTimeout(() => {
      correctAdvanceTimer = null
      advanceAfterCorrect()
    }, CORRECT_AUTO_ADVANCE_MS)
  } else {
    if (category !== 'correct') {
      markWrongWordThisRound(w.word)
      upsertErrorLog({
        target: { ...w },
        wrongInput: raw,
        category: category as ErrorReviewCategory,
        source: 'dictation',
        recordedAt: new Date().toISOString()
      })
    }
    startWrongRevealPhase()
  }

  nextTick(() => inputRef.value?.focus())
}

function restartRound() {
  clearCorrectTimers()
  clearWrongRevealTimer()
  feedback.value = null
  roundComplete.value = false
  currentIndex.value = 0
  answer.value = ''
  wrongWordKeysThisRound.value = new Set()
  nextTick(() => inputRef.value?.focus())
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onGlobalEnter)
  }
})

onBeforeUnmount(() => {
  clearCorrectTimers()
  clearWrongRevealTimer()
  if (import.meta.client) {
    window.removeEventListener('keydown', onGlobalEnter)
    window.speechSynthesis.cancel()
  }
})
</script>
