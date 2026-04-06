<template>
  <div class="mx-auto max-w-7xl space-y-8 pb-24">
    <header class="space-y-2">
      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/80">
        AI 语境
      </p>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-50">专属作文生成</h1>
      <p class="text-sm leading-relaxed text-zinc-500">
        选择一次听写训练轮次，根据该轮错词调用 DeepSeek-V3.2（思考模式）生成约 250 词雅思 Task 2 范文，便于在语境中巩固词汇。
      </p>
    </header>

    <section
      class="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-5 ring-1 ring-inset ring-white/[0.04]"
    >
      <h2 class="text-sm font-semibold text-zinc-200">训练轮次</h2>
      <p class="mt-1 text-xs text-zinc-500">选中一轮后，将使用该轮记录的错词列表生成作文。</p>

      <ul
        v-if="selectableSessions.length"
        class="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1"
        role="list"
      >
        <li v-for="item in selectableSessions" :key="item.session.id">
          <button
            type="button"
            :class="sessionRowClass(item.session.id)"
            @click="selectedSessionId = item.session.id"
          >
            <span class="font-medium text-zinc-100">{{ item.label }}</span>
            <span class="mt-0.5 block text-xs text-zinc-500">
              {{ item.session.date }} · 错词 {{ item.wrongWords.length }} 个
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-zinc-500">暂无训练轮次。请先在听写页完成练习。</p>
    </section>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :disabled="generateDisabled"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        @click="generateEssay"
      >
        <span
          v-if="loading"
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          aria-hidden="true"
        />
        {{ loading ? '生成中…' : '生成专属作文' }}
      </button>
      <p v-if="selectedWrongWords.length === 0 && selectedSession" class="text-xs text-amber-500/90">
        该轮没有错词记录，无法生成。
      </p>
      <p v-if="errorMessage" class="text-xs text-red-400">{{ errorMessage }}</p>
    </div>

    <section
      v-if="generatedPayload"
      class="space-y-4 rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-5 ring-1 ring-inset ring-white/[0.04] lg:p-6"
    >
      <div class="flex flex-col gap-6">
        <!-- TypeRacer 打字区 -->
        <div class="min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-zinc-200">沉浸式打字</h2>
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-zinc-500">点击区域聚焦 · Tab 跳过当前字符 · Backspace/Delete 纠错</span>
              <button
                type="button"
                class="rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canSkipCurrent"
                @click="skipCurrentChar"
              >
                跳过当前字符
              </button>
            </div>
          </div>

          <div
            ref="typingHostRef"
            tabindex="0"
            role="textbox"
            :aria-label="'打字练习，共 ' + plainPracticeText.length + ' 个字符'"
            :class="typingAreaClass"
            @keydown="onTypingKeydown"
            @click="focusTypingArea"
          >
            <div class="typing-editor-inner font-mono text-[15px] leading-relaxed tracking-wide text-zinc-100">
              <template v-if="plainPracticeText.length === 0">
                <span class="text-zinc-500">无可练习文本</span>
              </template>
              <template v-else>
                <span class="whitespace-pre-wrap text-emerald-400/90">{{
                  plainPracticeText.slice(0, cursor)
                }}</span>
                <span
                  v-if="pendingWrongChar !== null"
                  class="inline-block min-w-[0.55em] rounded bg-red-600/85 px-0.5 text-center align-baseline font-semibold text-white ring-1 ring-red-400/60"
                  >{{ pendingWrongDisplay }}</span
                >
                <span
                  v-else-if="cursor < plainPracticeText.length"
                  class="current-char inline-block min-w-[0.45em] border-b-2 border-violet-400 bg-violet-500/15 align-baseline text-violet-100"
                  >{{ displayExpectedAtCursor }}</span
                >
                <span class="whitespace-pre-wrap text-zinc-500">{{ typingRemainderDim }}</span>
              </template>
            </div>
          </div>

          <p v-if="isTypingComplete" class="mt-3 text-sm font-medium text-emerald-400/90">
            已完成本篇，可重新生成或继续复习范文。
          </p>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-zinc-200">中文参考翻译</h3>
          <div
            class="md-inline-wrap rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-sm leading-relaxed text-zinc-400"
            v-html="chineseTranslationHtml"
          />
        </div>

        <div class="space-y-4">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 class="text-sm font-semibold text-zinc-100">✨ 考官划重点（好词好句）</h3>
              <p class="mt-0.5 text-[11px] text-zinc-500">
                四条精选表达 · 对照翻译与点评理解用法与得分点
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article
              v-for="(item, idx) in generatedPayload.good_expressions"
              :key="`${item.expression}-${idx}`"
              class="examiner-card group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 shadow-lg shadow-black/20 ring-1 ring-white/[0.04] transition duration-200 hover:border-zinc-700/90 hover:ring-violet-500/15"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-violet-500/[0.07] opacity-90"
                aria-hidden="true"
              />
              <div class="relative flex flex-col gap-3.5 p-4 sm:p-5">
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="inline-flex items-center rounded-full bg-zinc-950/80 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums tracking-wide text-zinc-400 ring-1 ring-zinc-700/80"
                  >
                    #{{ idx + 1 }}
                  </span>
                  <span
                    class="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-500/70 sm:inline"
                  >
                    Key phrase
                  </span>
                </div>

                <p
                  class="examiner-expression md-inline-wrap font-mono text-[15px] font-semibold leading-snug tracking-tight text-emerald-100/95"
                  v-html="expressionHtml(item.expression)"
                />

                <div
                  class="rounded-xl border border-zinc-800/90 bg-zinc-950/55 px-3.5 py-3 ring-1 ring-inset ring-white/[0.04]"
                >
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">译文</p>
                  <p
                    class="md-inline-wrap mt-1.5 text-sm leading-relaxed text-zinc-300"
                    v-html="translationHtml(item.translation)"
                  />
                </div>

                <div
                  class="examiner-tip flex gap-3 rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/55 via-zinc-950/70 to-zinc-950/90 p-3.5 ring-1 ring-inset ring-violet-500/10"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25"
                    aria-hidden="true"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 3v2m0 14v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M3 12h2m14 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                      <path
                        d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-violet-300/95">
                      考官点评
                    </p>
                    <div
                      class="examiner-tip-body md-inline-wrap mt-1.5 text-xs leading-relaxed text-zinc-400"
                      v-html="analysisHtml(item.analysis)"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- 范文参考 -->
        <!--
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-zinc-200">范文参考（错词高亮）</h2>
          <article
            class="essay-body mt-3 max-h-[min(40vh,22rem)] overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-sm leading-relaxed text-zinc-300"
            v-html="essayHtml"
          />
        </div>
        -->
      </div>
    </section>

    <!-- 统计悬浮窗 -->
    <div
      v-if="generatedPayload && plainPracticeText.length"
      class="fixed bottom-5 right-5 z-30 w-[11.5rem] rounded-xl border border-zinc-700/90 bg-zinc-900/95 p-3 shadow-xl shadow-black/40 ring-1 ring-white/[0.06] backdrop-blur-sm"
      aria-live="polite"
    >
      <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">实时统计</p>
      <dl class="mt-2 space-y-1.5 text-sm">
        <div class="flex justify-between gap-2 tabular-nums">
          <dt class="text-zinc-500">Time</dt>
          <dd class="font-medium text-zinc-100">{{ formattedElapsed }}</dd>
        </div>
        <div class="flex justify-between gap-2 tabular-nums">
          <dt class="text-zinc-500">WPM</dt>
          <dd class="font-medium text-violet-300">{{ liveWpm }}</dd>
        </div>
        <div class="flex justify-between gap-2 tabular-nums">
          <dt class="text-zinc-500">Accuracy</dt>
          <dd class="font-medium text-emerald-300/90">{{ liveAccuracy }}%</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DictationSession } from '~/types/dictationSession'

