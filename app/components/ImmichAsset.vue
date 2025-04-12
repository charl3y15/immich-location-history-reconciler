<script setup lang="ts">
import { AssetMediaSize, viewAsset, type AssetResponseDto } from "@immich/sdk";

const { asset } = defineProps<{ asset: AssetResponseDto }>();

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
  <Card>
    <template #content>
      <Message v-if="status === 'pending'">Loading...</Message>
      <Message v-else-if="error">{{ error }}</Message>
      <div v-else>
        <!-- TODO: wrap image in <a> to photo on Immich -->
        <img
          :src="imgUrl"
          @load="revokeUrl"
          :height="asset.exifInfo?.exifImageHeight ?? undefined"
          :width="asset.exifInfo?.exifImageWidth ?? undefined"
        />
        <p>{{ asset.originalFileName }}</p>
        <p>{{ new Date(asset.fileCreatedAt).toLocaleString() }}</p>
      </div>
    </template>
  </Card>
</template>
