<template>
  <div class="relative mx-auto max-w-3xl px-1 pb-20 sm:px-0">
    <div
      class="pointer-events-none absolute -top-6 left-1/2 h-48 w-[min(100vw,36rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.14),transparent_55%)]"
      aria-hidden="true"
    />

    <header class="relative mb-8 space-y-3">
      <p class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-violet-400/85">
        Error pool · Review
      </p>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">专项复习</h1>
      <p class="max-w-2xl text-sm leading-relaxed text-zinc-500">
        先看清<strong class="font-medium text-zinc-400">上次错在哪、与正确词差在哪</strong>，再完成下方练习。听写里后来拼对仍会保留在此，直到拼写强化完成三次盲打巩固。
      </p>
      <p class="text-sm">
        <NuxtLink
          to="/dictation"
          class="font-medium text-violet-400/95 underline decoration-violet-500/45 underline-offset-2 transition hover:text-violet-300"
        >
          去听写页练习
        </NuxtLink>
      </p>
    </header>

    <div
      class="relative mb-4 rounded-3xl border border-zinc-800/90 bg-zinc-900/35 p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.04] backdrop-blur-sm sm:p-2.5"
      role="tablist"
      aria-label="复习类型"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :class="tabButtonClass(tab.key)"
          @click="activeTab = tab.key"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-950/40 text-zinc-400 transition group-hover:border-zinc-600/50 group-hover:text-zinc-200"
            :class="
              activeTab === tab.key && tab.key === 'sound'
                ? 'border-violet-500/30 bg-violet-950/40 text-violet-200'
                : activeTab === tab.key && tab.key === 'spelling'
                  ? 'border-amber-500/30 bg-amber-950/35 text-amber-200'
                  : activeTab === tab.key && tab.key === 'unknown'
                    ? 'border-sky-500/30 bg-sky-950/35 text-sky-200'
                    : ''
            "
            aria-hidden="true"
          >
            <svg
              v-if="tab.key === 'sound'"
              class="h-4 w-4"
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
              class="h-4 w-4"
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
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </span>
          <span class="min-w-0 flex-1 sm:text-left">
            <span class="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <span class="text-sm font-semibold tracking-tight">{{ tab.label }}</span>
              <span v-if="tabCounts[tab.key] > 0" :class="tabBadgeClass(tab.key)">
                {{ tabCounts[tab.key] }}
              </span>
            </span>
            <span
              class="mt-0.5 block text-[0.65rem] font-medium leading-snug sm:text-xs"
              :class="
                activeTab === tab.key
                  ? 'text-zinc-400'
                  : 'text-zinc-600 group-hover:text-zinc-500'
              "
            >
              {{
                tab.key === 'sound'
                  ? '听音 · 二选一'
                  : tab.key === 'spelling'
                    ? '盲打 · 连对 3 次'
                    : '整词 · 默写自测'
              }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <div :class="[activeTabHintBarClass, 'mb-2']" role="status">
      <p class="text-xs font-bold uppercase tracking-wide text-zinc-400">当前模式</p>
      <p class="mt-1 text-sm opacity-95">{{ TAB_TAGLINES[activeTab] }}</p>
    </div>

    <div v-if="!filteredLogs.length" class="mt-8 rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/20 py-16 text-center ring-1 ring-inset ring-white/[0.03]">
      <p class="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
        {{
          !dictationReviewLogs.length
            ? '暂无听写错题。请在听写页提交错误拼写，系统会按诊断写入对应专项。'
            : '当前分类下暂无听写错题，可切换其他 Tab 查看。'
        }}
      </p>
    </div>

    <ul v-else class="mt-8 space-y-8" role="list">
      <li v-for="log in filteredLogs" :key="log.id">
        <!-- 拼写强化 -->
        <article
          v-if="activeTab === 'spelling'"
          class="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/[0.06] transition-[box-shadow,transform] duration-300 sm:p-7"
          :class="{
            'ring-2 ring-emerald-500/45 shadow-[0_0_40px_-8px_rgba(16,185,129,0.25)]': isCelebrating(log.id),
            'ring-2 ring-rose-500/30': spellStates[log.id]?.showInputError
          }"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">
              拼写强化 · 对照 → 盲打过关
            </p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-500">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-4 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/45 to-amber-950/10 px-4 py-3 text-xs leading-snug text-amber-100/95 ring-1 ring-inset ring-amber-500/10"
          >
            <span class="font-semibold text-amber-200">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1.5 block text-amber-100/85">{{ reviewHint(log.category) }}</span>
          </p>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div
              class="rounded-2xl border border-rose-500/30 border-l-4 border-l-rose-400/80 bg-gradient-to-br from-rose-950/35 to-zinc-950/40 p-4 ring-1 ring-inset ring-rose-500/10 sm:p-5"
            >
              <p class="text-[0.65rem] font-bold uppercase tracking-wide text-rose-300/90">你的拼写（错误）</p>
              <p class="mt-3 font-mono text-2xl font-bold tracking-tight text-rose-100 sm:text-3xl">
                {{ log.wrongInput || '（空）' }}
              </p>
            </div>
            <div
              class="rounded-2xl border border-emerald-500/30 border-l-4 border-l-emerald-400/80 bg-gradient-to-br from-emerald-950/35 to-zinc-950/40 p-4 ring-1 ring-inset ring-emerald-500/10 sm:p-5"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-300/90">应掌握（正确）</p>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-200/90 transition hover:border-violet-400/40 hover:bg-violet-950/30 hover:text-violet-200"
                  :aria-label="`朗读 ${log.target.word}`"
                  @click="speakWord(log.target.word)"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  朗读
                </button>
              </div>
              <p class="mt-3 font-mono text-2xl font-bold tracking-tight text-emerald-100 sm:text-3xl">
                {{ log.target.word }}
              </p>
              <p class="mt-2 font-mono text-sm text-emerald-200/70">{{ log.target.phonetic }}</p>
              <p class="mt-2 text-sm leading-relaxed text-zinc-300">{{ log.target.translation }}</p>
            </div>
          </div>

          <div
            class="mt-6 rounded-2xl border border-amber-500/20 bg-zinc-950/50 p-4 ring-1 ring-inset ring-white/[0.04] sm:p-5"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs font-bold uppercase tracking-wide text-amber-200/90">核心练习 · 盲打</p>
              <p class="text-xs text-zinc-500">
                连续对 <span class="font-semibold tabular-nums text-amber-300">3</span> 次移出池
              </p>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-zinc-400">
              对照上方红 / 绿卡片，在下方输入框<strong class="text-zinc-300">不看屏幕抄词</strong>（盲打）正确拼写，按
              <kbd
                class="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.65rem] text-zinc-300"
                >Enter</kbd
              >
              提交。
            </p>

            <form class="mt-4" @submit.prevent="onSpellSubmit(log)">
              <div
                class="rounded-2xl border border-zinc-700/80 bg-zinc-950/60 p-1 shadow-inner shadow-black/40 transition-[box-shadow,border-color] focus-within:border-amber-500/35 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.12),0_12px_40px_-12px_rgba(217,119,6,0.15)]"
              >
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
                  class="w-full rounded-[0.875rem] border-0 bg-transparent px-4 py-3.5 font-mono text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0 sm:text-xl"
                  :class="spellStates[log.id]?.showInputError ? 'text-rose-200' : ''"
                  @keyup.enter.exact.prevent="onSpellSubmit(log)"
                />
              </div>
            </form>

            <div class="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <p class="text-[11px] font-medium uppercase tracking-wider text-zinc-500">过关进度</p>
              <div class="flex items-center gap-3" aria-label="三次正确进度">
                <span
                  v-for="step in 3"
                  :key="step"
                  class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums transition-all duration-300"
                  :class="
                    step <= (spellStates[log.id]?.filled ?? 0)
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.25)]'
                      : 'border-zinc-600 bg-zinc-900/80 text-zinc-600'
                  "
                  :aria-label="`第 ${step} 次：${step <= (spellStates[log.id]?.filled ?? 0) ? '已完成' : '待完成'}`"
                >
                  {{ step <= (spellStates[log.id]?.filled ?? 0) ? '✓' : step }}
                </span>
              </div>
            </div>
          </div>

          <Transition name="fade-up">
            <p
              v-if="isCelebrating(log.id)"
              class="mt-5 text-center text-sm font-semibold text-emerald-300"
            >
              已掌握 · 正在移出错词池
            </p>
          </Transition>
        </article>

        <!-- 近音辨析 -->
        <article
          v-else-if="activeTab === 'sound'"
          class="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-violet-500/[0.07] sm:p-7"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-violet-300/85">
              近音辨析 · 播放 → 二选一
            </p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-500">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-4 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-violet-950/10 px-4 py-3 text-xs leading-snug text-violet-100/95 ring-1 ring-inset ring-violet-400/10"
          >
            <span class="font-semibold text-violet-200">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1.5 block text-violet-100/85">{{ reviewHint(log.category) }}</span>
          </p>

          <div
            class="mt-6 rounded-2xl border border-violet-500/25 bg-violet-950/15 p-4 ring-1 ring-inset ring-violet-500/10 sm:p-5"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-violet-200/90">核心 · 步骤 1</p>
            <p class="mt-2 text-xs leading-relaxed text-violet-100/80">
              先播放<strong class="text-white">仅目标词</strong>读音；结合释义判断后，点选
              <strong class="text-white">听写目标</strong>或<strong class="text-white">你上次写的词</strong>（顺序随机，勿凭位置猜题）。
            </p>
            <button
              type="button"
              class="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto sm:px-10"
              :aria-label="`播放目标词 ${log.target.word}`"
              @click="speakWord(log.target.word)"
            >
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
              播放目标词读音
            </button>
          </div>

          <p class="mt-4 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            二选一（核心）
          </p>
          <div class="mt-2 grid gap-4 sm:grid-cols-2">
            <div
              v-for="(opt, idx) in getSoundQuizOptions(log)"
              :key="`${log.id}-${idx}`"
              class="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border bg-zinc-950/60 p-5 ring-1 ring-inset transition-shadow"
              :class="
                opt.isTarget
                  ? 'border-violet-500/40 shadow-[0_12px_40px_-12px_rgba(109,40,217,0.25)] ring-violet-500/15'
                  : 'border-zinc-700/80 ring-white/[0.03]'
              "
            >
              <span
                class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums"
                :class="
                  opt.isTarget
                    ? 'border-violet-400/50 bg-violet-950/50 text-violet-200'
                    : 'border-zinc-600 bg-zinc-900 text-zinc-500'
                "
                aria-hidden="true"
                >{{ idx + 1 }}</span
              >
              <div class="space-y-2 pt-1 text-center sm:pt-0">
                <p class="font-mono text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
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
                class="w-full rounded-xl py-3.5 text-sm font-bold transition"
                :class="
                  opt.isTarget
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-950/30 hover:bg-violet-500'
                    : 'border border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                "
                :disabled="soundQuizStates[log.id]?.solved"
                @click="pickSoundQuizOption(log, opt.isTarget)"
              >
                我选这个
              </button>
            </div>
          </div>

          <p v-if="soundQuizStates[log.id]?.hint === 'wrong'" class="mt-4 text-center text-sm font-medium text-rose-400">
            不对，可再听一遍目标词读音，或换另一个选项。
          </p>
          <p
            v-if="soundQuizStates[log.id]?.solved"
            class="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 py-2.5 text-center text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/10"
          >
            选对啦。下方可结合释义再默写巩固。
          </p>

          <div class="relative my-6 flex items-center gap-3">
            <div class="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700" aria-hidden="true" />
            <span class="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              对照参考
            </span>
            <div class="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700" aria-hidden="true" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              class="rounded-2xl border border-rose-500/25 border-l-4 border-l-rose-400/70 bg-gradient-to-br from-rose-950/30 to-zinc-950/50 p-4 ring-1 ring-inset ring-rose-500/10"
            >
              <p class="text-xs font-bold text-rose-300/90">你写成了（易与目标混淆）</p>
              <p class="mt-2 font-mono text-xl font-bold text-rose-100 sm:text-2xl">
                {{ log.wrongInput || '（空）' }}
              </p>
            </div>
            <div
              class="rounded-2xl border border-emerald-500/25 border-l-4 border-l-emerald-400/70 bg-gradient-to-br from-emerald-950/30 to-zinc-950/50 p-4 ring-1 ring-inset ring-emerald-500/10"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-xs font-bold text-emerald-300/90">听写目标（正确）</p>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-950/40 px-2 py-1 text-[10px] font-semibold text-emerald-200 transition hover:border-violet-400/40 hover:text-violet-200"
                  @click="speakWord(log.target.word)"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  朗读
                </button>
              </div>
              <p class="mt-2 font-mono text-xl font-bold text-emerald-100 sm:text-2xl">{{ log.target.word }}</p>
              <p class="mt-2 font-mono text-xs text-zinc-500">{{ log.target.phonetic }}</p>
              <p class="mt-1 text-sm leading-snug text-zinc-400">{{ log.target.translation }}</p>
            </div>
          </div>

          <p class="mt-4 rounded-lg bg-zinc-900/50 px-3 py-2 text-center text-xs text-zinc-500">
            重点：二者<strong class="text-zinc-400">拼写不同</strong>；用<strong class="text-zinc-400">释义与音标</strong>锚定正确词形。
          </p>

          <div
            class="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-4 ring-1 ring-inset ring-white/[0.04] sm:p-5"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-zinc-400">步骤 2 · 默写巩固（不计入移出池）</p>
            <p class="mt-1 text-xs text-zinc-600">
              <span v-if="!soundQuizStates[log.id]?.solved">请先完成上方二选一。</span>
            </p>
            <form
              class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch"
              :class="{ 'pointer-events-none opacity-45': !soundQuizStates[log.id]?.solved }"
              @submit.prevent="onSelfCheckSubmit(log)"
            >
              <div
                class="min-w-0 flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-1 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/25"
              >
                <input
                  v-model="selfCheckStates[log.id].input"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="输入正确单词…"
                  :disabled="!soundQuizStates[log.id]?.solved"
                  class="w-full rounded-lg border-0 bg-transparent px-3 py-2.5 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
                  @input="onSelfCheckInput(log.id)"
                  @keyup.enter.exact.prevent="onSelfCheckSubmit(log)"
                />
              </div>
              <button
                type="submit"
                :disabled="!soundQuizStates[log.id]?.solved"
                class="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-950/30 transition hover:from-violet-500 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
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
          class="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-sky-500/[0.08] sm:p-7"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/35 to-transparent"
            aria-hidden="true"
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-sky-300/85">
              生词重学 · 读义 → 默写
            </p>
            <p v-if="recordedLabel(log)" class="text-[10px] text-zinc-500">{{ recordedLabel(log) }}</p>
          </div>

          <p
            class="mt-4 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/45 to-sky-950/10 px-4 py-3 text-xs leading-snug text-sky-100/95 ring-1 ring-inset ring-sky-400/10"
          >
            <span class="font-semibold text-sky-200">上次判定</span>
            · {{ diagnosisLine(log.category) }}
            <span class="mt-1.5 block text-sky-100/85">{{ reviewHint(log.category) }}</span>
          </p>

          <div
            class="mt-5 rounded-2xl border border-rose-500/20 border-l-4 border-l-rose-400/60 bg-gradient-to-r from-rose-950/25 to-zinc-950/40 px-4 py-3 ring-1 ring-inset ring-rose-500/10"
          >
            <p class="text-[0.65rem] font-bold uppercase tracking-wide text-rose-300/90">你曾写成</p>
            <p class="mt-1.5 font-mono text-xl font-bold text-rose-100 sm:text-2xl">
              {{ log.wrongInput || '（空）' }}
            </p>
          </div>

          <div
            class="mt-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/35 via-zinc-950/50 to-zinc-950 p-5 ring-1 ring-inset ring-emerald-500/15 shadow-[0_16px_48px_-20px_rgba(16,185,129,0.12)]"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="text-xs font-bold uppercase tracking-wide text-emerald-300/95">应掌握的词与义（核心）</p>
              <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-violet-400/40 hover:bg-violet-950/40 hover:text-violet-200"
                @click="speakWord(log.target.word)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
                朗读
              </button>
            </div>
            <p class="mt-4 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">{{ log.target.word }}</p>
            <p class="mt-2 font-mono text-sm text-emerald-200/70">{{ log.target.phonetic }}</p>
            <p class="mt-3 text-base leading-relaxed text-zinc-200">{{ log.target.translation }}</p>
            <p class="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 text-xs leading-relaxed text-zinc-400">
              <span class="font-semibold text-zinc-500">例句</span>
              {{ log.target.example_sentence }}
            </p>
          </div>

          <div
            class="mt-6 rounded-2xl border border-sky-500/20 bg-zinc-950/50 p-4 ring-1 ring-inset ring-white/[0.04] sm:p-5"
          >
            <p class="text-xs font-bold uppercase tracking-wide text-sky-200/90">核心 · 默写自测</p>
            <p class="mt-1 text-xs text-zinc-500">不计入移出池，用于验收是否记住整词。</p>
            <form class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch" @submit.prevent="onSelfCheckSubmit(log)">
              <div
                class="min-w-0 flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950/70 p-1 focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/25"
              >
                <input
                  v-model="selfCheckStates[log.id].input"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="输入正确单词…"
                  class="w-full rounded-lg border-0 bg-transparent px-3 py-3 font-mono text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0 sm:text-lg"
                  @input="onSelfCheckInput(log.id)"
                  @keyup.enter.exact.prevent="onSelfCheckSubmit(log)"
                />
              </div>
              <button
                type="submit"
                class="shrink-0 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-sky-950/30 transition hover:from-sky-500 hover:to-sky-400"
              >
                检查
              </button>
            </form>
            <p
              v-if="selfCheckStates[log.id]?.feedback === 'correct'"
              class="mt-3 text-sm font-semibold text-emerald-400"
            >
              ✓ 拼写正确；建议隔一段时间在听写页再听一遍巩固。
            </p>
            <p
              v-else-if="selfCheckStates[log.id]?.feedback === 'wrong'"
              class="mt-3 text-sm font-semibold text-rose-400"
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