interface GoodExpression {
  expression: string
  translation: string
  analysis: string
}

interface GeneratedPayload {
  english_essay: string
  chinese_translation: string
  good_expressions: GoodExpression[]
}

const { historySessions, currentSession, errorLogs } = useWordStore()
const typingLiveStats = useTypingLiveStats()

const selectedSessionId = ref<string | null>(null)
const generatedPayload = ref<GeneratedPayload | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const typingHostRef = ref<HTMLElement | null>(null)

/** 去掉 Markdown 粗体标记后的纯文本，供打字对齐 */
const plainPracticeText = computed(() => {
  const essay = generatedPayload.value?.english_essay
  if (!essay) return ''
  return essay.replace(/\*\*/g, '')
})

/**
 * 按「单词块」拆分：每个 token 要么是一段空白，要么是「非空白片段 + 紧随其后的空白」。
 * 用 computed 维护，便于与光标位置联动调试或扩展。
 */
const typingTokens = computed(() => {
  const plain = plainPracticeText.value
  const tokens: { text: string; start: number; end: number }[] = []
  const re = /(\s+|\S+\s*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(plain)) !== null) {
    const text = m[0]
    const start = m.index
    tokens.push({ text, start, end: start + text.length })
  }
  return tokens
})

const cursor = ref(0)
/** 用户敲错且尚未 Backspace 时，保存其输入的一个字符（与 expected 比较用） */
const pendingWrongChar = ref<string | null>(null)
const correctKeystrokes = ref(0)
const wrongKeystrokes = ref(0)
const skippedKeystrokes = ref(0)
const sessionStartedAt = ref<number | null>(null)
/** 驱动 Time / WPM 刷新 */
const statsTick = ref(0)

