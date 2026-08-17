import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsCollectionField } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";

type DiscogsCollectionFieldFactoryOptions = Record<string, never>;

const DISCOGS_CONDITION_OPTIONS = [
  "Mint (M)",
  "Near Mint (NM or M-)",
  "Very Good Plus (VG+)",
  "Very Good (VG)",
  "Good Plus (G+)",
  "Good (G)",
  "Fair (F)",
  "Poor (P)",
] as const;

const DISCOGS_SLEEVE_CONDITION_OPTIONS = [
  ...DISCOGS_CONDITION_OPTIONS,
  "Generic",
  "Not Graded",
  "No Cover",
] as const;

const FIELD_TYPES = ["textarea", "text", "dropdown", "checkbox"] as const;
type FieldType = DiscogsCollectionField["type"];

class DiscogsCollectionFieldFactory extends BaseFactory<
  DiscogsCollectionField,
  DiscogsCollectionFieldFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsCollectionField>,
    _options?: DiscogsCollectionFieldFactoryOptions,
  ) {
    const instance = {
      id: faker.number.int({ min: 1, max: 20 }),
      name: faker.helpers.arrayElement([
        "Notes",
        "Media",
        "Sleeve",
        faker.word.noun(),
      ]),
      type: faker.helpers.arrayElement(FIELD_TYPES) as FieldType,
      options: faker.helpers.multiple(() => faker.word.noun(), { count: 3 }),
      lines: faker.datatype.boolean(),
      public: faker.datatype.boolean(),
      position: faker.number.int({ min: 1, max: 10 }),
    } satisfies DiscogsCollectionField;

    const factoryBuilt: DiscogsCollectionField = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      DiscogsCollectionField,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  notesField(
    attributes: Partial<DiscogsCollectionField> = {},
  ): DiscogsCollectionField {
    return this.build({
      id: 3,
      name: "Notes",
      type: "textarea",
      ...attributes,
    });
  }

  mediaConditionField(
    attributes: Partial<DiscogsCollectionField> = {},
  ): DiscogsCollectionField {
    return this.build({
      id: 1,
      name: "Media Condition",
      type: "dropdown",
      options: [...DISCOGS_CONDITION_OPTIONS],
      position: 1,
      ...attributes,
    });
  }

  sleeveConditionField(
    attributes: Partial<DiscogsCollectionField> = {},
  ): DiscogsCollectionField {
    return this.build({
      id: 2,
      name: "Sleeve Condition",
      type: "dropdown",
      options: [...DISCOGS_SLEEVE_CONDITION_OPTIONS],
      position: 2,
      ...attributes,
    });
  }
}

export const discogsCollectionFieldFactory =
  new DiscogsCollectionFieldFactory();
