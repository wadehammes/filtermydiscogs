import { HttpResponse, http } from "msw";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { collectionValueFactory } from "src/tests/factories/CollectionValue.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import type { DiscogsRelease } from "src/types";

export function createDefaultCollectionApiHandlers(options?: {
  releases?: DiscogsRelease[];
}) {
  const releases = options?.releases ?? [];

  return [
    http.get("/api/collection", ({ request }) => {
      const url = new URL(request.url);
      const perPage = Number.parseInt(
        url.searchParams.get("per_page") ?? "100",
        10,
      );
      const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

      return HttpResponse.json(
        collectionFactory.forReleasesPage(releases, { page, perPage }),
      );
    }),
    http.get("/api/collection/fields", () =>
      HttpResponse.json(
        discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      ),
    ),
    http.get("/api/collection/value", () =>
      HttpResponse.json(collectionValueFactory.dashboardDefaults()),
    ),
  ];
}
