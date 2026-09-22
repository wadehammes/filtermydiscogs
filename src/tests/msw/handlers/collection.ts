import { HttpResponse, http } from "msw";
import { collectionValueFactory } from "src/tests/factories/CollectionValue.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import type { DiscogsRelease } from "src/types";

export function createDefaultCollectionApiHandlers(options?: {
  username?: string;
  releases?: DiscogsRelease[];
}) {
  const releases = options?.releases ?? [];
  const totalItems = releases.length;
  const totalPages = 1;

  return [
    http.get("/api/collection", ({ request }) => {
      const url = new URL(request.url);
      const perPage = Number.parseInt(
        url.searchParams.get("per_page") ?? "100",
        10,
      );
      const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

      return HttpResponse.json({
        releases: page === 1 ? releases : [],
        pagination: {
          pages: totalPages,
          items: totalItems,
          page,
          per_page: perPage,
          urls: {
            next: "",
            prev: "",
          },
        },
      });
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
