<template>
  <div class="relative mx-auto max-w-lg px-3 pb-20 sm:max-w-xl sm:px-4">
    <div
      class="pointer-events-none absolute -top-4 left-1/2 h-40 w-[min(100vw,28rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.12),transparent_60%)]"
      aria-hidden="true"
    />

    <header class="relative z-10 mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400/80">Review</p>
        <h1 class="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">专项复习</h1>
        <NuxtLink
          to="/dictation"
          class="mt-1.5 inline-flex text-[11px] font-medium text-violet-400/95 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300"
        >
          去听写 →
        </NuxtLink>
      </div>
    </header>

    <div
      class="relative z-10 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-1.5 ring-1 ring-inset ring-white/[0.04] sm:p-2"
      role="tablist"
      aria-label="复习类型"
    >
      <div class="isolate flex flex-col gap-1.5 sm:flex-row sm:gap-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :class="tabButtonClass(tab.key)"
          @click.stop.prevent="selectTab(tab.key)"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-zinc-950/40 text-zinc-400 transition group-hover:border-zinc-600/50 group-hover:text-zinc-200"
            :class="tabIconActiveClass(tab.key)"
            aria-hidden="true"
          >
            <svg
              v-if="tab.key === 'sound'"
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a9 9 0 010 14.14"
              />
            </svg>
            <svg
              v-else-if="tab.key === 'spelling'"
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-4.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </span>
          <span class="min-w-0 flex-1 text-left">
            <span class="flex items-center gap-1.5">
              <span class="text-xs font-semibold">{{ tab.label }}</span>
              <span v-if="tabCounts[tab.key] > 0" :class="tabBadgeClass(tab.key)">{{ tabCounts[tab.key] }}</span>
            </span>
            <span
              class="mt-0.5 block text-[10px] leading-tight"
              :class="activeTab === tab.key ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-500'"
            >
              {{
                tab.key === 'sound' ? '听音二选一' : tab.key === 'spelling' ? '盲打 ×3' : '释义 → 默写'
              }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="!filteredLogs.length" class="mt-8 rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/20 py-14 text-center">
      <p class="mx-auto max-w-xs text-xs leading-relaxed text-zinc-500">
        {{
          !dictationReviewLogs.length
            ? '暂无听写错题，请在听写页产生错词后再来。'
            : '该分类暂无题目，可切换上方模式。'
        }}
      </p>
    </div>

    <div v-else class="mt-6 space-y-4">
      <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3.5 py-3 ring-1 ring-inset ring-white/[0.03]">
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span :class="progressLabelClass">{{ tabProgressLabel }}</span>
          <span class="tabular-nums font-medium text-zinc-300">{{ cardIndex + 1 }} / {{ filteredLogs.length }}</span>
        </div>
        <div
          class="mt-2.5 h-2.5 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-black/25"
          role="progressbar"
          :aria-valuenow="cardIndex + 1"
          :aria-valuemax="filteredLogs.length"
          aria-label="复习进度"
        >
          <div
            class="h-full rounded-full transition-[width] duration-300 ease-out"
            :class="progressFillClass"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <div v-if="filteredLogs.length > 1" class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
          :disabled="cardIndex <= 0"
          @click="goPrevCard"
        >
          上一题
        </button>
        <button
          type="button"
          class="rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
          :disabled="cardIndex >= filteredLogs.length - 1"
          @click="goNextCard"
        >
          下一题
        </button>
      </div>

      <Transition name="review-card" mode="out-in">
        <div v-if="currentLog" :key="`${currentLog.id}-${reviewContentMode}`">
          <!-- 拼写强化 -->
          <article
            v-if="reviewContentMode === 'spelling'"
            class="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/92 to-zinc-950 p-4 ring-1 ring-inset ring-amber-500/10 sm:p-5"
            :class="{
              'ring-2 ring-emerald-500/40': isCelebrating(currentLog.id),
              'ring-2 ring-rose-500/35': spellStates[currentLog.id]?.showInputError
            }"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent"
              aria-hidden="true"
            />
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-400/85">拼写强化</p>
              <p v-if="recordedLabel(currentLog)" class="text-[10px] text-zinc-600">{{ recordedLabel(currentLog) }}</p>
            </div>
            <p
              class="mt-2 line-clamp-2 rounded-lg border border-amber-500/20 bg-amber-950/20 px-2.5 py-1.5 text-[10px] leading-snug text-amber-100/90"
              :title="reviewHint(currentLog.category)"
            >
              {{ diagnosisLine(currentLog.category) }}
            </p>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="rounded-xl border border-rose-500/25 bg-rose-950/20 p-2.5 ring-1 ring-inset ring-rose-500/10">
                <p class="text-[9px] font-semibold uppercase text-rose-300/80">错</p>
                <p class="mt-1 truncate font-mono text-base font-bold text-rose-100">{{ currentLog.wrongInput || '—' }}</p>
              </div>
              <div class="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-2.5 ring-1 ring-inset ring-emerald-500/10">
                <div class="flex items-center justify-between gap-1">
                  <p class="text-[9px] font-semibold uppercase text-emerald-300/80">对</p>
                  <button
                    type="button"
                    class="rounded-md p-0.5 text-emerald-400/90 hover:bg-emerald-950/50"
                    :aria-label="`朗读 ${currentLog.target.word}`"
                    @click="speakWord(currentLog.target.word)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                  </button>
                </div>
                <p class="mt-1 truncate font-mono text-base font-bold text-emerald-100">{{ currentLog.target.word }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-3 ring-1 ring-inset ring-white/[0.04]">
              <div class="flex items-center justify-between gap-2">
                <p class="text-[10px] font-semibold uppercase text-zinc-500">盲打 · 连对 3 次移出</p>
                <div class="flex gap-1" aria-label="进度">
                  <span
                    v-for="step in 3"
                    :key="step"
                    class="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold tabular-nums transition-all"
                    :class="
                      step <= (spellStates[currentLog.id]?.filled ?? 0)
                        ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-200'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-600'
                    "
                  >
                    {{ step <= (spellStates[currentLog.id]?.filled ?? 0) ? '✓' : step }}
                  </span>
                </div>
              </div>
              <form class="mt-3" @submit.prevent="onSpellSubmit(currentLog)">
                <div
                  class="rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-1 focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/20"
                >
                  <input
                    :ref="(el) => setSpellInputRef(currentLog.id, el)"
                    v-model="spellStates[currentLog.id].input"
                    type="text"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    placeholder="盲打正确拼写 · Enter"
                    :disabled="isCelebrating(currentLog.id)"
                    class="w-full rounded-lg border-0 bg-transparent px-3 py-2.5 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                    :class="spellStates[currentLog.id]?.showInputError ? 'text-rose-300' : ''"
                    @keyup.enter.exact.prevent="onSpellSubmit(currentLog)"
                  />
                </div>
              </form>
            </div>

            <Transition name="fade-up">
              <p v-if="isCelebrating(currentLog.id)" class="mt-3 text-center text-xs font-medium text-emerald-400">
                已掌握 · 移出错词池
              </p>
            </Transition>
          </article>

          <!-- 近音辨析 -->
          <article
            v-else-if="reviewContentMode === 'sound'"
            class="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/92 to-zinc-950 p-4 ring-1 ring-inset ring-violet-500/12 sm:p-5"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
              aria-hidden="true"
            />
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-violet-300/85">近音辨析</p>
              <p v-if="recordedLabel(currentLog)" class="text-[10px] text-zinc-600">{{ recordedLabel(currentLog) }}</p>
            </div>
            <p
              class="mt-2 line-clamp-2 rounded-lg border border-violet-500/20 bg-violet-950/20 px-2.5 py-1.5 text-[10px] text-violet-100/90"
              :title="reviewHint(currentLog.category)"
            >
              {{ diagnosisLine(currentLog.category) }}
            </p>

            <button
              type="button"
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/35 transition hover:from-violet-500 hover:to-violet-400"
              @click="speakWord(currentLog.target.word)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
              播放目标词
            </button>

            <p class="mt-3 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">二选一</p>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <div
                v-for="(opt, idx) in getSoundQuizOptions(currentLog)"
                :key="`${currentLog.id}-${idx}`"
                class="flex flex-col gap-2 rounded-xl border bg-zinc-950/55 p-3 ring-1 ring-inset transition-shadow"
                :class="opt.isTarget ? 'border-violet-500/35 ring-violet-500/10' : 'border-zinc-700/80 ring-white/[0.02]'"
              >
                <div class="text-center">
                  <p class="font-mono text-lg font-bold text-zinc-50 sm:text-xl">{{ opt.word }}</p>
                  <p v-if="curriculumTranslationHint(opt.word)" class="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">
                    {{ curriculumTranslationHint(opt.word) }}
                  </p>
                </div>
                <button
                  type="button"
                  class="w-full rounded-lg py-2.5 text-xs font-bold transition"
                  :class="
                    opt.isTarget
                      ? 'bg-violet-600 text-white hover:bg-violet-500'
                      : 'border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  "
                  :disabled="soundQuizStates[currentLog.id]?.solved"
                  @click="pickSoundQuizOption(currentLog, opt.isTarget)"
                >
                  选这个
                </button>
              </div>
            </div>

            <p v-if="soundQuizStates[currentLog.id]?.hint === 'wrong'" class="mt-2 text-center text-xs text-rose-400">
              再听一遍后重选
            </p>
            <p
              v-if="soundQuizStates[currentLog.id]?.solved"
              class="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-950/15 py-2 text-center text-xs font-medium text-emerald-400"
            >
              ✓ 选对 · 可默写巩固
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3">
              <div class="rounded-lg border border-rose-500/20 bg-rose-950/15 p-2">
                <p class="text-[9px] text-rose-300/80">你曾写</p>
                <p class="mt-0.5 truncate font-mono text-sm font-semibold text-rose-100">{{ currentLog.wrongInput || '—' }}</p>
              </div>
              <div class="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-2">
                <p class="text-[9px] text-emerald-300/80">目标</p>
                <p class="mt-0.5 truncate font-mono text-sm font-semibold text-emerald-100">{{ currentLog.target.word }}</p>
              </div>
            </div>

            <div
              class="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3"
              :class="{ 'pointer-events-none opacity-45': !soundQuizStates[currentLog.id]?.solved }"
            >
              <p class="text-[10px] font-medium text-zinc-500">默写巩固（选做）</p>
              <form class="mt-2 flex gap-2" @submit.prevent="onSelfCheckSubmit(currentLog)">
                <input
                  v-model="selfCheckStates[currentLog.id].input"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="拼写…"
                  :disabled="!soundQuizStates[currentLog.id]?.solved"
                  class="min-w-0 flex-1 rounded-lg border border-zinc-700/80 bg-zinc-950/80 px-2.5 py-2 font-mono text-sm text-zinc-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:cursor-not-allowed"
                  @input="onSelfCheckInput(currentLog.id)"
                  @keyup.enter.exact.prevent="onSelfCheckSubmit(currentLog)"
                />
                <button
                  type="submit"
                  :disabled="!soundQuizStates[currentLog.id]?.solved"
                  class="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
                >
                  检查
                </button>
              </form>
              <p v-if="selfCheckStates[currentLog.id]?.feedback === 'correct'" class="mt-1.5 text-xs text-emerald-400">✓</p>
              <p v-else-if="selfCheckStates[currentLog.id]?.feedback === 'wrong'" class="mt-1.5 text-xs text-rose-400">
                再对照目标词
              </p>
            </div>
          </article>

          <!-- 生词重学 -->
          <article
            v-else
            class="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/92 to-zinc-950 p-4 ring-1 ring-inset ring-sky-500/12 sm:p-5"
          >
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"
              aria-hidden="true"
            />
            <div class="flex items-center justify-between gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-sky-300/85">生词重学</p>
              <p v-if="recordedLabel(currentLog)" class="text-[10px] text-zinc-600">{{ recordedLabel(currentLog) }}</p>
            </div>
            <p
              class="mt-2 line-clamp-2 rounded-lg border border-sky-500/20 bg-sky-950/20 px-2.5 py-1.5 text-[10px] text-sky-100/90"
              :title="reviewHint(currentLog.category)"
            >
              {{ diagnosisLine(currentLog.category) }}
            </p>

            <div class="mt-3 rounded-xl border border-rose-500/20 bg-rose-950/15 px-2.5 py-2">
              <p class="text-[9px] font-semibold uppercase text-rose-300/80">曾写</p>
              <p class="mt-0.5 font-mono text-lg font-bold text-rose-100">{{ currentLog.wrongInput || '—' }}</p>
            </div>

            <div class="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3 ring-1 ring-inset ring-emerald-500/10">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">{{ currentLog.target.word }}</p>
                  <p class="mt-1 font-mono text-xs text-emerald-200/70">{{ currentLog.target.phonetic }}</p>
                  <p class="mt-2 text-sm leading-snug text-zinc-300">{{ currentLog.target.translation }}</p>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg border border-emerald-500/30 p-2 text-emerald-200 hover:bg-emerald-950/40"
                  @click="speakWord(currentLog.target.word)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                </button>
              </div>
              <p class="mt-2 line-clamp-3 rounded-lg bg-zinc-950/50 px-2 py-1.5 text-[11px] leading-relaxed text-zinc-500">
                {{ currentLog.target.example_sentence }}
              </p>
            </div>

            <div class="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/45 p-3">
              <p class="text-[10px] font-medium text-zinc-500">默写自测</p>
              <form class="mt-2 flex flex-col gap-2 sm:flex-row" @submit.prevent="onSelfCheckSubmit(currentLog)">
                <input
                  v-model="selfCheckStates[currentLog.id].input"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="输入单词 · Enter"
                  class="min-w-0 flex-1 rounded-lg border border-zinc-700/80 bg-zinc-950/80 px-3 py-2.5 font-mono text-sm text-zinc-100 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                  @input="onSelfCheckInput(currentLog.id)"
                  @keyup.enter.exact.prevent="onSelfCheckSubmit(currentLog)"
                />
                <button
                  type="submit"
                  class="rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-sky-500 hover:to-sky-400"
                >
                  检查
                </button>
              </form>
              <p v-if="selfCheckStates[currentLog.id]?.feedback === 'correct'" class="mt-2 text-xs text-emerald-400">✓</p>
              <p v-else-if="selfCheckStates[currentLog.id]?.feedback === 'wrong'" class="mt-2 text-xs text-rose-400">
                对照词条再试
              </p>
            </div>
          </article>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DIAGNOSIS_POOL_LABEL,
  DIAGNOSIS_SHORT_LABEL,
  type SpellingDiagnosisCategory
} from '~/utils/diagnosticEngine'
import {
  isDictationReviewEntry,
  type ErrorLogEntry,
  type ErrorReviewCategory
} from '~/composables/useWordStore'

