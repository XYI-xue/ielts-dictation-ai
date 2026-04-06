<template>
  <div class="mx-auto max-w-3xl pb-16 px-1 sm:px-0">
    <header class="mb-8 space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-50">专项复习</h1>
      <p class="text-sm leading-relaxed text-zinc-500">
        先看清<strong class="font-medium text-zinc-400">上次错在哪、与正确词差在哪</strong>，再完成下方练习。听写里后来拼对仍会保留在此，直到拼写强化完成三次盲打对等巩固。
      </p>
      <p class="text-sm text-zinc-600">
        <NuxtLink
          to="/dictation"
          class="font-medium text-violet-400/90 underline decoration-violet-500/40 underline-offset-2 transition hover:text-violet-300"
        >
          去听写页练习
        </NuxtLink>
      </p>
    </header>

    <div
      class="mb-8 flex gap-1 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-1 ring-1 ring-inset ring-white/[0.04]"
      role="tablist"
      aria-label="复习类型"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        class="relative flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition"
        :class="
          activeTab === tab.key
            ? 'bg-zinc-800 text-zinc-50 shadow-sm shadow-black/40'
            : 'text-zinc-500 hover:text-zinc-300'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tabCounts[tab.key] > 0"
          class="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-zinc-700/80 px-1 text-[10px] font-semibold tabular-nums text-zinc-300"
        >
          {{ tabCounts[tab.key] }}
        </span>
      </button>
    </div>

    <div v-if="!filteredLogs.length" class="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
      <p class="text-sm text-zinc-500">
        {{
          !dictationReviewLogs.length
            ? '暂无听写错题。请在听写页提交错误拼写，系统会按诊断写入对应专项。'
            : '当前分类下暂无听写错题，可切换其他 Tab 查看。'
        }}
      </p>
    </div>

    <ul v-else class="space-y-6" role="list">
      <li v-for="log in filteredLogs" :key="log.id">
        <!-- 拼写强化 -->
        <article
          v-if="activeTab === 'spelling'"
          class="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/95 p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.05] transition-[box-shadow,transform] duration-300 sm:p-6"
          :class="{
            'ring-2 ring-emerald-500/50 shadow-emerald-950/20': isCelebrating(log.id),
            'ring-1 ring-rose-500/25': spellStates[log.id]?.showInputError
          }"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">拼写强化 · 回顾 → 盲打巩固</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/35 px-3 py-2.5 text-xs leading-snug text-amber-100/95"
          >
            <span class="font-semibold text-amber-200/95">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1 block text-amber-100/80">{{ reviewHint(log.category) }}</span>
          </p>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div
              class="rounded-xl border border-rose-500/25 bg-rose-950/20 p-4 ring-1 ring-inset ring-rose-500/10"
            >
              <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-rose-300/80">你的听写（错误）</p>
              <p class="mt-2 font-mono text-xl font-semibold tracking-tight text-rose-200 sm:text-2xl">
                {{ log.wrongInput || '（空）' }}
              </p>
            </div>
            <div
              class="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4 ring-1 ring-inset ring-emerald-500/10"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-300/85">应掌握（正确）</p>
                <button
                  type="button"
                  class="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-200"
                  :aria-label="`朗读 ${log.target.word}`"
                  @click="speakWord(log.target.word)"
                >
                  朗读
                </button>
              </div>
              <p class="mt-2 font-mono text-xl font-semibold tracking-tight text-emerald-200 sm:text-2xl">
                {{ log.target.word }}
              </p>
              <p class="mt-2 font-mono text-sm text-zinc-400">{{ log.target.phonetic }}</p>
              <p class="mt-1.5 text-sm leading-snug text-zinc-300">{{ log.target.translation }}</p>
            </div>
          </div>

          <p class="mt-4 border-t border-zinc-800/90 pt-4 text-xs font-medium text-zinc-400">
            练习：对照左侧错因与右侧正确信息，在下方<strong class="text-zinc-300">盲打</strong>正确单词；需连续对
            <span class="tabular-nums text-violet-300">3</span> 次方可移出错词池。
          </p>

          <form class="mt-3" @submit.prevent="onSpellSubmit(log)">
            <input
              :ref="(el) => setSpellInputRef(log.id, el)"
              v-model="spellStates[log.id].input"
              type="text"
              name="spell-blind"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="默写正确拼写，按 Enter 提交…"
              :disabled="isCelebrating(log.id)"
              class="w-full rounded-xl border bg-zinc-950/80 px-4 py-3 font-mono text-lg text-zinc-100 placeholder:text-zinc-700 outline-none ring-0 transition"
              :class="
                spellStates[log.id]?.showInputError
                  ? 'border-rose-500/50 focus:border-rose-400/70'
                  : 'border-zinc-800 focus:border-violet-500/40'
              "
              @keyup.enter.exact.prevent="onSpellSubmit(log)"
            />
          </form>

          <div class="mt-4 flex items-center justify-center gap-4" aria-label="三次正确进度">
            <span
              v-for="step in 3"
              :key="step"
              class="h-4 w-4 rounded-full border-2 transition-all duration-300"
              :class="
                step <= (spellStates[log.id]?.filled ?? 0)
                  ? 'scale-110 border-emerald-400 bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : 'border-zinc-500 bg-transparent'
              "
              :aria-label="`第 ${step} 次：${step <= (spellStates[log.id]?.filled ?? 0) ? '已完成' : '待完成'}`"
            />
          </div>

          <Transition name="fade-up">
            <p
              v-if="isCelebrating(log.id)"
              class="mt-4 text-center text-sm font-medium text-emerald-400/95"
            >
              已掌握 · 正在移出错词池
            </p>
          </Transition>
        </article>

        <!-- 近音辨析 -->
        <article
          v-else-if="activeTab === 'sound'"
          class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04] sm:p-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">近音辨析 · 对照 → 默写自测</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-3 rounded-lg border border-violet-500/25 bg-violet-950/30 px-3 py-2.5 text-xs leading-snug text-violet-100/95"
          >
            <span class="font-semibold text-violet-200/95">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1 block text-violet-100/85">{{ reviewHint(log.category) }}</span>
          </p>

          <div class="mt-5 border-t border-zinc-800/80 pt-5">
            <p class="text-xs font-medium text-zinc-400">
              步骤 1：点击播放<strong class="text-zinc-300">仅目标词</strong>的读音；结合释义判断后，点选
              <strong class="text-zinc-300">听写目标词</strong>或<strong class="text-zinc-300">你上次写的词</strong>（顺序随机，勿凭位置猜题）。
            </p>
            <button
              type="button"
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/35 py-3 text-sm font-medium text-violet-100 transition hover:border-violet-400/55 hover:bg-violet-900/40 sm:w-auto sm:px-8"
              :aria-label="`播放目标词 ${log.target.word}`"
              @click="speakWord(log.target.word)"
            >
              <span class="text-base" aria-hidden="true">▶</span>
              播放目标词读音
            </button>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div
              v-for="(opt, idx) in getSoundQuizOptions(log)"
              :key="`${log.id}-${idx}`"
              class="flex flex-col justify-between gap-4 rounded-xl border border-zinc-700/80 bg-zinc-950/55 p-5 ring-1 ring-inset ring-white/[0.03]"
            >
              <div class="space-y-2 text-center">
                <p class="font-mono text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                  {{ opt.word }}
                </p>
                <p
                  v-if="curriculumTranslationHint(opt.word)"
                  class="text-sm leading-snug text-zinc-400"
                >
                  {{ curriculumTranslationHint(opt.word) }}
                </p>
              </div>
              <button
                type="button"
                class="w-full rounded-lg py-3 text-sm font-semibold transition"
                :class="
                  opt.isTarget
                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                    : 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600'
                "
                :disabled="soundQuizStates[log.id]?.solved"
                @click="pickSoundQuizOption(log, opt.isTarget)"
              >
                我选这个
              </button>
            </div>
          </div>

          <p v-if="soundQuizStates[log.id]?.hint === 'wrong'" class="mt-3 text-sm font-medium text-rose-400/95">
            不对，可再听一遍目标词读音，或换另一个选项。
          </p>
          <p v-if="soundQuizStates[log.id]?.solved" class="mt-3 text-sm font-medium text-emerald-400/95">
            选对啦。下方可结合释义再默写巩固。
          </p>

          <div class="relative my-4 flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-800" aria-hidden="true" />
            <span class="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">对照参考</span>
            <div class="h-px flex-1 bg-zinc-800" aria-hidden="true" />
          </div>

          <div class="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div class="rounded-xl border border-rose-500/20 bg-zinc-950/50 p-4">
              <p class="text-xs font-medium text-rose-300/90">你写成了（易与目标混淆）</p>
              <p class="mt-2 font-mono text-xl font-semibold text-rose-200">{{ log.wrongInput || '（空）' }}</p>
            </div>
            <div class="rounded-xl border border-emerald-500/20 bg-zinc-950/50 p-4">
              <div class="flex items-start justify-between gap-2">
                <p class="text-xs font-medium text-emerald-300/90">听写目标（正确）</p>
                <button
                  type="button"
                  class="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-200"
                  @click="speakWord(log.target.word)"
                >
                  朗读
                </button>
              </div>
              <p class="mt-2 font-mono text-xl font-semibold text-emerald-200">{{ log.target.word }}</p>
              <p class="mt-2 text-xs text-zinc-500">{{ log.target.phonetic }}</p>
              <p class="mt-1 text-sm leading-snug text-zinc-400">{{ log.target.translation }}</p>
            </div>
          </div>

          <p class="mt-4 text-xs text-zinc-500">
            重点：二者<strong class="text-zinc-400">拼写不同</strong>，听感或语音编码可能相近；请用<strong
              class="text-zinc-400"
              >释义与音标</strong
            >
            锚定正确词形。
          </p>

          <div class="mt-5 border-t border-zinc-800/80 pt-4">
            <p class="text-xs font-medium text-zinc-400">
              步骤 2：自测默写目标词（不计入移出池，仅供巩固）
              <span v-if="!soundQuizStates[log.id]?.solved" class="block pt-1 text-zinc-600">
                请先完成上方「我选这个」二选一。
              </span>
            </p>
            <form
              class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
              :class="{ 'pointer-events-none opacity-45': !soundQuizStates[log.id]?.solved }"
              @submit.prevent="onSelfCheckSubmit(log)"
            >
              <input
                v-model="selfCheckStates[log.id].input"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="输入正确单词…"
                :disabled="!soundQuizStates[log.id]?.solved"
                class="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/45 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:cursor-not-allowed"
                @input="onSelfCheckInput(log.id)"
                @keyup.enter.exact.prevent="onSelfCheckSubmit(log)"
              />
              <button
                type="submit"
                :disabled="!soundQuizStates[log.id]?.solved"
                class="shrink-0 rounded-xl border border-violet-500/35 bg-violet-950/40 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-900/45 disabled:cursor-not-allowed disabled:opacity-50"
              >
                检查
              </button>
            </form>
            <p
              v-if="selfCheckStates[log.id]?.feedback === 'correct'"
              class="mt-2 text-sm font-medium text-emerald-400/95"
            >
              ✓ 拼写正确，可回到听写页再验一次听辨。
            </p>
            <p
              v-else-if="selfCheckStates[log.id]?.feedback === 'wrong'"
              class="mt-2 text-sm font-medium text-rose-400/95"
            >
              ✗ 再对照上方绿色卡片中的目标词与释义后重试。
            </p>
          </div>
        </article>

        <!-- 生词重学 -->
        <article
          v-else
          class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04] sm:p-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">生词重学 · 整词记忆 → 默写自测</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-3 rounded-lg border border-sky-500/25 bg-sky-950/25 px-3 py-2.5 text-xs leading-snug text-sky-100/95"
          >
            <span class="font-semibold text-sky-200/95">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1 block text-sky-100/85">{{ reviewHint(log.category) }}</span>
          </p>

          <div class="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/45 p-4">
            <p class="text-xs text-zinc-500">你曾写成</p>
            <p class="mt-1 font-mono text-lg font-semibold text-rose-300/90">{{ log.wrongInput || '（空）' }}</p>
          </div>

          <div class="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4 ring-1 ring-inset ring-emerald-500/10">
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-medium text-emerald-300/90">应掌握的词与义</p>
              <button
                type="button"
                class="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-200"
                @click="speakWord(log.target.word)"
              >
                朗读
              </button>
            </div>
            <p class="mt-2 font-mono text-2xl font-semibold text-zinc-100">{{ log.target.word }}</p>
            <p class="mt-1 text-sm text-zinc-500">{{ log.target.phonetic }}</p>
            <p class="mt-2 leading-snug text-zinc-300">{{ log.target.translation }}</p>
            <p class="mt-3 border-t border-zinc-800/80 pt-3 text-xs leading-relaxed text-zinc-500">
              <span class="font-medium text-zinc-600">例句</span>
              {{ log.target.example_sentence }}
            </p>
          </div>

          <div class="mt-5 border-t border-zinc-800/80 pt-4">
            <p class="text-xs font-medium text-zinc-400">自测：默写目标词（不计入移出池）</p>
            <form class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center" @submit.prevent="onSelfCheckSubmit(log)">
              <input
                v-model="selfCheckStates[log.id].input"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="输入正确单词…"
                class="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/45 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                @input="onSelfCheckInput(log.id)"
                @keyup.enter.exact.prevent="onSelfCheckSubmit(log)"
              />
              <button
                type="submit"
                class="shrink-0 rounded-xl border border-violet-500/35 bg-violet-950/40 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-900/45"
              >
                检查
              </button>
            </form>
            <p
              v-if="selfCheckStates[log.id]?.feedback === 'correct'"
              class="mt-2 text-sm font-medium text-emerald-400/95"
            >
              ✓ 拼写正确；建议隔一段时间在听写页再听一遍巩固。
            </p>
            <p
              v-else-if="selfCheckStates[log.id]?.feedback === 'wrong'"
              class="mt-2 text-sm font-medium text-rose-400/95"
            >
              ✗ 再对照上方词条、释义与例句后重试。
            </p>
          </div>
        </article>
      </li>
    </ul>
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
  {
    key: 'spelling',
    label: '拼写强化',
    categories: ['typo', 'morphological']
  },
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

/** 与听写结果对齐的复习条目（排除未来其它来源且带显式 source 的数据） */
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

/** 同一次按 Enter 可能连续触发 submit + keydown + keyup，只处理一次 */
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

watch(activeTab, (tab) => {
  if (tab !== 'spelling') return
  nextTick(() => {
    const first = filteredLogs.value[0]
    if (first) spellInputRefs.get(first.id)?.focus()
  })
})

watch(filteredLogs, (list) => {
  if (activeTab.value !== 'spelling') return
  nextTick(() => {
    const first = list[0]
    if (first) spellInputRefs.get(first.id)?.focus()
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
</style>
