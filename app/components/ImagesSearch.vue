<script setup lang="ts">
import {
  searchAssets,
  type ApiHttpError,
  type SearchResponseDto,
} from "@immich/sdk";
import { useTimeline } from "~/lib/timeline";

const {
  tagIds,
  isNotInAlbum,
  cameraModel,
  pageSize = 10,
} = defineProps<{
  tagIds: string[];
  isNotInAlbum: boolean;
  cameraModel: string | null;
  pageSize?: number;
}>();

// TODO: maybe paginate using `takenAfter` time somehow?
// Or contribute a a PR to immich to add pagination support using `after` asset id.
// Decision for now: button to "load more" images, and reset page to 1 upon committing location updates

const { estimateLocationAtTime } = useTimeline();

const { data: result, error } = useAsyncData<
  SearchResponseDto,
  ApiHttpError,
  SearchResponseDto["assets"]
>(
  () =>
    searchAssets({
      metadataSearchDto: {
        // No location
        country: "",
        withExif: true,
        isVisible: true,

        // Search filters
        tagIds,
        isNotInAlbum,
        model: cameraModel,

        // Pagination
        size: pageSize,
      },
    }),
  {
    watch: [
      () => tagIds,
      () => isNotInAlbum,
      () => cameraModel,
      () => pageSize,
    ],
    transform: ({ assets }) => ({
      ...assets,
      items: assets.items.map((asset) => asset),
    }),
  }
);

const items = computed(
  () =>
    result.value?.items.map((item) => ({
      asset: item,
      estimatedLocation: estimateLocationAtTime(new Date(item.fileCreatedAt)),
    })) ?? []
);
</script>

<template>
  <Message v-if="error">
    {{ error }}
  </Message>
  <section v-else>
    <header>
      <!-- TODO: implement pagination -->
      <Button>Next page</Button>
    </header>
    <div
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <article v-for="{asset, estimatedLocation} in items" :key="asset.id">
        <ImmichAsset :asset>
          <p class="whitespace-pre-line">
            {{ estimatedLocation?.point ?? 'Unknown location :/' }}
          </p>
        </ImmichAsset>
      </article>
    </div>
  </section>
</template>
