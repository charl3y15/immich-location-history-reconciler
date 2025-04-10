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
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
});
