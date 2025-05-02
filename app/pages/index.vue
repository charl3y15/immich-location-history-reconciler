<script setup lang="ts">
import type { FileUploadSelectEvent } from "primevue/fileupload";
import type { Timeline } from "~/lib/types";

const isServerInited = ref(false);

// Location history export timeline

async function uploadTimeline(event: FileUploadSelectEvent) {
  const file: File = event.files[0];
  const timeline: Timeline = JSON.parse(await file.text());
  console.log(timeline.semanticSegments.length);
}

// Filters

const cameraModel = useLocalStorage<string | null>("camera-model", null);
const tagIds = useLocalStorage<string[]>("tag-ids", []);
const isNotInAlbum = useLocalStorage("is-not-in-album", false);
const pageSize = useLocalStorage("page-size", 10);
</script>

<template>
  <div>
    <header class="grid gap-2">
      <ServerConfig @init="({apiKey, baseUrl}) => isServerInited = Boolean(apiKey) && Boolean(baseUrl)">
        <template #extra>
          <FileUpload
            mode="basic"
            custom-upload
            accept="application/json"
            choose-label="Upload Timeline.json"
            @select="uploadTimeline"
          />
        </template>
      </ServerConfig>
      <Panel
        v-if="isServerInited"
        header="Image search options"
        toggleable
      >
        <Filters
          v-model:cameraModel="cameraModel"
          v-model:tagIds="tagIds"
          v-model:isNotInAlbum="isNotInAlbum"
          v-model:page-size="pageSize"
        />
      </Panel>
    </header>
  </div>
  <main v-if="isServerInited">
    <ImagesSearch :tag-ids :is-not-in-album :camera-model :page-size />
  </main>
</template>