type TabKey = 'sound' | 'spelling' | 'unknown'

const tabs: { key: TabKey; label: string; categories: ErrorReviewCategory[] }[] = [
  { key: 'sound', label: '近音辨析', categories: ['sound_alike'] },
  { key: 'spelling', label: '拼写强化', categories: ['typo', 'morphological'] },
  { key: 'unknown', label: '生词重学', categories: ['completely_unknown'] }
]

const REVIEW_HINTS: Record<ErrorReviewCategory, string> = {
  sound_alike:
    '读音编码与目标词相同或极近，但字母拼写不同。请用中文释义与音标锁定「该写哪一个词」。',
  typo: '与正确词拼写相近，容易看错、抄错字母。请逐项对照右侧正确拼写。',
  morphological: '与目标属同一词族（如时态、单复数、派生）。请留意词形变化规则再默写。',
  completely_unknown: '与正确词差距较大，更像未掌握的生词。请连释义、例句一起记，再默写整词。'
}

const { errorLogs, removeErrorLog, words } = useWordStore()

type SoundQuizState = {
  options: { word: string; isTarget: boolean }[]
  solved: boolean
  hint: 'wrong' | null
}

const soundQuizStates = reactive<Record<string, SoundQuizState>>({})

function shuffleSoundOptions(target: string, wrongRaw: string) {
  const u = wrongRaw.trim() || '（空）'
  const opts = [
    { word: target, isTarget: true as const },
    { word: u, isTarget: false as const }
  ]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j]!, opts[i]!]
  }
  return opts
}

