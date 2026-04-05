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
        先点播放听发音，在下方输入框拼写单词；按
        <kbd
          class="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200"
          >Enter</kbd
        >
        提交。
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

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="feedback"
          role="status"
          class="relative z-10 mb-6 rounded-xl border px-4 py-3.5"
          :class="
            feedback.match
              ? 'border-emerald-500/35 bg-emerald-950/40'
              : 'border-amber-500/35 bg-amber-950/35'
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1.5 text-sm">
              <p class="font-medium text-zinc-100">
                <span v-if="feedback.match" class="text-emerald-400">拼写一致</span>
                <span v-else class="text-amber-200">拼写不一致</span>
              </p>
              <p
                v-if="!feedback.match && feedback.poolLabel"
                class="rounded-lg border border-violet-500/25 bg-violet-950/30 px-2.5 py-2 text-xs leading-snug text-violet-200/95"
              >
                <span class="text-zinc-400">诊断分流 · </span>
                <span class="font-medium text-violet-100">{{ feedback.poolLabel }}</span>
              </p>
              <p class="break-words text-zinc-300">
                你的输入：
                <span class="font-mono text-zinc-50">{{ feedback.input }}</span>
              </p>
              <p class="break-words text-zinc-400">
                本词目标：
                <span class="font-mono text-zinc-200">{{ feedback.target }}</span>
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
              aria-label="关闭反馈"
              @click="clearFeedback"
            >
              <span class="block text-lg leading-none" aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </Transition>

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
            class="w-full rounded-xl border border-zinc-700/90 bg-zinc-950/60 px-4 py-4 text-center text-3xl font-medium tracking-wide text-zinc-50 shadow-inner shadow-black/40 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:text-4xl"
            @keydown.enter.prevent="submitAnswer"
          />
          <p class="mt-2.5 text-center text-xs text-zinc-400">
            提交快捷键：
            <kbd
              class="rounded border border-zinc-600 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.7rem] text-zinc-200"
              >Enter</kbd
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  analyzeSpellingError,
  DIAGNOSIS_POOL_LABEL,
  type SpellingDiagnosisCategory
} from '~/utils/diagnosticEngine'

const { words } = useWordStore()

const currentIndex = ref(0)
const answer = ref('')
const isSpeaking = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

type Feedback = {
  input: string
  target: string
  match: boolean
  category: SpellingDiagnosisCategory | null
  poolLabel: string | null
}

const feedback = ref<Feedback | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

const currentWord = computed(() => {
  const list = words.value
  if (!list.length) return null
  const i = Math.min(Math.max(currentIndex.value, 0), list.length - 1)
  return list[i]!
})

function clearFeedback() {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = null
  }
  feedback.value = null
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

function submitAnswer() {
  const w = currentWord.value
  if (!w) return

  const raw = answer.value.trim()
  const displayInput = raw.length ? raw : '（空）'

  const category = analyzeSpellingError(w.word, raw)
  const match = category === 'correct'

  clearFeedback()
  feedback.value = {
    input: displayInput,
    target: w.word,
    match,
    category: match ? 'correct' : category,
    poolLabel: match ? null : DIAGNOSIS_POOL_LABEL[category]
  }
  answer.value = ''

  feedbackTimer = setTimeout(() => {
    feedback.value = null
    feedbackTimer = null
  }, 8000)
}

onBeforeUnmount(() => {
  clearFeedback()
  if (import.meta.client) {
    window.speechSynthesis.cancel()
  }
})
</script>
