import { HttpResponse, http } from "msw";
import { LOGIN_DEMO_PUBLIC_CRATE_ID } from "src/constants/loginPageCopy.registry";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { buildE2eCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { E2E_AUTH_USERNAME } from "src/tests/msw/e2eSession.constants";
import type { DiscogsRelease } from "src/types";

const publicDemoReleases = (): DiscogsRelease[] => buildE2eCollectionReleases();

const E2E_PUBLIC_CRATE_API_PATHS = [
  "/api/crates/public/:crateId",
  "http://localhost:6767/api/crates/public/:crateId",
  "http://127.0.0.1:6767/api/crates/public/:crateId",
] as const;

export function createDefaultPublicCrateApiHandlers() {
  const demoCrate = crateFactory.build({
    id: LOGIN_DEMO_PUBLIC_CRATE_ID,
    name: "E2E Public Demo Crate",
    username: E2E_AUTH_USERNAME,
    private: false,
    is_default: false,
  });

  const respond = ({
    params,
    request,
  }: {
    params: Record<string, string | readonly string[] | undefined>;
    request: Request;
  }) => {
    const crateId = String(params.crateId);

    if (crateId !== LOGIN_DEMO_PUBLIC_CRATE_ID) {
      return HttpResponse.json(
        { error: "Crate not found or is private" },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const all = url.searchParams.get("all") === "true";
    const releases = publicDemoReleases();
    const total = releases.length;

    return HttpResponse.json(
      {
        crate: {
          id: demoCrate.id,
          name: demoCrate.name,
          username: demoCrate.username,
          is_default: demoCrate.is_default,
          private: demoCrate.private,
          created_at: demoCrate.created_at,
          updated_at: demoCrate.updated_at,
        },
        releases,
        pagination: {
          page: 1,
          pageSize: all ? total : 50,
          total,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  };

  return E2E_PUBLIC_CRATE_API_PATHS.map((path) => http.get(path, respond));
}
