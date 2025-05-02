<script setup lang="ts">
import { init } from "@immich/sdk";

const emit = defineEmits<{
  init: [{ baseUrl: string; apiKey: string }];
}>();


const baseUrl = useLocalStorage("base-url", "");
const apiKey = useLocalStorage("api-key", "");

watch(
  [baseUrl, apiKey],
  ([baseUrl, apiKey]) => {
    if (baseUrl && apiKey) {
      init({ baseUrl, apiKey });
    }
    emit('init', {apiKey, baseUrl})
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
      </IftaLabel>
      <IftaLabel>
        <InputText id="api-key" v-model="apiKey" />
        <label for="api-key">Immich API Key</label>
      </IftaLabel>
      <slot name="extra" />
    </div>
  </Panel>
</template>
