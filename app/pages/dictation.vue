<template>
  <div
    class="relative mx-auto flex min-h-[calc(100dvh-5rem)] max-w-2xl flex-col px-3 pb-12 pt-1 sm:max-w-3xl sm:px-4"
  >
    <div
      class="pointer-events-none absolute left-1/2 top-0 h-[min(14rem,38vh)] w-[min(100vw,52rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.12),transparent_62%)]"
      aria-hidden="true"
    />

    <header class="relative z-10 mb-3 flex shrink-0 items-baseline justify-between gap-3">
      <h1 class="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">听写</h1>
      <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400/80">Dictation</span>
    </header>

    <section
      class="relative flex min-h-[min(52dvh,30rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-800/85 bg-gradient-to-b from-zinc-900/96 via-zinc-950 to-zinc-950 shadow-[0_28px_72px_-28px_rgba(0,0,0,0.82)] ring-1 ring-inset ring-white/[0.06]"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-16 h-44 w-44 rounded-full bg-violet-600/[0.11] blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-600/[0.06] blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/22 to-transparent"
        aria-hidden="true"
      />

      <div
        v-if="words.length && !roundComplete"
        class="relative z-10 border-b border-zinc-800/90 bg-zinc-950/55 px-4 py-3.5 sm:px-5"
      >
        <div class="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div>
            <div
              class="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400"
            >
              <span>已掌握</span>
              <span class="tabular-nums text-zinc-200">{{ masteredCount }} / {{ roundUniqueTargetCount }}</span>
            </div>
            <div
              class="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-inset ring-black/20"
              role="progressbar"
              :aria-valuenow="masteredCount"
              :aria-valuemax="roundUniqueTargetCount || 1"
              aria-label="本轮已掌握进度"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-400 transition-[width] duration-500 ease-out"
                :style="{ width: `${masteredProgressPercent}%` }"
              />
            </div>
          </div>
          <div>
            <div
              class="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400"
            >
              <span>队列</span>
              <span class="tabular-nums text-zinc-200">{{ queueDisplayPos }} / {{ roundQueue.length }}</span>
            </div>
            <div
              class="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-inset ring-zinc-800/80"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-zinc-600 via-violet-500 to-violet-400 transition-[width] duration-300 ease-out"
                :style="{ width: `${queueProgressPercent}%` }"
              />
            </div>
          </div>
        </div>
        <div
          class="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 sm:justify-start sm:gap-4"
        >
          <span class="text-[11px] font-medium text-zinc-400">本轮题量</span>
          <div class="flex items-center gap-2">
            <input
              id="round-word-count"
              v-model.number="roundWordCountSetting"
              type="number"
              min="1"
              max="200"
              step="1"
              title="1–200，失焦后按新题量重排队列"
              class="w-[3.25rem] rounded-lg border border-zinc-600/90 bg-zinc-950/90 py-1.5 text-center font-mono text-sm font-medium tabular-nums text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              @change="onRoundWordCountChange"
            />
            <span class="text-[11px] text-zinc-600">题</span>
          </div>
        </div>
      </div>

      <div v-if="roundComplete" class="relative z-10 flex flex-1 flex-col justify-center space-y-5 px-5 py-10 text-center sm:py-12">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25"
          aria-hidden="true"
        >
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">本轮完成</p>
          <div
            class="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="本轮进度"
          >
            <div class="h-full w-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400" />
          </div>
        </div>
        <p
          v-if="distinctWrongWordsThisRound > 0"
          class="mx-auto max-w-sm text-xs text-amber-200/90"
        >
          <span class="tabular-nums font-semibold text-amber-100">{{ distinctWrongWordsThisRound }}</span>
          词已入
          <NuxtLink
            to="/review"
            class="font-medium text-violet-300 underline decoration-violet-400/40 underline-offset-2 hover:text-violet-200"
          >
            复习
          </NuxtLink>
        </p>
        <div class="mx-auto flex flex-wrap items-center justify-center gap-3">
          <label for="round-word-count-done" class="sr-only">下一轮题量</label>
          <input
            id="round-word-count-done"
            v-model.number="roundWordCountSetting"
            type="number"
            min="1"
            max="200"
            step="1"
            title="下一轮题量 1–200"
            class="w-16 rounded-lg border border-zinc-600/90 bg-zinc-950/90 px-2 py-2 text-center font-mono text-sm text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            @change="onRoundWordCountChange"
          />
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            @click="restartRound"
          >
            再来一轮
          </button>
        </div>
      </div>

      <div
        v-else-if="!words.length"
        class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      >
        <p class="text-sm text-zinc-500">暂无词表，无法开始听写。</p>
      </div>

      <div v-else class="relative z-10 flex flex-1 flex-col justify-start px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
        <div class="mx-auto flex w-full max-w-lg flex-col items-stretch gap-4 sm:max-w-xl sm:gap-5">
          <button
            type="button"
            class="group relative mx-auto flex h-[6.25rem] w-[6.25rem] shrink-0 flex-col items-center justify-center rounded-full border-2 border-zinc-600/70 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 text-zinc-100 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.65)] transition-all hover:border-violet-400/55 hover:from-zinc-800 hover:to-zinc-900 hover:shadow-[0_16px_48px_-8px_rgba(91,33,182,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-zinc-600/70 disabled:hover:shadow-none sm:h-[6.75rem] sm:w-[6.75rem]"
            :class="[
              isSpeaking &&
                'border-violet-400/80 bg-gradient-to-b from-violet-950/60 to-violet-950/90 shadow-[0_12px_40px_-6px_rgba(109,40,217,0.35)] ring-4 ring-violet-500/25'
            ]"
            title="浏览器语音合成，需系统英文语音包"
            aria-label="播放发音"
            :disabled="!currentWord"
            :aria-busy="isSpeaking"
            @click="speakCurrentWord"
          >
            <span
              class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950/40 transition-transform group-hover:scale-105 group-disabled:scale-100 sm:h-[3.25rem] sm:w-[3.25rem]"
              :class="isSpeaking && 'bg-violet-600/20'"
              aria-hidden="true"
            >
              <svg
                class="ml-0.5 h-7 w-7 text-violet-200 transition-colors group-hover:text-violet-100 sm:h-8 sm:w-8"
                :class="{ 'animate-pulse text-violet-100': isSpeaking }"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
            <!--
            <span
              class="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition-colors group-hover:text-zinc-200"
            >
              播放
            </span>
            -->
          </button>

          <div class="w-full max-w-lg self-center sm:max-w-xl">
            <label for="dictation-input" class="sr-only">听写输入</label>
            <div
              class="rounded-2xl border border-zinc-700/80 bg-zinc-950/50 p-1.5 shadow-inner shadow-black/50 ring-1 ring-inset ring-white/[0.04] transition-[box-shadow,border-color] focus-within:border-violet-500/45 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_8px_32px_-8px_rgba(91,33,182,0.2)]"
            >
              <input
                id="dictation-input"
                ref="inputRef"
                v-model="answer"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                enterkeyhint="done"
                placeholder="输入单词"
                :readonly="inputReadonlyForFeedback"
                :class="inputReadonlyForFeedback && 'cursor-default opacity-90'"
                class="w-full rounded-[0.875rem] border-0 bg-transparent px-4 py-3.5 text-center text-2xl font-medium tracking-wide text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:ring-0 sm:py-4 sm:text-3xl"
                @keydown.enter.prevent="onEnterKey"
              />
            </div>

            <div v-if="wrongRevealActive" class="mt-2.5 space-y-1">
              <div class="flex justify-between text-[11px] text-zinc-500">
                <span>答案揭示</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-zinc-800/90">
                <div
                  :key="wrongRevealAnimKey"
                  class="dictation-countdown-bar h-full rounded-full bg-red-400/90"
                  :style="{ animationDuration: `${WRONG_REVEAL_MS}ms` }"
                />
              </div>
            </div>
            <div v-else-if="feedback?.match && !correctManualUnlocked" class="mt-2.5 space-y-1">
              <div class="flex justify-between text-[11px] text-zinc-500">
                <span>阅读词条</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-zinc-800/90">
                <div
                  :key="correctReadAnimKey"
                  class="dictation-countdown-bar h-full rounded-full bg-emerald-400/90"
                  :style="{ animationDuration: `${CORRECT_MIN_DISPLAY_MS}ms` }"
                />
              </div>
            </div>

            <p class="mt-2 text-center text-[11px] leading-relaxed text-zinc-500">
              <template v-if="feedback && !feedback.match && wrongRevealActive">随后进入盲听</template>
              <template v-else-if="feedback && !feedback.match">
                盲听 · 点播放重听 ·
                <kbd
                  class="rounded border border-zinc-700/90 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                  >Enter</kbd
                >
                提交
              </template>
              <template v-else-if="feedback?.match && !correctManualUnlocked">阅读完成后可下一题</template>
              <template v-else-if="feedback?.match">
                <kbd
                  class="rounded border border-zinc-700/90 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                  >Enter</kbd
                >
                或 × 下一题
              </template>
              <template v-else>
                <kbd
                  class="rounded border border-zinc-700/90 bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                  >Enter</kbd
                >
                提交
              </template>
            </p>
          </div>

          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-[0.99]"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="feedback" class="w-full space-y-2">
              <!-- 答错 · 阶段一：完整正确答案（短时展示） -->
              <div
                v-if="!feedback.match && wrongRevealActive"
                role="status"
                class="rounded-2xl border border-violet-500/25 border-l-[3px] border-l-violet-500/70 bg-gradient-to-br from-zinc-900/90 via-red-950/25 to-zinc-950 px-4 py-3.5 text-zinc-100 shadow-lg shadow-black/30 ring-1 ring-inset ring-white/[0.04] sm:px-5 sm:py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <p
                      v-if="feedback.category && feedback.category !== 'correct'"
                      class="rounded-lg border border-violet-500/25 bg-violet-950/35 px-3 py-2 text-[11px] leading-snug text-violet-100/95 ring-1 ring-violet-500/10"
                    >
                      {{ wrongToastText }}
                    </p>
                    <div
                      class="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 sm:items-start"
                    >
                      <div>
                        <p class="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
                          词条
                        </p>
                        <p
                          class="break-words font-mono text-lg font-semibold tracking-tight text-red-200/95 sm:text-xl"
                        >
                          {{ feedback.entry.word }}
                        </p>
                      </div>
                      <div>
                        <p class="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
                          音标
                        </p>
                        <p class="text-sm leading-snug text-red-100/90 sm:text-base">
                          {{ feedback.entry.phonetic }}
                        </p>
                      </div>
                      <p class="leading-snug text-red-100/85 sm:col-span-2">
                        <span class="mr-1.5 font-medium text-zinc-400">释义</span>
                        {{ feedback.entry.translation }}
                      </p>
                      <p class="text-xs leading-snug text-red-200/80 sm:col-span-2">
                        <span class="mr-1.5 font-medium text-zinc-500">例句</span>
                        {{ feedback.entry.example_sentence }}
                      </p>
                    </div>
                    <div
                      class="flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-2.5 py-2"
                    >
                      <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                        >上次输入</span
                      >
                      <span class="min-w-0 break-all font-mono text-sm text-zinc-100">{{ feedback.input }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/60 text-lg leading-none text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
                    aria-label="跳过本题并进入下一题"
                    @click="dismissFeedback"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>

              <!-- 答错 · 阶段二：盲听写（仅诊断 + 本次输入） -->
              <div
                v-else-if="!feedback.match"
                role="status"
                class="rounded-2xl border border-violet-500/25 border-l-[3px] border-l-violet-500/70 bg-gradient-to-br from-zinc-900/92 to-zinc-950 px-4 py-3.5 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/[0.04] sm:px-5 sm:py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <p
                      v-if="feedback.category && feedback.category !== 'correct'"
                      class="rounded-lg border border-violet-500/25 bg-violet-950/35 px-3 py-2 text-[11px] leading-snug text-violet-100/95 ring-1 ring-violet-500/10"
                    >
                      {{ wrongToastText }}
                    </p>
                    <div
                      class="flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-2.5 py-2"
                    >
                      <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                        >上次输入</span
                      >
                      <span class="min-w-0 break-all font-mono text-sm text-zinc-100">{{ feedback.input }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/60 text-lg leading-none text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
                    aria-label="跳过本题并进入下一题"
                    @click="dismissFeedback"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>

              <!-- 答对：完整词条信息 -->
              <div
                v-else
                role="status"
                class="rounded-2xl border border-emerald-500/35 border-l-4 border-l-emerald-400 bg-gradient-to-br from-emerald-950/45 to-zinc-950/30 px-4 py-4 text-emerald-50 shadow-xl shadow-emerald-950/15 ring-1 ring-inset ring-emerald-500/10 sm:px-5 sm:py-5"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1 space-y-3 text-sm">
                    <div
                      class="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 sm:items-start"
                    >
                      <div>
                        <p class="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
                          词条
                        </p>
                        <p
                          class="break-words font-mono text-xl font-semibold tracking-tight text-emerald-300 sm:text-2xl"
                        >
                          {{ feedback.entry.word }}
                        </p>
                      </div>
                      <div>
                        <p class="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
                          音标
                        </p>
                        <p class="text-sm leading-snug text-emerald-100/90 sm:text-base">
                          {{ feedback.entry.phonetic }}
                        </p>
                      </div>
                      <p class="leading-snug text-emerald-100/85 sm:col-span-2">
                        <span class="mr-1.5 font-medium text-zinc-400">释义</span>
                        {{ feedback.entry.translation }}
                      </p>
                      <p class="text-xs leading-snug text-emerald-200/80 sm:col-span-2">
                        <span class="mr-1.5 font-medium text-zinc-500">例句</span>
                        {{ feedback.entry.example_sentence }}
                      </p>
                    </div>
                    <div
                      class="flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-950/50 px-2.5 py-2"
                    >
                      <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                        >上次输入</span
                      >
                      <span class="min-w-0 break-all font-mono text-sm text-emerald-100/90">{{ feedback.input }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/50 text-lg leading-none text-zinc-400 transition hover:border-emerald-600/40 hover:bg-emerald-950/40 hover:text-emerald-100 disabled:pointer-events-none disabled:opacity-35"
                    :disabled="!correctManualUnlocked"
                    :aria-label="
                      correctManualUnlocked ? '立即进入下一题' : '请稍候，阅读词条后可进入下一题'
                    "
                    @click="dismissFeedback"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>
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

const {
  words,
  currentSession,
  upsertErrorLog,
  beginDictationSession,
  completeCurrentDictationSession,
  setCurrentDictationSessionWordCount,
  recordDictationSessionAnswer
} = useWordStore()

const ROUND_WORD_COUNT_STORAGE_KEY = 'dictation-round-word-count'

/** 用户设置的每轮题量（1–200），默认 5 */
const roundWordCountSetting = ref(5)

function clampRoundWordCount(n: number): number {
  if (!Number.isFinite(n)) return 5
  return Math.min(200, Math.max(1, Math.round(n)))
}

function loadRoundWordCountFromStorage() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(ROUND_WORD_COUNT_STORAGE_KEY)
    if (raw == null) return
    roundWordCountSetting.value = clampRoundWordCount(parseInt(raw, 10))
    persistRoundWordCount()
  } catch {
    /* ignore */
  }
}

function persistRoundWordCount() {
  if (!import.meta.client) return
  localStorage.setItem(
    ROUND_WORD_COUNT_STORAGE_KEY,
    String(clampRoundWordCount(roundWordCountSetting.value))
  )
}

function clampPersistRoundWordCount() {
  roundWordCountSetting.value = clampRoundWordCount(Number(roundWordCountSetting.value))
  persistRoundWordCount()
}

/**
 * 在本轮进行中按新题量重建 ideal 队列（循环下标），尽量保持当前未掌握词在计划中的位置；会丢弃队尾因答错临时追加的重试项。
 */
function applyRoundWordCountToActiveRound() {
  if (roundComplete.value) return
  const list = words.value
  const L = list.length
  if (L === 0) return

  const want = clampRoundWordCount(roundWordCountSetting.value)
  const idealIndices = Array.from({ length: want }, (_, i) => i % L)

  const newTargets = new Set<string>()
  for (const wi of idealIndices) {
    newTargets.add(normalizeWordKey(list[wi]!.word))
  }
  roundUniqueKeysThisRound.value = newTargets

  const mastered = roundMasteredKeys.value
  const slotKey = (wi: number) => normalizeWordKey(list[wi]!.word)

  const firstUnmasteredSlot = () =>
    idealIndices.findIndex((wi) => !mastered.has(slotKey(wi)))

  const q = roundQueue.value
  const pos = queuePos.value
  let curKey: string | null = null
  if (pos >= 0 && pos < q.length) {
    curKey = slotKey(q[pos]!)
  }

  let newPos = firstUnmasteredSlot()
  if (curKey && newTargets.has(curKey) && !mastered.has(curKey)) {
    const prefer = idealIndices.findIndex((wi, j) => {
      if (slotKey(wi) !== curKey) return false
      return idealIndices.slice(0, j).every((wii) => mastered.has(slotKey(wii)))
    })
    if (prefer >= 0) newPos = prefer
  }

  roundQueue.value = idealIndices
  queuePos.value = newPos < 0 ? 0 : newPos

  const at = currentWord.value
  const atKey = at ? normalizeWordKey(at.word) : null
  const fb = feedback.value
  if (fb) {
    const fbKey = normalizeWordKey(fb.target)
    if (!atKey || fbKey !== atKey) {
      clearCorrectTimers()
      clearWrongRevealTimer()
      wrongRevealActive.value = false
      feedback.value = null
    }
  }

  setCurrentDictationSessionWordCount(want)
  replenishQueueIfNeeded()

  if (isRoundFullyMastered()) {
    clearCorrectTimers()
    clearWrongRevealTimer()
    wrongRevealActive.value = false
    feedback.value = null
    roundComplete.value = true
    completeCurrentDictationSession()
  }
}

function onRoundWordCountChange() {
  clampPersistRoundWordCount()
  applyRoundWordCountToActiveRound()
}

const answer = ref('')
const isSpeaking = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const roundComplete = ref(false)

/** 本轮练习队列：存词表下标；答错会把当前下标追加到队尾，答对前移直至所有词各掌握一次 */
const roundQueue = ref<number[]>([])
const queuePos = ref(0)
/** 本轮已至少拼对过一次的词（小写），用于判定轮次结束 */
const roundMasteredKeys = ref<Set<string>>(new Set())

/** 本轮队列里出现过的所有不重复词（小写）；题量可大于词表长度（循环），结束条件为全部掌握 */
const roundUniqueKeysThisRound = ref<Set<string>>(new Set())

/** 本轮听写中至少答错过一次的词（按词形归一化去重），用于结束页摘要 */
const wrongWordKeysThisRound = ref<Set<string>>(new Set())

const distinctWrongWordsThisRound = computed(() => wrongWordKeysThisRound.value.size)

const masteredCount = computed(() => {
  let c = 0
  for (const k of roundUniqueKeysThisRound.value) {
    if (roundMasteredKeys.value.has(k)) c++
  }
  return c
})

const roundUniqueTargetCount = computed(() => roundUniqueKeysThisRound.value.size)

const masteredProgressPercent = computed(() => {
  const t = roundUniqueTargetCount.value
  if (t <= 0) return 0
  return Math.min(100, Math.round((masteredCount.value / t) * 100))
})

const queueProgressPercent = computed(() => {
  const len = roundQueue.value.length
  if (len <= 0) return 0
  return Math.min(100, Math.round((queueDisplayPos.value / len) * 100))
})

const queueDisplayPos = computed(() => {
  const len = roundQueue.value.length
  if (len === 0) return 0
  return Math.min(queuePos.value + 1, len)
})

function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase()
}