const TAB_TAGLINES: Record<TabKey, string> = {
  sound: '核心流程：播放目标词读音 → 在易混拼写中二选一 → 对照参考后可选默写巩固。',
  spelling: '核心流程：看清错因与正确拼写 → 盲打目标词 → 连续拼对 3 次即可移出错词池。',
  unknown: '核心流程：读透音标、释义与例句 → 理解整词 → 默写自检验收。'
}

function tabButtonClass(key: TabKey) {
  const active = activeTab.value === key
  const base =
    'group relative flex flex-1 flex-col items-center gap-1 rounded-2xl border px-2.5 py-3 text-center transition-all duration-200 sm:flex-row sm:justify-center sm:gap-2.5 sm:px-4 sm:py-3.5'
  if (!active) {
    return `${base} border-zinc-800/90 bg-zinc-900/25 text-zinc-500 hover:border-zinc-700/90 hover:bg-zinc-900/55 hover:text-zinc-300`
  }
  const accents: Record<TabKey, string> = {
    sound:
      'border-violet-500/45 bg-gradient-to-b from-violet-950/50 via-zinc-950/80 to-zinc-950 text-zinc-50 shadow-[0_16px_48px_-14px_rgba(109,40,217,0.4)] ring-2 ring-violet-500/30',
    spelling:
      'border-amber-500/40 bg-gradient-to-b from-amber-950/35 via-zinc-950/80 to-zinc-950 text-zinc-50 shadow-[0_16px_48px_-14px_rgba(217,119,6,0.22)] ring-2 ring-amber-500/25',
    unknown:
      'border-sky-500/40 bg-gradient-to-b from-sky-950/35 via-zinc-950/80 to-zinc-950 text-zinc-50 shadow-[0_16px_48px_-14px_rgba(14,165,233,0.2)] ring-2 ring-sky-500/25'
  }
  return `${base} ${accents[key]}`
}