function ensureSoundQuizState(log: ErrorLogEntry) {
  if (log.category !== 'sound_alike') return
  if (!soundQuizStates[log.id]) {
    soundQuizStates[log.id] = {
      options: shuffleSoundOptions(log.target.word, log.wrongInput ?? ''),
      solved: false,
      hint: null
    }
  }
}

function getSoundQuizOptions(log: ErrorLogEntry) {
  ensureSoundQuizState(log)
  return soundQuizStates[log.id]?.options ?? []
}

function pickSoundQuizOption(log: ErrorLogEntry, isTarget: boolean) {
  ensureSoundQuizState(log)
  const st = soundQuizStates[log.id]!
  if (st.solved) return
  if (isTarget) {
    st.solved = true
    st.hint = null
  } else {
    st.hint = 'wrong'
  }
}

function curriculumTranslationHint(word: string): string | undefined {
  const key = word.trim().toLowerCase()
  if (!key || key === '（空）') return undefined
  return words.value.find((w) => w.word.toLowerCase() === key)?.translation
}

const dictationReviewLogs = computed(() => errorLogs.value.filter(isDictationReviewEntry))

function diagnosisLine(category: ErrorReviewCategory): string {
  const short = DIAGNOSIS_SHORT_LABEL[category]
  const pool = DIAGNOSIS_POOL_LABEL[category as SpellingDiagnosisCategory]
  return `${short}（${pool}）`
}