function resetRoundQueueState() {
  const list = words.value
  const L = list.length
  if (L === 0) {
    roundQueue.value = []
    roundUniqueKeysThisRound.value = new Set()
    queuePos.value = 0
    roundMasteredKeys.value = new Set()
    return
  }
  const want = clampRoundWordCount(roundWordCountSetting.value)
  const indices = Array.from({ length: want }, (_, i) => i % L)
  roundQueue.value = indices
  queuePos.value = 0
  roundMasteredKeys.value = new Set()
  roundUniqueKeysThisRound.value = new Set(
    indices.map((wi) => normalizeWordKey(list[wi]!.word))
  )
}

/**
 * 队指针已走到末尾但仍有词未掌握时，把未掌握词的下标依次接在队尾，保证轮次可完成。
 */
function replenishQueueIfNeeded() {
  const list = words.value
  const n = list.length
  if (n === 0) return
  let guard = 0
  while (queuePos.value >= roundQueue.value.length && !isRoundFullyMastered()) {
    const toAdd: number[] = []
    for (const k of roundUniqueKeysThisRound.value) {
      if (roundMasteredKeys.value.has(k)) continue
      const idx = list.findIndex((w) => normalizeWordKey(w.word) === k)
      if (idx >= 0) toAdd.push(idx)
    }
    if (toAdd.length === 0) break
    roundQueue.value = [...roundQueue.value, ...toAdd]
    guard++
    if (guard > 220) break
  }
}

