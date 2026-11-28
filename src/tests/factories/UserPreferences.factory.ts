import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { DEFAULT_COLLECTION_COMMAND_SHORTCUT } from "src/constants/collectionCommand.constants";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsRelease } from "src/types";
import type {
  PersistedFiltersJson,
  ReleaseFilterCriteria,
  StyleOperator,
} from "src/types/filters.types";
import type { KeysMatch } from "src/types/KeysMatch";
import {
  type StoredTheme,
  type StoredViewState,
  USER_PREFERENCES_VERSION,
  type UserPreferences,
  type UserPreferencesJson,
} from "src/types/userPreferences.types";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import type { AppliedFilterCountInput } from "src/utils/getAppliedFilterCount";
import { STORED_THEMES } from "src/utils/themeAppearance";
import { toPrismaJsonValue } from "src/utils/toPrismaJsonValue";

export type UserPreferencesSelectRow = Prisma.UserGetPayload<{
  select: { preferences: true };
}>;

type PersistedFiltersFactoryOptions = Record<string, never>;

class PersistedFiltersFactory extends BaseFactory<
  PersistedFiltersJson,
  PersistedFiltersFactoryOptions
> {
  build(
    attributes?: Partial<PersistedFiltersJson>,
    _options?: PersistedFiltersFactoryOptions,
  ): PersistedFiltersJson {
    const instance = {
      selectedStyles: faker.helpers.arrayElements([
        "Rock",
        "Jazz",
        "Electronic",
      ]),
      excludedStyles: [],
      selectedYears: faker.helpers.arrayElements([1970, 1980, 1990]),
      excludedYears: [],
      selectedFormats: faker.helpers.arrayElements(["Vinyl", "CD", "Cassette"]),
      excludedFormats: [],
      selectedSort: faker.helpers.arrayElement([
        SortValues.DateAddedNew,
        SortValues.AZArtist,
        SortValues.AZTitle,
      ]),
      selectedSortSecondary: SortSecondaryValues.None,
      styleOperator: faker.helpers.arrayElement([
        "AND",
        "OR",
        "NONE",
      ] as StyleOperator[]),
      formatOperator: faker.helpers.arrayElement([
        "AND",
        "OR",
        "NONE",
      ] as StyleOperator[]),
      yearOperator: faker.helpers.arrayElement(["OR", "NONE"] as const),
      searchQuery: faker.lorem.words({ min: 0, max: 3 }),
    } satisfies PersistedFiltersJson;

    const factoryBuilt: PersistedFiltersJson = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      PersistedFiltersJson,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  empty(): PersistedFiltersJson {
    return defaultPersistedFilters;
  }

  withDefaults(
    attributes?: Partial<PersistedFiltersJson>,
  ): PersistedFiltersJson {
    return {
      ...defaultPersistedFilters,
      ...(attributes ?? {}),
    };
  }
}

type UserPreferencesFactoryOptions = Record<string, never>;

class UserPreferencesFactory extends BaseFactory<
  UserPreferences,
  UserPreferencesFactoryOptions
> {
  build(
    attributes?: Partial<UserPreferences>,
    _options?: UserPreferencesFactoryOptions,
  ): UserPreferences {
    const view: StoredViewState = {
      currentView: faker.helpers.arrayElement(["card", "list", "random"]),
      previousView: faker.helpers.arrayElement(["card", "list", "random"]),
    };
    const theme: StoredTheme = faker.helpers.arrayElement([...STORED_THEMES]);

    const instance = {
      version: USER_PREFERENCES_VERSION,
      persistFilters: faker.helpers.arrayElement([true, false]),
      autoPlayOnQueueAdd: faker.helpers.arrayElement([true, false]),
      extendQueueWithSimilarReleases: faker.helpers.arrayElement([true, false]),
      defaultCollectionSidePanel: faker.helpers.arrayElement([
        "crates",
        "playlists",
      ] as const),
      theme,
      squareCorners: faker.helpers.arrayElement([true, false]),
      view,
      filters: persistedFiltersFactory.build(),
      filterViews: [],
      collectionCommandPaletteEnabled: true,
      collectionCommandPaletteShortcut: DEFAULT_COLLECTION_COMMAND_SHORTCUT,
      analyticsConsent: faker.datatype.boolean(),
    } satisfies UserPreferences;

    const factoryBuilt: UserPreferences = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      UserPreferences,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  defaults(): UserPreferences {
    return {
      version: USER_PREFERENCES_VERSION,
      persistFilters: true,
      autoPlayOnQueueAdd: true,
      extendQueueWithSimilarReleases: false,
      defaultCollectionSidePanel: "crates",
      theme: "system",
      squareCorners: false,
      view: { currentView: "card", previousView: "card" },
      filters: persistedFiltersFactory.empty(),
      filterViews: [],
      collectionCommandPaletteEnabled: true,
      collectionCommandPaletteShortcut: DEFAULT_COLLECTION_COMMAND_SHORTCUT,
    };
  }

  asApiResponse(attributes?: Partial<UserPreferences>): {
    preferences: UserPreferences;
  } {
    return { preferences: this.build(attributes) };
  }

  defaultsApiResponse(): { preferences: UserPreferences } {
    return { preferences: this.defaults() };
  }

  extendSimilarQueueDefaultsApiResponse(): { preferences: UserPreferences } {
    return this.asApiResponse({
      ...this.defaults(),
      extendQueueWithSimilarReleases: true,
    });
  }

  asPrismaFindUniqueRow(
    attributes?: Partial<UserPreferences>,
  ): UserPreferencesSelectRow {
    return {
      preferences: toPrismaJsonValue(
        this.build(attributes),
      ) as UserPreferencesJson,
    };
  }

  asPrismaFindUniqueDefaultsRow(): UserPreferencesSelectRow {
    return {
      preferences: toPrismaJsonValue(this.defaults()) as UserPreferencesJson,
    };
  }
}

export const persistedFiltersFactory = new PersistedFiltersFactory();

export const appliedFilterCountInputFrom = (
  attributes?: Partial<AppliedFilterCountInput>,
): AppliedFilterCountInput => {
  const base = persistedFiltersFactory.empty();
  return {
    searchQuery: base.searchQuery,
    selectedStyles: base.selectedStyles,
    excludedStyles: base.excludedStyles,
    selectedYears: base.selectedYears,
    excludedYears: base.excludedYears,
    selectedFormats: base.selectedFormats,
    excludedFormats: base.excludedFormats,
    ...attributes,
  };
};

export const releaseFilterCriteriaFrom = (
  attributes?: Partial<ReleaseFilterCriteria>,
): ReleaseFilterCriteria => {
  const base = persistedFiltersFactory.empty();
  return {
    searchQuery: base.searchQuery,
    selectedStyles: base.selectedStyles,
    excludedStyles: base.excludedStyles,
    selectedYears: base.selectedYears,
    excludedYears: base.excludedYears,
    selectedFormats: base.selectedFormats,
    excludedFormats: base.excludedFormats,
    styleOperator: base.styleOperator,
    formatOperator: base.formatOperator,
    yearOperator: base.yearOperator,
    ...attributes,
  };
};

export const computeFilterDerivedStateInputFrom = (
  releases: DiscogsRelease[],
  attributes?: Partial<ReleaseFilterCriteria>,
) => ({
  releases,
  ...releaseFilterCriteriaFrom(attributes),
});

export const userPreferencesFactory = new UserPreferencesFactory();
