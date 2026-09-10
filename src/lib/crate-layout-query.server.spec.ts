import { describe, expect, it } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: new Proxy({} as object, {
    get(_target, prop) {
      if (prop === "crateSetMarker") {
        return { findMany: async () => [] };
      }

      return undefined;
    },
  }),
}));

import { hasCrateSetMarkerDelegate } from "src/lib/crate-layout-query.server";

describe("hasCrateSetMarkerDelegate", () => {
  it("returns true when crateSetMarker is reachable through the prisma proxy", () => {
    expect(hasCrateSetMarkerDelegate()).toBe(true);
  });

  it("documents why `in` is unreliable on the proxied prisma export", () => {
    const proxiedPrisma = new Proxy({} as Record<string, unknown>, {
      get(_target, prop) {
        if (prop === "crateSetMarker") {
          return { findMany: async () => [] };
        }

        return undefined;
      },
    }) as { crateSetMarker?: { findMany: () => Promise<unknown[]> } };

    expect("crateSetMarker" in proxiedPrisma).toBe(false);
    expect(typeof proxiedPrisma.crateSetMarker?.findMany).toBe("function");
  });
});