function reviewHint(category: ErrorReviewCategory): string {
  return REVIEW_HINTS[category]
}

function recordedLabel(log: ErrorLogEntry): string {
  if (!log.recordedAt) return log.source === 'dictation' ? '' : '历史记录'
  try {
    const d = new Date(log.recordedAt)
    if (Number.isNaN(d.getTime())) return ''
    return `听写记录 · ${d.toLocaleString()}`
  } catch {
    return ''
  }
}

function speakWord(word: string) {
  if (!import.meta.client) return
  const w = word.trim()
  if (!w) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(w)
  u.lang = 'en-US'
  u.rate = 0.92
  window.speechSynthesis.speak(u)
}

const activeTab = ref<TabKey>('sound')
const cardIndex = ref(0)

function tabKeyForCategory(c: ErrorReviewCategory): TabKey {
  if (c === 'sound_alike') return 'sound'
  if (c === 'typo' || c === 'morphological') return 'spelling'
  return 'unknown'
}

function selectTab(key: TabKey) {
  activeTab.value = key
  cardIndex.value = 0
}

function tabCategories(tab: TabKey): ErrorReviewCategory[] {
  return tabs.find((t) => t.key === tab)!.categories
}

const tabCounts = computed(() => {
  const counts = { sound: 0, spelling: 0, unknown: 0 } as Record<TabKey, number>
  for (const log of dictationReviewLogs.value) {
    if (log.category === 'sound_alike') counts.sound++
    else if (log.category === 'typo' || log.category === 'morphological') counts.spelling++
    else if (log.category === 'completely_unknown') counts.unknown++
  }
  return counts
})