let statsTimer: ReturnType<typeof setInterval> | null = null

function startStatsTimer() {
  if (statsTimer) return
  statsTimer = setInterval(() => {
    statsTick.value++
  }, 200)
}

function stopStatsTimer() {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
}

function resetTypingSession() {
  cursor.value = 0
  pendingWrongChar.value = null
  correctKeystrokes.value = 0
  wrongKeystrokes.value = 0
  skippedKeystrokes.value = 0
  sessionStartedAt.value = null
  statsTick.value = 0
  stopStatsTimer()
}

watch(generatedPayload, (raw) => {
  if (raw?.english_essay) {
    resetTypingSession()
    nextTick(() => focusTypingArea())
  } else {
    resetTypingSession()
  }
})

const isTypingComplete = computed(
  () =>
    plainPracticeText.value.length > 0 &&
    cursor.value >= plainPracticeText.value.length &&
    pendingWrongChar.value === null
)

const displayExpectedAtCursor = computed(() => {
  const t = plainPracticeText.value
  if (cursor.value >= t.length) return ''
  const ch = t[cursor.value]!
  if (ch === '\n') return '↵'
  if (ch === ' ') return '\u00A0'
  return ch
})

const pendingWrongDisplay = computed(() => {
  const w = pendingWrongChar.value
  if (w === null) return ''
  if (w === '\n') return '↵'
  if (w === ' ') return '\u00A0'
  return w
})

/** 灰色未输入部分：有错时从 cursor 起整段（含当前应敲字符）；无错时从下一字符起，避免与下划线重复 */
const typingRemainderDim = computed(() => {
  const t = plainPracticeText.value
  if (pendingWrongChar.value !== null) return t.slice(cursor.value)
  if (cursor.value >= t.length) return ''
  return t.slice(cursor.value + 1)
})

const typingAreaClass = computed(() => {
  const base =
    'typing-editor mt-3 min-h-[min(42vh,26rem)] cursor-text rounded-xl border bg-zinc-950/80 p-4 outline-none ring-0 transition focus-visible:border-violet-500/60 focus-visible:ring-2 focus-visible:ring-violet-500/30'
  const border = pendingWrongChar.value ? 'border-red-500/50' : 'border-zinc-700/90'
  return `${base} ${border}`
})

const formattedElapsed = computed(() => {
  statsTick.value
  if (!sessionStartedAt.value) return '0:00'
  const s = Math.floor((Date.now() - sessionStartedAt.value) / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
})

const liveWpm = computed(() => {
  statsTick.value
  if (!sessionStartedAt.value) return 0
  const mins = (Date.now() - sessionStartedAt.value) / 60000
  if (mins < 1 / 120) return 0
  return Math.round(correctKeystrokes.value / 5 / mins)
})

const liveAccuracy = computed(() => {
  const ok = correctKeystrokes.value
  const bad = wrongKeystrokes.value + skippedKeystrokes.value
  const tot = ok + bad
  if (tot === 0) return 100
  return Math.round((ok / tot) * 1000) / 10
})

function focusTypingArea() {
  typingHostRef.value?.focus()
}

const canSkipCurrent = computed(() => {
  const text = plainPracticeText.value
  return text.length > 0 && cursor.value < text.length
})

function skipCurrentChar() {
  const text = plainPracticeText.value
  if (!text.length || cursor.value >= text.length) return
  if (sessionStartedAt.value === null) {
    sessionStartedAt.value = Date.now()
    startStatsTimer()
  }
  pendingWrongChar.value = null
  skippedKeystrokes.value++
  cursor.value++
  if (cursor.value >= text.length) {
    stopStatsTimer()
  }
  focusTypingArea()
}

function keyEventToChar(e: KeyboardEvent): string | null {
  if (e.key === 'Enter') return '\n'
  if (e.key === 'Tab') return null
  if (e.key.length === 1) return e.key
  return null
}

function onTypingKeydown(e: KeyboardEvent) {
  const text = plainPracticeText.value
  if (!text.length) return

  if (e.ctrlKey || e.metaKey || e.altKey) {
    e.preventDefault()
    return
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    skipCurrentChar()
    return
  }

  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault()
    if (pendingWrongChar.value !== null) {
      pendingWrongChar.value = null
      return
    }
    if (e.key === 'Backspace' && cursor.value > 0) {
      cursor.value--
      if (correctKeystrokes.value > 0) correctKeystrokes.value--
    }
    return
  }

  const inputChar = keyEventToChar(e)
  if (inputChar === null) {
    e.preventDefault()
    return
  }

  if (cursor.value >= text.length && pendingWrongChar.value === null) {
    e.preventDefault()
    return
  }

  /** 错字锁定：允许直接敲「当前应有字符」纠正并前进，避免只能 Backspace 时体感像卡死 */
  if (pendingWrongChar.value !== null) {
    e.preventDefault()
    if (sessionStartedAt.value === null) {
      sessionStartedAt.value = Date.now()
      startStatsTimer()
    }
    const expected = text[cursor.value]!
    if (inputChar === expected) {
      pendingWrongChar.value = null
      cursor.value++
      correctKeystrokes.value++
      if (cursor.value >= text.length) {
        stopStatsTimer()
      }
      return
    }
    if (e.repeat) return
    pendingWrongChar.value = inputChar
    wrongKeystrokes.value++
    return
  }

  e.preventDefault()

  if (sessionStartedAt.value === null) {
    sessionStartedAt.value = Date.now()
    startStatsTimer()
  }

  const expected = text[cursor.value]!
  if (inputChar === expected) {
    cursor.value++
    correctKeystrokes.value++
    if (cursor.value >= text.length) {
      stopStatsTimer()
    }
  } else {
    if (e.repeat) return
    pendingWrongChar.value = inputChar
    wrongKeystrokes.value++
  }
}

