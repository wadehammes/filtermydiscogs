import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { discogsCollectionFieldFactory } from "src/tests/factories/DiscogsCollectionField.factory";
import type { DiscogsCollectionFieldsResponse } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";

type DiscogsCollectionFieldsResponseFactoryOptions = {
  fieldCount?: number;
};

class DiscogsCollectionFieldsResponseFactory extends BaseFactory<
  DiscogsCollectionFieldsResponse,
  DiscogsCollectionFieldsResponseFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsCollectionFieldsResponse>,
    options?: DiscogsCollectionFieldsResponseFactoryOptions,
  ) {
    const fieldCount =
      options?.fieldCount ?? faker.number.int({ min: 1, max: 4 });

    const instance = {
      fields: discogsCollectionFieldFactory.buildList(fieldCount),
    } satisfies DiscogsCollectionFieldsResponse;

    const factoryBuilt: DiscogsCollectionFieldsResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      DiscogsCollectionFieldsResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  forReleaseNotes(
    attributes: Partial<DiscogsCollectionFieldsResponse> = {},
  ): DiscogsCollectionFieldsResponse {
    return this.build({
      fields: [discogsCollectionFieldFactory.notesField()],
      ...attributes,
    });
  }
}

export const discogsCollectionFieldsResponseFactory =
  new DiscogsCollectionFieldsResponseFactory();
