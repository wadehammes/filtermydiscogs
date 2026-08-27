import { faker } from "@faker-js/faker";
import { SortValues } from "src/constants/sortValues";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type {
  PersistedFiltersJson,
  StyleOperator,
} from "src/types/filters.types";
import type { KeysMatch } from "src/types/KeysMatch";
import {
  type StoredTheme,
  type StoredViewState,
  USER_PREFERENCES_VERSION,
  type UserPreferences,
} from "src/types/userPreferences.types";
import { defaultPersistedFilters } from "src/utils/filtersStorage";

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
      selectedYears: faker.helpers.arrayElements([1970, 1980, 1990]),
      selectedFormats: faker.helpers.arrayElements(["Vinyl", "CD", "Cassette"]),
      selectedSort: faker.helpers.arrayElement([
        SortValues.DateAddedNew,
        SortValues.AZArtist,
        SortValues.AZTitle,
      ]),
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
    const theme: StoredTheme = faker.helpers.arrayElement([
      "light",
      "dim",
      "dark",
      "sepia",
      "slate",
      "midnight",
      "futuristic",
      "high-contrast",
      "system",
    ]);

    const instance = {
      version: USER_PREFERENCES_VERSION,
      persistFilters: faker.helpers.arrayElement([true, false]),
      autoPlayOnQueueAdd: faker.helpers.arrayElement([true, false]),
      theme,
      view,
      filters: persistedFiltersFactory.build(),
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
      theme: "system",
      view: { currentView: "card", previousView: "card" },
      filters: persistedFiltersFactory.empty(),
    };
  }
}

export const persistedFiltersFactory = new PersistedFiltersFactory();
export const userPreferencesFactory = new UserPreferencesFactory();
