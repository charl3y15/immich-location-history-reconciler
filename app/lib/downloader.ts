import { searchAssets } from "@immich/sdk";

export async function* getAllAssets() {
  let page: number | null = 1;
  while (page != null) {
    const {
      assets: { items, nextPage },
    } = await searchAssets({
      metadataSearchDto: {
        withExif: true,
        page,
      },
    });

    yield* items;
    page = nextPage != null ? Number(nextPage) : null;
  }
}