function appendCurrentWordIndexToQueueTail() {
  const pos = queuePos.value
  const q = roundQueue.value
  if (pos < 0 || pos >= q.length) return
  const wi = q[pos]
  if (wi === undefined) return
  roundQueue.value = [...roundQueue.value, wi]
}

function markRoundMastered(word: string) {
  const k = normalizeWordKey(word)
  if (!k) return
  if (roundMasteredKeys.value.has(k)) return
  const next = new Set(roundMasteredKeys.value)
  next.add(k)
  roundMasteredKeys.value = next
}

function isRoundFullyMastered(): boolean {
  const targets = roundUniqueKeysThisRound.value
  if (targets.size === 0) return false
  for (const k of targets) {
    if (!roundMasteredKeys.value.has(k)) return false
  }
  return true
}

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

const wrongRevealAnimKey = ref(0)
const correctReadAnimKey = ref(0)

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
  const q = roundQueue.value
  const pos = queuePos.value
  if (pos < 0 || pos >= q.length) return null
  const wi = q[pos]!
  if (wi < 0 || wi >= list.length) return null
  return list[wi]!
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
  return `${label} · 已入${pool}`
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
  wrongRevealAnimKey.value++
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
  replenishQueueIfNeeded()
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
  const n = list.length
  if (!n) return

  queuePos.value += 1
  replenishQueueIfNeeded()

  if (isRoundFullyMastered()) {
    feedback.value = null
    roundComplete.value = true
    completeCurrentDictationSession()
    return
  }

  feedback.value = null
  nextTick(() => speakCurrentWord())
}

