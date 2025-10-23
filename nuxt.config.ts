// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@primevue/nuxt-module",
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        cssLayer: {
          name: 'primevue',
          order: 'theme, base, primevue'
        }
      },
    },
  },
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.IMMICH_API_URL || 'http://localhost:2283/api',
        changeOrigin: true,
        prependPath: true,
      }
    }
  },
});
