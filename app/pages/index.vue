<template>
  <div class="mx-auto max-w-5xl space-y-10 pb-20">
    <!-- 页头 -->
    <header class="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 ring-1 ring-inset ring-white/[0.05] sm:p-8">
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-600/12 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-600/8 blur-3xl"
        aria-hidden="true"
      />
      <div class="relative">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/80">Overview</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">Dashboard</h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          训练轮次与错题池保存在本地。下方汇总最近听写轮次、错题类型分布，并与听写 / 复习 / 打字练习联动。
        </p>
      </div>
    </header>


    <!-- CTA -->
    <div class="flex flex-wrap items-center gap-3">
      <NuxtLink
        to="/dictation"
        class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
      >
        开始听写
        <span aria-hidden="true">→</span>
      </NuxtLink>
      <NuxtLink
        to="/review"
        class="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/80 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
      >
        专项复习
      </NuxtLink>
      <NuxtLink
        to="/typing"
        class="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-transparent px-6 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
      >
        语境作文
      </NuxtLink>
    </div>

    <!-- 概览指标 -->
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">语境打字 · 实时</p>
        <p class="mt-1 text-xs text-zinc-600">与语境作文页悬浮统计同步</p>
        <dl class="mt-3 space-y-1.5 text-sm">
          <div class="flex justify-between gap-2 tabular-nums">
            <dt class="text-zinc-500">Time</dt>
            <dd class="font-medium text-zinc-100">{{ typingTime }}</dd>
          </div>
          <div class="flex justify-between gap-2 tabular-nums">
            <dt class="text-zinc-500">WPM</dt>
            <dd class="font-medium text-violet-300">{{ typingWpm }}</dd>
          </div>
          <div class="flex justify-between gap-2 tabular-nums">
            <dt class="text-zinc-500">Accuracy</dt>
            <dd class="font-medium text-emerald-300/90">{{ typingAccuracy }}%</dd>
          </div>
        </dl>
      </div>
      <div
        class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
      >
        <p class="text-xs font-medium text-zinc-500">待复习错题</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">{{ reviewPoolCount }}</p>
        <p class="mt-1 text-xs text-zinc-600">听写写入、尚未从复习池移除</p>
      </div>
      <div
        class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
      >
        <p class="text-xs font-medium text-zinc-500">当前轮次</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">
          {{ currentSession ? '进行中' : '—' }}
        </p>
        <p v-if="currentSession" class="mt-1 text-xs text-zinc-500">
          {{ currentSession.correctCount }}/{{ currentSession.wordsCount }} 次答对提交
        </p>
        <p v-else class="mt-1 text-xs text-zinc-600">无未归档听写轮次</p>
      </div>
      <div
        class="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-5 ring-1 ring-inset ring-white/[0.04]"
      >
        <p class="text-xs font-medium text-zinc-500">错题类型样本</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-zinc-50">
          {{ errorTypeDistribution.total }}
        </p>
        <p class="mt-1 text-xs text-zinc-600">按历史 Session 内错题记录累计</p>
      </div>
    </section>

    <!-- 最近轮次 -->
    <section
      class="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/55 to-zinc-950/90 ring-1 ring-inset ring-white/[0.04]"
    >
      <div class="border-b border-zinc-800/80 px-5 py-4 sm:px-6">
        <h2 class="text-sm font-semibold text-zinc-100">最近 5 次听写轮次</h2>
        <p class="mt-0.5 text-xs text-zinc-500">日期、进度与本轮错题记录数</p>
      </div>
      <div class="p-5 sm:p-6">
        <p v-if="!recentSessions.length" class="text-sm text-zinc-500">
          暂无记录；在听写页完成一轮后将在此展示。
        </p>
        <ul v-else class="space-y-4" role="list">
          <li
            v-for="s in recentSessions"
            :key="s.id"
            class="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 sm:p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-lg font-semibold tabular-nums text-zinc-100">{{ s.date }}</p>
                <p class="mt-0.5 font-mono text-[10px] text-zinc-600">{{ shortSessionId(s.id) }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="
                  s.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                "
              >
                {{ s.status === 'completed' ? '已完成' : '未完成' }}
              </span>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-md sm:grid-cols-3">
              <div class="rounded-lg bg-zinc-900/80 py-2">
                <p class="text-[10px] uppercase tracking-wide text-zinc-500">词数</p>
                <p class="text-sm font-semibold tabular-nums text-zinc-200">{{ s.wordsCount }}</p>
              </div>
              <div class="rounded-lg bg-zinc-900/80 py-2">
                <p class="text-[10px] uppercase tracking-wide text-zinc-500">答对提交</p>
                <p class="text-sm font-semibold tabular-nums text-zinc-200">{{ s.correctCount }}</p>
              </div>
              <div class="rounded-lg bg-zinc-900/80 py-2">
                <p class="text-[10px] uppercase tracking-wide text-zinc-500">错题记录</p>
                <p class="text-sm font-semibold tabular-nums text-rose-300/90">{{ s.errorIds.length }}</p>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between text-[10px] text-zinc-500">
                <span>本轮答对进度（相对词数）</span>
                <span class="tabular-nums text-zinc-400">{{ sessionProgressLabel(s) }}</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-[width] duration-500"
                  :style="{ width: `${sessionProgressPct(s)}%` }"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 错误类型分布 -->
    <section
      class="overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/55 to-zinc-950/90 ring-1 ring-inset ring-white/[0.04]"
    >
      <div class="border-b border-zinc-800/80 px-5 py-4 sm:px-6">
        <h2 class="text-sm font-semibold text-zinc-100">历史错误类型占比</h2>
        <p class="mt-0.5 text-xs text-zinc-500">按各 Session 内错题记录聚合（同一词 upsert 仍计一条关联）</p>
      </div>
      <div class="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-center">
        <div v-if="errorTypeDistribution.total === 0" class="lg:col-span-2">
          <p class="text-sm text-zinc-500">尚无错题样本；听写答错并归档轮次后将在此可视化。</p>
        </div>
        <template v-else>
          <!-- 环形图 -->
          <div class="mx-auto flex max-w-[220px] flex-col items-center">
            <div class="relative aspect-square w-full max-w-[200px]">
              <div
                class="absolute inset-0 rounded-full shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)]"
                :style="{ background: pieConicGradient }"
              />
              <div
                class="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-zinc-950 ring-1 ring-inset ring-zinc-800/90"
              >
                <p class="text-3xl font-bold tabular-nums text-zinc-50">{{ errorTypeDistribution.total }}</p>
                <p class="text-[10px] font-medium uppercase tracking-wider text-zinc-500">条记录</p>
              </div>
            </div>
          </div>
          <!-- 图例 + 条形 -->
          <ul class="space-y-3" role="list">
            <li
              v-for="row in distributionRows"
              :key="row.key"
              class="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3 sm:p-4"
            >
              <div class="flex items-center justify-between gap-3 text-sm">
                <div class="flex min-w-0 items-center gap-2.5">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                    :style="{ backgroundColor: categoryColor(row.key) }"
                  />
                  <span class="truncate font-medium text-zinc-200">{{ row.label }}</span>
                </div>
                <span class="shrink-0 tabular-nums text-zinc-400">
                  {{ row.count }} 次 · {{ row.pct }}%
                </span>
              </div>
              <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-800/90">
                <div
                  class="h-full rounded-full transition-[width] duration-700 ease-out"
                  :style="{
                    width: `${errorTypeDistribution.total ? (row.count / errorTypeDistribution.total) * 100 : 0}%`,
                    backgroundColor: categoryColor(row.key)
                  }"
                />
              </div>
            </li>
          </ul>
        </template>
      </div>
    </section>
    
  </div>
