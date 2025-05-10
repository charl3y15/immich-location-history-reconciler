<script setup lang="ts">
import { searchAssets, type AssetResponseDto } from "@immich/sdk";
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

type TransformedSearchResponse = {
  assets: AssetResponseDto[];
  hasNextPage: boolean;
};

const page = ref(1); // Note: cannot decrease page without clearing results first. Only increment.
const {
  data: result,
  status,
  error,
  clear,
  execute,
} = useAsyncData(
  (async () => {
    const previousAssets = result.value?.assets ?? [];

    const { assets } = await searchAssets({
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
        page: page.value,
      },
    });

    return {
      assets: [...previousAssets, ...assets.items],
      hasNextPage: assets.nextPage != null,
    };
  }) as () => Promise<TransformedSearchResponse>,
  {
    watch: [page],
  }
);

watch(
  [() => tagIds, () => isNotInAlbum, () => cameraModel, () => pageSize],
  () => {
    // Reset page to 1 if any of the search parameters (other than page) changed
    clear();
    page.value = 1;
    execute();
  }
);

const items = computed(
  () =>
    result.value?.assets.map((item) => ({
      asset: item,
      estimatedLocation: estimateLocationAtTime(new Date(item.fileCreatedAt)),
    })) ?? []
);
</script>

<template>
  <Message v-if="error" severity="error">
    {{ error }}
  </Message>
  <section v-else>
    <div
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <article v-for="{ asset, estimatedLocation } in items" :key="asset.id">
        <ImmichAsset :asset>
          <p class="whitespace-pre-line">
            {{ estimatedLocation?.point ?? "Unknown location :/" }}
          </p>
        </ImmichAsset>
      </article>
      <article v-if="items.length === 0" class="col-span-full">
        <Message>No images found</Message>
      </article>
    </div>
    <footer class="flex justify-end gap-3 mt-3">
      <Message v-if="status !== 'success'">
        <p>{{ status }}...</p>
      </Message>
      <Button
        @click="page++"
        :disabled="!result?.hasNextPage || status === 'pending'"
      >
        Load more items
      </Button>
      <Button>Save changes</Button>
    </footer>
  </section>
</template>
