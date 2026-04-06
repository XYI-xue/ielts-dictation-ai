// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  /** 与 `app/` 源码同树，保证 Nitro 注册 `server/api` 路由 */
  serverDir: 'app/server',
  /** 固定开发端口，避免 3000 空闲时从 3002 变回 3000 导致书签打不开 */
  devServer: {
    port: 3002
  }
})
