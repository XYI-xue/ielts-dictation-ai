// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  /** 固定开发端口，避免 3000 空闲时从 3002 变回 3000 导致书签打不开 */
  devServer: {
    port: 3002
  }
})
