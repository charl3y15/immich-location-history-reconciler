<script setup lang="ts">
import { searchAssets, type AssetResponseDto } from "@immich/sdk";
import { segmentToGeometry, type Geometry } from "~/lib/geometry";
import { useTimeline, type LatLng } from "~/lib/timeline";

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

const { estimateLocationAtTime, timeline } = useTimeline();

type TransformedSearchResponse = {
  assets: AssetResponseDto[];
  hasNextPage: boolean;
};

const page = ref(1); // Note: cannot decrease page without clearing results first. Only increment.
// var instead of const to access "result" inside the function body
var {
  data: result,
  status,
  error,
  clear,
  execute,
} = useAsyncData(
  (async () => {
    const previousAssets = result?.value?.assets ?? [];

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

type Item = {
  asset: AssetResponseDto;
  estimatedLocation: LatLng | undefined;
  geometry: Geometry[];
  confirmEdit: boolean;
};

const items = useArrayMap<AssetResponseDto, Item>(
  () => result.value?.assets ?? [],
  (asset) => {
    const {
      bestEstimate = null,
      estimateSource,
      segments = [],
    } = estimateLocationAtTime(new Date(asset.fileCreatedAt)) ?? {};

    return {
      asset,
      estimatedLocation: bestEstimate?.point,
      geometry: segments
        .map(segmentToGeometry)
        .filter((geometry) => geometry != null),
      confirmEdit: bestEstimate != null && estimateSource === "timelinePath",
    };
  }
);

const updates = ref<Record<string, Item>>({});

// TODO: find a better way to do this
watch(items, (items) => {
  for (const item of items) {
    if (
      updates.value[item.asset.id] == null ||
      updates.value[item.asset.id].estimatedLocation == null
    ) {
      updates.value[item.asset.id] = item;
    }
  }
  for (const id in updates.value) {
    if (!items.some((item) => item.asset.id === id)) {
      delete updates.value[id];
    }
  }
});

const confirmedUpdates = computed(() =>
  Object.values(updates.value).filter((item) => item.confirmEdit)
);

function confirm() {
  // TODO: save changes to the server
  clear();
  // Reset back to the first page that would now contain unseen assets.
  updates.value = {};
  page.value =
    Math.ceil(
      (items.value.length - confirmedUpdates.value.length) / pageSize
    ) || 1;
  execute();
}
</script>

<template>
  <Message v-if="error" severity="error">
    {{ error }}
  </Message>
  <section v-else>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <article v-for="{ asset } in updates" :key="asset.id">
        <ImmichAsset
          :asset
          :disable-confirm="updates[asset.id].estimatedLocation == null"
          v-model:confirm-edit="updates[asset.id].confirmEdit"
        >
          <Message v-if="timeline == null" severity="info">
            Timeline not uploaded.
          </Message>
          <LeafletMap
            v-else
            v-model="updates[asset.id].estimatedLocation"
            @update:model-value="updates[asset.id].confirmEdit = true"
            :segments="updates[asset.id].geometry"
          />
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
      <Button :disabled="confirmedUpdates.length === 0" @click="confirm">
        Save {{ confirmedUpdates.length }} change{{
          confirmedUpdates.length === 1 ? "" : "s"
        }}
      </Button>
    </footer>
  </section>
</template>
