import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import type { DiscogsRelease } from "src/types";

export const createE2eCollectionPageHandler = (
  releases: DiscogsRelease[],
): RequestHandler =>
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
  });
