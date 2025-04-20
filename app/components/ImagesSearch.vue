<script setup lang="ts">
// import { useImagesSearch } from "~/lib/useImmichSearch";
import {
  searchAssets,
  type ApiHttpError,
  type MetadataSearchDto,
  type SearchResponseDto,
} from "@immich/sdk";

const { tagIds, isNotInAlbum, cameraModel, pageSize = 10 } = defineProps<{
  tagIds: string[];
  isNotInAlbum: boolean;
  cameraModel: string;
  pageSize?: number;
}>();

// TODO pagination
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
    watch: [() => tagIds, () => isNotInAlbum, () => cameraModel, () => pageSize],
    transform: ({ assets }) => assets,
  }
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
    <div class="grid grid-cols-5 gap-4">
      <article v-for="asset in result?.items" :key="asset.id">
        <ImmichAsset :asset />
      </article>
    </div>
  </section>
</template>