const logById = computed(() => new Map(errorLogs.value.map((e) => [e.id, e])))

function sessionWrongWords(session: DictationSession): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of session.errorIds) {
    const log = logById.value.get(id)
    const w = log?.target.word?.trim()
    if (!w) continue
    const key = w.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(w)
  }
  return out
}

const selectableSessions = computed(() => {
  const rows: { session: DictationSession; label: string; wrongWords: string[] }[] = []
  if (currentSession.value) {
    const s = currentSession.value
    rows.push({
      session: s,
      label: '当前进行中',
      wrongWords: sessionWrongWords(s)
    })
  }
  const hist = [...historySessions.value].reverse()
  for (let i = 0; i < hist.length; i++) {
    const s = hist[i]!
    rows.push({
      session: s,
      label: `历史轮次 ${i + 1} · ${s.date}（${s.status === 'completed' ? '已完成' : '进行中'}）`,
      wrongWords: sessionWrongWords(s)
    })
  }
  return rows
})

const selectedSession = computed(() => {
  const id = selectedSessionId.value
  if (!id) return null
  return selectableSessions.value.find((r) => r.session.id === id)?.session ?? null
})

const selectedWrongWords = computed(() => {
  const s = selectedSession.value
  if (!s) return []
  return sessionWrongWords(s)
})

watchEffect(() => {
  const hasPractice =
    !!generatedPayload.value?.english_essay && plainPracticeText.value.length > 0
  if (!hasPractice) {
    typingLiveStats.reset()
    return
  }
  statsTick.value
  typingLiveStats.sync({
    wpm: liveWpm.value,
    accuracyPct: liveAccuracy.value,
    timeFormatted: formattedElapsed.value
  })
})

