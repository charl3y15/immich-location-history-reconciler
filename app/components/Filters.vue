<script setup lang="ts">
import {
  getAllTags,
  getSearchSuggestions,
  SearchSuggestionType,
  type ApiHttpError,
  type TagResponseDto,
} from "@immich/sdk";

const tagIds = defineModel<string[] | null>("tagIds", { default: null });
const cameraModel = defineModel<string>("cameraModel", { default: "" });
const isNotInAlbum = defineModel<boolean>("isNotInAlbum", { default: false });

const {
  data: tags,
  status: tagsStatus,
  error: tagsError,
} = useAsyncData<TagResponseDto[], ApiHttpError>(() => getAllTags());
const {
  data: cameraModels,
  status: cameraStatus,
  error: cameraError,
} = useAsyncData<string[], ApiHttpError>(
  () => getSearchSuggestions({ $type: SearchSuggestionType.CameraModel }),
  { transform: (models) => models.map((model) => model || "Unknown") }
);
</script>

<template>
  <div class="flex gap-6">
    <div>
      <MultiSelect
        v-model="tagIds"
        :max-selected-labels="3"
        :options="tags"
        option-label="name"
        option-value="id"
        placeholder="Choose tags"
        :loading="tagsStatus === 'pending'"
        show-clear
        filter
      />
      <Message v-if="tagsError" severity="error" size="small" variant="simple">
        Error {{ tagsError.data?.statusCode ?? tagsError.status }}:
        {{ tagsError.data?.message ?? tagsError.message }}
      </Message>
    </div>
    <div>
      <Select
        v-model="cameraModel"
        :options="cameraModels"
        placeholder="Camera model"
        :loading="cameraStatus === 'pending'"
        :disabled="isNotInAlbum"
        show-clear
        filter
      />
      <Message
        v-if="cameraError"
        severity="error"
        size="small"
        variant="simple"
      >
        Error {{ cameraError.data?.statusCode ?? cameraError.status }}:
        {{ cameraError.data?.message ?? cameraError.message }}
      </Message>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox v-model="isNotInAlbum" inputId="not-in-album" binary />
      <label for="not-in-album">Not in any albums</label>
    </div>
  </div>
</template>
