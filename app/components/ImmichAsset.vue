<script setup lang="ts">
import {
  AssetMediaSize,
  viewAsset,
  defaults as apiOptions,
  type AssetResponseDto,
} from "@immich/sdk";

const confirmEdit = defineModel<boolean>("confirmEdit", { default: false });
const { asset } = defineProps<{ asset: AssetResponseDto }>();
const timestamp = computed(() => new Date(asset.fileCreatedAt));
const href = computed(
  () => new URL(apiOptions.baseUrl).origin + "/photos/" + asset.id
);

const {
  data: imgUrl,
  status,
  error,
} = useAsyncData(
  asset.id,
  () => viewAsset({ id: asset.id, size: AssetMediaSize.Thumbnail }),
  {
    transform: window.URL.createObjectURL,
  }
);

function revokeUrl() {
  if (imgUrl.value) {
    window.URL.revokeObjectURL(imgUrl.value);
  }
}
</script>

<template>
  <Card
    :class="{ 'bg-slate-200': confirmEdit, 'h-full': true }"
    :pt="{ body: { class: 'flex-grow justify-between' } }"
  >
    <template #header>
      <Message v-if="status === 'pending'">Loading...</Message>
      <Message v-else-if="error">{{ error }}</Message>
      <div v-else>
        <a :href target="_blank">
          <img
            class="max-h-80 w-auto m-auto"
            :src="imgUrl"
            :height="asset.exifInfo?.exifImageHeight ?? undefined"
            :width="asset.exifInfo?.exifImageWidth ?? undefined"
            @load="revokeUrl"
          />
        </a>
      </div>
    </template>
    <template #title>
      <p style="overflow-wrap: break-word">{{ asset.originalFileName }}</p>
    </template>
    <template #subtitle>
      <p>{{ timestamp.toLocaleString() }}</p>
    </template>
    <template #content>
      <slot />
    </template>
    <template #footer>
      <div class="text-end">
        <label>
          <span class="align-middle mr-1">Confirm edit?</span>
          <Checkbox class="align-middle" v-model="confirmEdit" binary />
        </label>
      </div>
    </template>
  </Card>
</template>