watch(
  () => selectableSessions.value,
  (rows) => {
    if (!rows.length) {
      selectedSessionId.value = null
      return
    }
    if (!selectedSessionId.value || !rows.some((r) => r.session.id === selectedSessionId.value)) {
      selectedSessionId.value = rows[0]!.session.id
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopStatsTimer()
})

function sessionRowClass(id: string) {
  const base =
    'w-full rounded-xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70'
  const active =
    'border-violet-500/50 bg-violet-950/30 ring-1 ring-violet-500/20'
  const idle = 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
  return [base, selectedSessionId.value === id ? active : idle].join(' ')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 将 `**重点**` 转为带样式 span，不渲染星号；未闭合的 ** 按普通文本转义。
 */
function inlineBoldToHtml(text: string, strongClass: string): string {
  let i = 0
  let out = ''
  while (i < text.length) {
    const start = text.indexOf('**', i)
    if (start === -1) {
      out += escapeHtml(text.slice(i))
      break
    }
    out += escapeHtml(text.slice(i, start))
    const end = text.indexOf('**', start + 2)
    if (end === -1) {
      out += escapeHtml(text.slice(start))
      break
    }
    const inner = text.slice(start + 2, end)
    out += `<span class="${strongClass}">${escapeHtml(inner)}</span>`
    i = end + 2
  }
  return out.replace(/\n/g, '<br/>')
}

const chineseTranslationHtml = computed(() => {
  const t = generatedPayload.value?.chinese_translation
  if (!t) return ''
  return inlineBoldToHtml(t, 'md-strong-zh')
})

function expressionHtml(s: string) {
  return inlineBoldToHtml(s, 'md-strong-expr')
}

function translationHtml(s: string) {
  return inlineBoldToHtml(s, 'md-strong-trans')
}

function analysisHtml(s: string) {
  return inlineBoldToHtml(s, 'md-strong-analysis')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function essayToHtml(essay: string, highlightWords: string[]): string {
  const sorted = [...highlightWords].sort((a, b) => b.length - a.length)

  function highlightPlain(t: string): string {
    let out = escapeHtml(t)
    for (const w of sorted) {
      if (!w.trim()) continue
      const re = new RegExp(`(?<![\\w-])${escapeRegex(w)}(?![\\w-])`, 'gi')
      out = out.replace(re, (m) => {
        return `<strong class="text-amber-400 font-semibold">${escapeHtml(m)}</strong>`
      })
    }
    return out
  }

  const parts = essay.split(/(\*\*[^*]+\*\*)/g)
  return parts
    .map((p) => {
      const m = /^\*\*([^*]+)\*\*$/.exec(p)
      if (m) {
        const inner = m[1] ?? ''
        return `<strong class="text-amber-400 font-semibold">${escapeHtml(inner)}</strong>`
      }
      return highlightPlain(p)
    })
    .join('')
    .replace(/\n/g, '<br/>')
}

const essayHtml = computed(() => {
  const essay = generatedPayload.value?.english_essay
  if (!essay) return ''
  return essayToHtml(essay, selectedWrongWords.value)
})

const generateDisabled = computed(
  () =>
    loading.value ||
    !selectedSession.value ||
    selectedWrongWords.value.length === 0
)

async function generateEssay() {
  const words = selectedWrongWords.value
  if (!words.length) return
  errorMessage.value = ''
  loading.value = true
  generatedPayload.value = null
  try {
    const res = await $fetch<GeneratedPayload>('/api/generate-essay', {
      method: 'POST',
      body: { words }
    })
    generatedPayload.value = res
  } catch (e: unknown) {
    const o = e && typeof e === 'object' ? (e as Record<string, unknown>) : null
    const data = o?.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : null
    errorMessage.value =
      (typeof data?.statusMessage === 'string' && data.statusMessage) ||
      (typeof data?.message === 'string' && data.message) ||
      (typeof o?.statusMessage === 'string' && o.statusMessage) ||
      (typeof o?.message === 'string' && o.message) ||
      '生成失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

// 开发时可在控制台查看分词是否与全文长度一致
if (import.meta.dev) {
  watch(
    [typingTokens, plainPracticeText],
    () => {
      const plain = plainPracticeText.value
      const toks = typingTokens.value
      if (!plain.length) return
      const joined = toks.map((x) => x.text).join('')
      if (joined !== plain) {
        console.warn('[typing] token join mismatch', { len: plain.length, joinedLen: joined.length })
      }
    },
    { immediate: true }
  )
}
</script>

<style scoped>
.essay-body :deep(strong) {
  color: rgb(251 191 36);
  font-weight: 600;
}

.md-inline-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}

.md-inline-wrap :deep(.md-strong-zh) {
  color: rgb(251 191 36);
  font-weight: 600;
}

.md-inline-wrap :deep(.md-strong-expr) {
  color: rgb(167 243 208);
  font-weight: 600;
}

.md-inline-wrap :deep(.md-strong-trans) {
  color: rgb(196 181 253);
  font-weight: 600;
}

.md-inline-wrap :deep(.md-strong-analysis) {
  color: rgb(253 224 71);
  font-weight: 600;
}

.examiner-expression :deep(.md-strong-expr) {
  color: rgb(209 250 229);
  font-weight: 700;
}

.examiner-tip-body :deep(.md-strong-analysis) {
  color: rgb(254 240 138);
  font-weight: 600;
}

.examiner-tip-body :deep(.md-strong-trans) {
  color: rgb(216 180 254);
  font-weight: 600;
}

.typing-editor :deep(.typing-editor-inner) {
  white-space: pre-wrap;
  word-break: break-word;
}

.current-char {
  vertical-align: baseline;
}
</style>
