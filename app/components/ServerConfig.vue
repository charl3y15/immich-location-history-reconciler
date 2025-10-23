<script setup lang="ts">
import { init } from "@immich/sdk";

const emit = defineEmits<{
  init: [{ baseUrl: string; apiKey: string }];
}>();

const baseUrl = useLocalStorage("base-url", "");
const apiKey = useLocalStorage("api-key", "");

// In development, use the proxy URL to avoid CORS issues
const isDev = process.dev;
const effectiveBaseUrl = computed(() => {
  if (isDev && baseUrl.value) {
    // Use the proxy for API calls in development
    return "/api";
  }
  return baseUrl.value;
});

watch(
  [baseUrl, apiKey],
  ([baseUrl, apiKey]) => {
    if (baseUrl && apiKey) {
      // Use the proxy URL in development, original URL in production
      const urlToUse = isDev ? "/api" : baseUrl;
      init({ baseUrl: urlToUse, apiKey });
    }
    emit("init", { apiKey, baseUrl: effectiveBaseUrl.value });
  },
  { immediate: true }
);
</script>

<template>
  <Panel header="Server configuration" toggleable>
    <div class="flex gap-4 pt-4">
      <IftaLabel>
        <InputText
          class="w-72"
          id="base-url"
          v-model="baseUrl"
          placeholder="https://immich.example.com/api"
        />
        <label for="base-url">Immich API base URL</label>
        <small v-if="isDev && baseUrl" class="text-green-600">
          Development mode: Using proxy at /api (targeting {{ baseUrl }})
        </small>
      </IftaLabel>
      <IftaLabel>
        <InputText id="api-key" v-model="apiKey" />
        <label for="api-key">Immich API Key</label>
      </IftaLabel>
      <slot name="extra" />
    </div>
  </Panel>
</template>
