<script setup lang="ts">
import { updateAsset, type AssetResponseDto } from "@immich/sdk";
import type { FileUploadSelectEvent } from "primevue";
import { getAllAssets } from "~/lib/downloader";
import { getTimestampFromFilename } from "~/lib/timestamps";

const loading = ref(false);
const threshold = useLocalStorage("timestamp-threshold", 24);
const thresholdInfo = templateRef("thresholdInfo");
const allAssets = ref<AssetResponseDto[]>([]);

async function downloadAssets() {
  loading.value = true;
  try {
    const assets = await Array.fromAsync(getAllAssets());
    const blob = new Blob([JSON.stringify(assets, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assets.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert("Error downloading assets: " + error);
  } finally {
    loading.value = false;
  }
}

async function uploadAssets(event: FileUploadSelectEvent) {
  const file: File = event.files[0];
  allAssets.value = JSON.parse(await file.text());
}

const millisecondsInHour = 60 * 60 * 1000;

const mismatchingAssets = useArrayFilter(allAssets, (asset) => {
  const fileCreatedAt = new Date(asset.fileCreatedAt);
  const fileNameDate = getTimestampFromFilename(asset.originalFileName);
  if (!fileNameDate) {
    return false;
  }
  return (
    Math.abs(fileCreatedAt.getTime() - fileNameDate.getTime()) >
    threshold.value * millisecondsInHour
  );
});

const updateCandidates = ref<
  Record<
    string,
    { asset: AssetResponseDto; filenameDate: Date; checked: boolean }
  >
>({});

watch(mismatchingAssets, (assets) => {
  updateCandidates.value = Object.fromEntries(
    assets.map((asset) => {
      const timestamp = getTimestampFromFilename(asset.originalFileName)!;
      const hasDateOnly =
        timestamp.getHours() === 0 &&
        timestamp.getMinutes() === 0 &&
        timestamp.getSeconds() === 0;
      const filenameBeforeMeta = timestamp < new Date(asset.fileCreatedAt);

      return [
        asset.id,
        {
          asset,
          filenameDate: timestamp,
          checked: !hasDateOnly && filenameBeforeMeta,
        },
      ];
    })
  );
});

const toUpdate = computed(() => {
  return Object.values(updateCandidates.value).filter(
    (candidate) => candidate.checked
  );
});

const allChecked = computed(() => {
  return toUpdate.value.length === mismatchingAssets.value.length;
});
const noneChecked = computed(() => {
  return toUpdate.value.length === 0;
});
const toggleAll = () => {
  const valueToSet = !allChecked.value;
  for (const candidate of Object.values(updateCandidates.value)) {
    candidate.checked = valueToSet;
  }
};

const updateAssets = async () => {
  loading.value = true;
  try {
    const updatedAssets = await Promise.all(
      toUpdate.value.map(({ asset, filenameDate }) => {
        asset.exifInfo?.timeZone

        return updateAsset({
          id: asset.id,
          updateAssetDto: { dateTimeOriginal: filenameDate.toISOString() },
        });
      })
    );
    const updatedIds = new Set(updatedAssets.map((asset) => asset.id));
    allAssets.value = allAssets.value.filter(
      (asset) => !updatedIds.has(asset.id)
    );
  } catch (error) {
    alert("Error updating assets: " + error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <header>
      <Panel toggleable collapsed header="README">
        <Message>
          Sometimes, when moving files between devices/cloud or downloading from
          WhatsApp or so, the file creation date gets messed up, and there might
          not be EXIF info. This tool attempts to discover some of those
          discrepencies by detecting a date/timestamp in the file name.
        </Message>
        <Message class="mt-2" severity="warn">
          Since it is not possible to run these checks with the search API,
          <em>all</em> assets need to be loaded. To decrease the load on the
          server, download them once to a JSON file and then upload that JSON
          file below. This should not be necessary once I implement proper
          pagination, but for now, it is a bit of a hack (contributions are
          welcome).
        </Message>
        <Message class="mt-2" severity="secondary">
          This tool is not perfect and might not work for all files. It relies
          only on the <code>fileCreatedAt</code> field of the asset (which is
          the same as <code>dateTimeOriginal</code> in EXIF, if it exists).
        </Message>
        <Message class="mt-2" severity="warn">
          Note: this fixes only the data in Immich's database, not in the
          original image files. After
          <a href="https://github.com/immich-app/immich/pull/17061"
            ><code>immich#17061</code></a
          >
          gets merged, it would be possible to use similar images as an
          information source as well.
        </Message>
      </Panel>
      <ServerConfig />
    </header>
    <main class="mt-4">
      <section class="flex gap-6">
        <Button @click="downloadAssets" :disabled="loading">Download all assets metadata</Button>
        <FileUpload
          choose-label="Upload assets.json"
          mode="basic"
          custom-upload
          accept="application/json"
          @select="uploadAssets"
          :disabled="loading"
        />
        <IftaLabel class="flex gap-1 items-center">
          <InputNumber
            class="w-40"
            id="threshold"
            placeholder="24"
            v-model="threshold"
            :min="1"
            :disabled="loading"
          />
          <label for="threshold">Threshold in hours</label>
          <Button severity="info" rounded @click="thresholdInfo?.show">
            ?
          </Button>
          <Popover ref="thresholdInfo">
            <Message class="max-w-lg" severity="secondary" variant="simple">
              Some filenames may not contain the time (only date), and the
              timezone may not always be correctly stored in the metadata.
              <br />
              Therefore, you can set a threshold in hours, with any difference
              smaller than it being considered the same date.
            </Message>
          </Popover>
        </IftaLabel>
        <div class="flex items-center gap-2">
          <Checkbox
            binary
            indeterminate
            :model-value="allChecked || (noneChecked && null)"
            @value-change="toggleAll"
          >
            Check all
          </Checkbox>
          <label for="toggleAll">{{ allChecked ? 'Unc' : 'C' }}heck all</label>
        </div>
      </section>
      <section class="mt-4 grid gap-4 grid-cols-5">
        <article
          v-if="mismatchingAssets.length"
          v-for="asset in mismatchingAssets"
          :key="asset.id"
        >
          <ImmichAsset
            :asset
            v-model:confirm-edit="updateCandidates[asset.id].checked"
          >
            <Message severity="warn">
              <strong>Detected timestamp:</strong>
              <DatePicker
                v-model="updateCandidates[asset.id].filenameDate"
                show-time
                show-seconds
                @date-select="updateCandidates[asset.id].checked = true"
              />
            </Message>
          </ImmichAsset>
        </article>
        <Message v-else>
          No mismatches found. All assets dates are in sync with the file name.
        </Message>
      </section>
    </main>
    <footer v-if="toUpdate.length" class="mt-4">
      <Button :disabled="loading" @click="updateAssets">
        Confirm {{ toUpdate.length }} edit{{ toUpdate.length === 1 ? '' : 's' }}
      </Button>
    </footer>
  </div>
</template>