function tabBadgeClass(key: TabKey) {
  const active = activeTab.value === key
  const map: Record<TabKey, { on: string; off: string }> = {
    sound: {
      on: 'bg-violet-600 text-white shadow-sm shadow-violet-950/50',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    },
    spelling: {
      on: 'bg-amber-600 text-white shadow-sm shadow-amber-950/40',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    },
    unknown: {
      on: 'bg-sky-600 text-white shadow-sm shadow-sky-950/40',
      off: 'border border-zinc-700/80 bg-zinc-800/90 text-zinc-400 group-hover:text-zinc-300'
    }
  }
  const s = map[key]
  const state = active ? s.on : s.off
  return `inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${state}`
}

const activeTabHintBarClass = computed(() => {
  const m: Record<TabKey, string> = {
    sound: 'border-violet-500/25 bg-violet-950/20 text-violet-100/95 ring-1 ring-violet-500/10',
    spelling: 'border-amber-500/25 bg-amber-950/15 text-amber-100/95 ring-1 ring-amber-500/10',
    unknown: 'border-sky-500/25 bg-sky-950/15 text-sky-100/95 ring-1 ring-sky-500/10'
  }
  return `rounded-2xl border px-4 py-3.5 text-sm leading-relaxed ${m[activeTab.value]}`
})

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