</template>

<script setup lang="ts">
import { DIAGNOSIS_POOL_LABEL } from '~/utils/diagnosticEngine'
import {
  isDictationReviewEntry,
  type DictationSession,
  type ErrorReviewCategory
} from '~/composables/useWordStore'

const CATEGORY_COLORS: Record<ErrorReviewCategory, string> = {
  sound_alike: '#a78bfa',
  typo: '#fbbf24',
  morphological: '#34d399',
  completely_unknown: '#38bdf8'
}

function categoryColor(key: ErrorReviewCategory): string {
  return CATEGORY_COLORS[key]
}

const { recentSessions, errorTypeDistribution, errorLogs, currentSession } = useWordStore()
const { wpm: typingWpm, accuracyPct: typingAccuracy, timeFormatted: typingTime } =
  useTypingLiveStats()

const reviewPoolCount = computed(() => errorLogs.value.filter(isDictationReviewEntry).length)

const distributionRows = computed(() => {
  const keys: ErrorReviewCategory[] = ['sound_alike', 'typo', 'morphological', 'completely_unknown']
  const { counts, percentages } = errorTypeDistribution.value
  return keys.map((key) => ({
    key,
    label: DIAGNOSIS_POOL_LABEL[key],
    count: counts[key],
    pct: percentages[key]
  }))
})

const pieConicGradient = computed(() => {
  const total = errorTypeDistribution.value.total
  if (total <= 0) return 'conic-gradient(from 0deg, #3f3f46 0% 100%)'
  let acc = 0
  const parts: string[] = []
  for (const row of distributionRows.value) {
    if (row.count <= 0) continue
    const pct = (row.count / total) * 100
    const start = acc
    acc += pct
    parts.push(`${categoryColor(row.key)} ${start}% ${acc}%`)
  }
  if (parts.length === 0) return 'conic-gradient(from 0deg, #3f3f46 0% 100%)'
  return `conic-gradient(from -90deg, ${parts.join(', ')})`
})

function shortSessionId(id: string): string {
  if (id.length <= 22) return id
  return `${id.slice(0, 10)}…${id.slice(-8)}`
}

function sessionProgressPct(s: DictationSession): number {
  if (s.wordsCount <= 0) return 0
  return Math.min(100, Math.round((s.correctCount / s.wordsCount) * 100))
}

function sessionProgressLabel(s: DictationSession): string {
  return `${s.correctCount} / ${s.wordsCount}`
}
</script>