const filteredLogs = computed(() => {
  const allow = new Set(tabCategories(activeTab.value))
  return dictationReviewLogs.value.filter((e) => allow.has(e.category))
})

const currentLog = computed(() => {
  const list = filteredLogs.value
  if (!list.length) return null
  return list[cardIndex.value] ?? null
})

/** 与当前题目数据一致的模式（用于进度条与卡片，避免 Tab 状态与内容脱节） */
const reviewContentMode = computed<TabKey>(() => {
  const log = currentLog.value
  if (log) return tabKeyForCategory(log.category)
  return activeTab.value
})

const progressPercent = computed(() => {
  const n = filteredLogs.value.length
  if (n <= 0) return 0
  return Math.round(((cardIndex.value + 1) / n) * 100)
})

const tabProgressLabel = computed(() => {
  const m: Record<TabKey, string> = {
    sound: '近音 · 本题',
    spelling: '拼写 · 本题',
    unknown: '生词 · 本题'
  }
  return m[reviewContentMode.value]
})

const progressLabelClass = computed(() => {
  const m: Record<TabKey, string> = {
    sound: 'text-violet-300/90',
    spelling: 'text-amber-300/90',
    unknown: 'text-sky-300/90'
  }
  return `font-medium ${m[reviewContentMode.value]}`
})

