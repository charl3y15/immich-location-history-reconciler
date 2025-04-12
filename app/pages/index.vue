<script setup lang="ts">
import type { FileUploadSelectEvent } from "primevue/fileupload";
import { init } from "@immich/sdk";
import type { Timeline } from "~/lib/types";

// Server settings

const baseUrl = useLocalStorage("base-url", "");
const apiKey = useLocalStorage("api-key", "");

watch(
  [baseUrl, apiKey],
  ([baseUrl, apiKey]) => {
    if (baseUrl && apiKey) {
      init({ baseUrl, apiKey });
    }
  },
  { immediate: true }
);

// Location history export timeline

async function uploadTimeline(event: FileUploadSelectEvent) {
  const file: File = event.files[0];
  const timeline: Timeline = JSON.parse(await file.text());
  console.log(timeline.semanticSegments.length);
}

// Filters

const cameraModel = ref("");
const tagIds = ref<string[] | null>(null);
const isNotInAlbum = ref(false);
</script>

<template>
  <div>
    <header class="grid gap-2">
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
          <FileUpload
            mode="basic"
            custom-upload
            accept="application/json"
            choose-label="Upload Timeline.json"
            @select="uploadTimeline"
          />
        </div>
      </Panel>
      <Panel
        v-if="baseUrl && apiKey"
        :key="baseUrl + apiKey"
        header="Image filters"
        toggleable
      >
        <Filters
          v-model:cameraModel="cameraModel"
          v-model:tagIds="tagIds"
          v-model:isNotInAlbum="isNotInAlbum"
        />
      </Panel>
    </header>
  </div>
  <main v-if="baseUrl && apiKey">
    <ImagesSearch :tag-ids :is-not-in-album :camera-model />
  </main>
</template>
