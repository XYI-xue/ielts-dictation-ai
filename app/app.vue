<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
    <NuxtRouteAnnouncer />
    <header
      class="sticky top-0 z-20 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:justify-between"
      >
        <NuxtLink
          to="/"
          class="text-sm font-medium tracking-tight text-zinc-100 transition hover:text-white"
        >
          IELTS Dictation
        </NuxtLink>
        <nav class="flex flex-wrap items-center gap-1 sm:justify-end" aria-label="Main">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="linkClass(item.to)"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-10">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Dictation', to: '/dictation' },
  { label: 'Review', to: '/review' },
  { label: 'Typing Practice', to: '/typing-practice' }
] as const

function linkClass(path: string) {
  const base =
    'rounded-md px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-100'
  const active = 'bg-zinc-800 text-zinc-50 hover:text-white'
  const isActive = path === '/' ? route.path === '/' : route.path.startsWith(path)
  return [base, isActive ? active : ''].filter(Boolean).join(' ')
}
</script>