const progressFillClass = computed(() => {
  const m: Record<TabKey, string> = {
    sound: 'bg-gradient-to-r from-violet-600 to-violet-400',
    spelling: 'bg-gradient-to-r from-amber-600 to-amber-400',
    unknown: 'bg-gradient-to-r from-sky-600 to-sky-400'
  }
  return m[reviewContentMode.value]
})

function goPrevCard() {
  if (cardIndex.value > 0) cardIndex.value--
}

function goNextCard() {
  if (cardIndex.value < filteredLogs.value.length - 1) cardIndex.value++
}

watch(
  filteredLogs,
  (list) => {
    if (!list.length) {
      cardIndex.value = 0
      return
    }
    if (cardIndex.value >= list.length) {
      cardIndex.value = list.length - 1
    }
  },
  { immediate: true }
)

function tabButtonClass(key: TabKey) {
  const active = activeTab.value === key
  const base =
    'group relative flex flex-1 flex-row items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200 sm:py-2'
  if (!active) {
    return `${base} border-zinc-800/90 bg-zinc-900/20 text-zinc-500 hover:border-zinc-700/90 hover:bg-zinc-900/50 hover:text-zinc-300`
  }
  const accents: Record<TabKey, string> = {
    sound:
      'border-violet-500/45 bg-gradient-to-b from-violet-950/45 to-zinc-950 text-zinc-50 ring-1 ring-violet-500/25',
    spelling: 'border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-zinc-950 text-zinc-50 ring-1 ring-amber-500/20',
    unknown: 'border-sky-500/40 bg-gradient-to-b from-sky-950/30 to-zinc-950 text-zinc-50 ring-1 ring-sky-500/20'
  }
  return `${base} ${accents[key]}`
}

function tabIconActiveClass(key: TabKey) {
  const active = activeTab.value === key
  if (!active) return ''
  if (key === 'sound') return 'border-violet-500/30 bg-violet-950/40 text-violet-200'
  if (key === 'spelling') return 'border-amber-500/30 bg-amber-950/35 text-amber-200'
  return 'border-sky-500/30 bg-sky-950/35 text-sky-200'
}

function tabBadgeClass(key: TabKey) {
  const active = activeTab.value === key
  const map: Record<TabKey, { on: string; off: string }> = {
    sound: {
      on: 'bg-violet-600 text-white',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    },
    spelling: {
      on: 'bg-amber-600 text-white',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    },
    unknown: {
      on: 'bg-sky-600 text-white',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    }
  }
  const s = map[key]
  const state = active ? s.on : s.off
  return `inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${state}`
}

const spellInputRefs = new Map<string, HTMLInputElement>()
const spellStates = reactive(
  {} as Record<
    string,
    {
      input: string
      filled: number
      showInputError: boolean
      celebrating: boolean
    }
  >
)

const selfCheckStates = reactive(
  {} as Record<
    string,
    {
      input: string
      feedback: 'idle' | 'correct' | 'wrong'
    }
  >
)

