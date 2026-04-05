<template>
  <div class="mx-auto max-w-2xl pb-16">
    <header class="mb-8 space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-50">专项复习</h1>
      <p class="text-sm leading-relaxed text-zinc-500">
        列表仅展示听写页曾答错过的词；听写里后来拼对仍会保留在此，直到你在本页完成专项巩固（如拼写强化三次盲打对后移出）。
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

    <ul v-else class="space-y-4" role="list">
      <li v-for="log in filteredLogs" :key="log.id">
        <!-- 拼写强化 -->
        <article
          v-if="activeTab === 'spelling'"
          class="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/95 p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.05] transition-[box-shadow,transform] duration-300"
          :class="{
            'ring-2 ring-emerald-500/50 shadow-emerald-950/20': isCelebrating(log.id),
            'ring-1 ring-rose-500/25': spellStates[log.id]?.showInputError
          }"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">拼写强化</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>
          <p class="mt-1 font-mono text-sm text-zinc-500">你曾拼写为</p>
          <p class="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-rose-300/95">
            {{ log.wrongInput || '（空）' }}
          </p>
          <p class="mt-3 text-xs text-zinc-600">
            目标词 <span class="text-zinc-400">{{ log.target.word.length }}</span> 个字母 · 盲打正确后按 Enter 提交
          </p>

          <!-- form submit + keyup.enter（不去拦截 keydown，避免个别环境无法触发 submit）；脚本内去重；提交以 input DOM 值为准 -->
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
              placeholder="在此盲打正确拼写…"
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

        <!-- 近音辨析 · 占位 -->
        <article
          v-else-if="activeTab === 'sound'"
          class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">近音辨析</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
              <p class="text-xs text-zinc-500">目标词</p>
              <p class="mt-1 font-mono text-xl text-emerald-200/90">{{ log.target.word }}</p>
              <p class="mt-2 text-xs text-zinc-500">{{ log.target.phonetic }}</p>
              <p class="mt-1 text-sm text-zinc-400">{{ log.target.translation }}</p>
            </div>
            <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4">
              <p class="text-xs text-zinc-500">你的输入</p>
              <p class="mt-1 font-mono text-xl text-rose-300/90">{{ log.wrongInput || '（空）' }}</p>
              <p class="mt-3 text-xs leading-relaxed text-zinc-600">
                完整交互（听音二选一、释义对比）将在后续步骤接入。
              </p>
            </div>
          </div>
        </article>

        <!-- 生词重学 · 占位 -->
        <article
          v-else
          class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">生词重学</p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-600">{{ recordedLabel(log) }}</p>
          </div>
          <div class="mt-4 space-y-3">
            <div>
              <p class="text-xs text-zinc-500">目标词</p>
              <p class="mt-0.5 font-mono text-2xl text-zinc-100">{{ log.target.word }}</p>
              <p class="mt-1 text-sm text-zinc-500">{{ log.target.phonetic }}</p>
              <p class="mt-1 text-zinc-400">{{ log.target.translation }}</p>
            </div>
            <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
              <p class="text-xs text-zinc-500">你的输入</p>
              <p class="font-mono text-sm text-rose-300/85">{{ log.wrongInput || '（空）' }}</p>
            </div>
            <p class="text-xs leading-relaxed text-zinc-600">
              例句：{{ log.target.example_sentence }}
            </p>
            <p class="text-xs text-zinc-600">词根详解与复习流程将在后续步骤完善。</p>
          </div>
        </article>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
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

const { errorLogs, removeErrorLog } = useWordStore()

/** 与听写结果对齐的复习条目（排除未来其它来源且带显式 source 的数据） */
const dictationReviewLogs = computed(() => errorLogs.value.filter(isDictationReviewEntry))

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

watch(
  dictationReviewLogs,
  (logs) => {
    for (const log of logs) {
      if (log.category === 'typo' || log.category === 'morphological') {
        ensureSpellState(log.id)
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
