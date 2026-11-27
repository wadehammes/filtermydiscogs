import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import { BaseFactory } from "src/tests/factories/BaseFactory";

type CollectionCommandIntentFactoryOptions = Record<string, never>;

class CollectionCommandIntentFactory extends BaseFactory<
  CollectionCommandIntent,
  CollectionCommandIntentFactoryOptions
> {
  build(
    attributes?: Partial<CollectionCommandIntent>,
    _options?: CollectionCommandIntentFactoryOptions,
  ): CollectionCommandIntent {
    return {
      searchQuery: "",
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
      selectedSort: SortValues.DateAddedNew,
      selectedSortSecondary: SortSecondaryValues.None,
      yearStartInclusive: 0,
      yearEndExclusive: 0,
      ...attributes,
    };
  }

  withStyles(
    selectedStyles: string[],
    attributes?: Partial<CollectionCommandIntent>,
  ): CollectionCommandIntent {
    return this.build({ selectedStyles, ...attributes });
  }
}

export const collectionCommandIntentFactory =
  new CollectionCommandIntentFactory();