function ensureSpellState(id: string) {
  if (!spellStates[id]) {
    spellStates[id] = {
      input: '',
      filled: 0,
      showInputError: false,
      celebrating: false
    }
  }
}

function ensureSelfCheckState(id: string) {
  if (!selfCheckStates[id]) {
    selfCheckStates[id] = {
      input: '',
      feedback: 'idle'
    }
  }
}

function setSpellInputRef(id: string, el: unknown) {
  if (el && el instanceof HTMLInputElement) spellInputRefs.set(id, el)
  else spellInputRefs.delete(id)
}

function isCelebrating(id: string) {
  return !!spellStates[id]?.celebrating
}

const lastSpellSubmitAt = new Map<string, number>()

function onSpellSubmit(log: ErrorLogEntry) {
  const now = performance.now()
  const prev = lastSpellSubmitAt.get(log.id) ?? 0
  if (now - prev < 140) return
  lastSpellSubmitAt.set(log.id, now)

  ensureSpellState(log.id)
  const st = spellStates[log.id]
  if (st.celebrating) return

  const el = spellInputRefs.get(log.id)
  const fromDom = el?.value?.trim() ?? ''
  const fromState = st.input.trim()
  const attempt = fromDom || fromState
  if (el && fromDom !== st.input) st.input = el.value
  if (!attempt) return

  const ok = attempt.toLowerCase() === log.target.word.trim().toLowerCase()
  if (!ok) {
    st.showInputError = true
    window.setTimeout(() => {
      st.showInputError = false
    }, 450)
    return
  }

  st.filled += 1
  st.input = ''
  if (el) el.value = ''

  if (st.filled >= 3) {
    st.celebrating = true
    window.setTimeout(() => {
      removeErrorLog(log.id)
      delete spellStates[log.id]
      spellInputRefs.delete(log.id)
    }, 850)
  }
}

const lastSelfCheckAt = new Map<string, number>()

function onSelfCheckInput(id: string) {
  ensureSelfCheckState(id)
  selfCheckStates[id].feedback = 'idle'
}

function onSelfCheckSubmit(log: ErrorLogEntry) {
  const now = performance.now()
  const prev = lastSelfCheckAt.get(log.id) ?? 0
  if (now - prev < 120) return
  lastSelfCheckAt.set(log.id, now)

  ensureSelfCheckState(log.id)
  const st = selfCheckStates[log.id]
  const attempt = st.input.trim()
  if (!attempt) {
    st.feedback = 'idle'
    return
  }
  const ok = attempt.toLowerCase() === log.target.word.trim().toLowerCase()
  st.feedback = ok ? 'correct' : 'wrong'
}

watch(
  dictationReviewLogs,
  (logs) => {
    const ids = new Set(logs.map((l) => l.id))
    for (const id of Object.keys(soundQuizStates)) {
      if (!ids.has(id)) delete soundQuizStates[id]
    }
    for (const log of logs) {
      if (log.category === 'typo' || log.category === 'morphological') {
        ensureSpellState(log.id)
      }
      if (log.category === 'sound_alike' || log.category === 'completely_unknown') {
        ensureSelfCheckState(log.id)
      }
      if (log.category === 'sound_alike') {
        ensureSoundQuizState(log)
      }
    }
  },
  { deep: true, immediate: true }
)

watch(
  currentLog,
  (log) => {
    if (!log) return
    if (log.category === 'typo' || log.category === 'morphological') ensureSpellState(log.id)
    if (log.category === 'sound_alike' || log.category === 'completely_unknown') ensureSelfCheckState(log.id)
    if (log.category === 'sound_alike') ensureSoundQuizState(log)
  },
  { immediate: true }
)

watch([currentLog, activeTab], () => {
  if (reviewContentMode.value !== 'spelling') return
  const log = currentLog.value
  if (!log) return
  nextTick(() => {
    spellInputRefs.get(log.id)?.focus()
  })
})
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.review-card-enter-active,
.review-card-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.review-card-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.review-card-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