/**
 * 答错状态下点 ×：跳过本题（错题已在提交时插入队尾），仅前移队指针。
 * 若尚未掌握的词已不在队中，由 replenish 补全。
 */
function continueAfterWrong() {
  const list = words.value
  const n = list.length
  if (!n) return

  clearCorrectTimers()
  clearWrongRevealTimer()
  feedback.value = null

  queuePos.value += 1
  replenishQueueIfNeeded()

  if (isRoundFullyMastered()) {
    roundComplete.value = true
    completeCurrentDictationSession()
    return
  }

  nextTick(() => speakCurrentWord())
}

function submitAnswer() {
  replenishQueueIfNeeded()
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
    markRoundMastered(w.word)
    recordDictationSessionAnswer({ correct: true })
    // 不在此从复习池删词：听写中改对只表示本轮过关，错题仍应在 Review 专项巩固
    correctManualUnlocked.value = false
    correctReadAnimKey.value++
    correctManualUnlockTimer = setTimeout(() => {
      correctManualUnlockTimer = null
      correctManualUnlocked.value = true
    }, CORRECT_MIN_DISPLAY_MS)
    correctAdvanceTimer = setTimeout(() => {
      correctAdvanceTimer = null
      advanceAfterCorrect()
    }, CORRECT_AUTO_ADVANCE_MS)
  } else {
    appendCurrentWordIndexToQueueTail()
    if (category !== 'correct') {
      markWrongWordThisRound(w.word)
      const errorLogId = upsertErrorLog({
        target: { ...w },
        wrongInput: raw,
        category: category as ErrorReviewCategory,
        source: 'dictation',
        recordedAt: new Date().toISOString()
      })
      recordDictationSessionAnswer({ correct: false, errorLogId })
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
  answer.value = ''
  wrongWordKeysThisRound.value = new Set()
  clampPersistRoundWordCount()
  resetRoundQueueState()
  nextTick(() => {
    inputRef.value?.focus()
    const len = roundQueue.value.length
    if (len > 0) beginDictationSession(len)
    replenishQueueIfNeeded()
  })
}

onMounted(() => {
  loadRoundWordCountFromStorage()
  if (import.meta.client) {
    window.addEventListener('keydown', onGlobalEnter)
  }
  nextTick(() => {
    clampPersistRoundWordCount()
    if (words.value.length === 0) return
    if (roundQueue.value.length === 0) resetRoundQueueState()
    if (!currentSession.value && roundQueue.value.length > 0) {
      beginDictationSession(roundQueue.value.length)
    }
    replenishQueueIfNeeded()
  })
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

<style>
@keyframes dictation-countdown-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
.dictation-countdown-bar {
  width: 100%;
  animation-name: dictation-countdown-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>
