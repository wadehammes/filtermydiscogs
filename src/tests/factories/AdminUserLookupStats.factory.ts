import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import type { KeysMatch } from "src/types/KeysMatch";

type AdminUserLookupStatsFactoryOptions = Record<string, never>;

class AdminUserLookupStatsFactory extends BaseFactory<
  AdminUserLookupStats,
  AdminUserLookupStatsFactoryOptions
> {
  build(
    attributes?: Partial<AdminUserLookupStats>,
    _options?: AdminUserLookupStatsFactoryOptions,
  ): AdminUserLookupStats {
    const username = faker.internet.username();
    const createdAt = faker.date.past().toISOString();
    const updatedAt = faker.date.recent().toISOString();

    const instance = {
      user: {
        discogsUserId: faker.number.int({ min: 1, max: 99_999 }),
        username,
        createdAt,
        updatedAt,
      },
      preferences: {
        theme: faker.helpers.arrayElement(["system", "dark", "light"]),
        defaultView: faker.helpers.arrayElement(["card", "list"]),
        persistFilters: faker.datatype.boolean(),
        analyticsConsent: faker.helpers.arrayElement([
          "enabled",
          "disabled",
          "unset",
        ] as const),
        savedViewsCount: faker.number.int({ min: 0, max: 5 }),
      },
      totals: {
        crates: faker.number.int({ min: 0, max: 10 }),
        releases: faker.number.int({ min: 0, max: 100 }),
        publicCrates: faker.number.int({ min: 0, max: 5 }),
        packedEnabledCrates: faker.number.int({ min: 0, max: 5 }),
        cratesWithNotes: faker.number.int({ min: 0, max: 5 }),
        setMarkers: faker.number.int({ min: 0, max: 20 }),
        packedReleases: faker.number.int({ min: 0, max: 50 }),
      },
      activity: {
        lastCrateUpdateAt: null,
        lastReleaseAddedAt: null,
        releasesAddedLast7Days: faker.number.int({ min: 0, max: 10 }),
        releasesAddedLast30Days: faker.number.int({ min: 0, max: 30 }),
      },
      analytics: {
        last7Days: faker.number.int({ min: 0, max: 50 }),
        last30Days: faker.number.int({ min: 0, max: 200 }),
        total: faker.number.int({ min: 0, max: 500 }),
      },
      crates: [],
    } satisfies AdminUserLookupStats;

    const factoryBuilt: AdminUserLookupStats = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      AdminUserLookupStats,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forUsername(
    username: string,
    attributes: Partial<AdminUserLookupStats> = {},
  ): AdminUserLookupStats {
    return this.build({
      user: {
        discogsUserId: 123,
        username,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      preferences: {
        theme: "dark",
        defaultView: "card",
        persistFilters: true,
        analyticsConsent: "unset",
        savedViewsCount: 0,
      },
      totals: {
        crates: 2,
        releases: 10,
        publicCrates: 1,
        packedEnabledCrates: 0,
        cratesWithNotes: 0,
        setMarkers: 0,
        packedReleases: 0,
      },
      activity: {
        lastCrateUpdateAt: null,
        lastReleaseAddedAt: null,
        releasesAddedLast7Days: 0,
        releasesAddedLast30Days: 0,
      },
      analytics: {
        last7Days: 0,
        last30Days: 0,
        total: 0,
      },
      crates: [],
      ...attributes,
    });
  }
}

export const adminUserLookupStatsFactory = new AdminUserLookupStatsFactory();
