import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { ReleaseNote } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";

type ReleaseNoteFactoryOptions = Record<string, never>;

class ReleaseNoteFactory extends BaseFactory<
  ReleaseNote,
  ReleaseNoteFactoryOptions
> {
  build(
    attributes?: Partial<ReleaseNote>,
    _options?: ReleaseNoteFactoryOptions,
  ) {
    const instance = {
      field_id: faker.number.int({ min: 1, max: 10 }),
      value: faker.lorem.sentence(),
    } satisfies ReleaseNote;

    const factoryBuilt: ReleaseNote = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<ReleaseNote, typeof instance> =
      undefined;

    return factoryBuilt;
  }
}

export const releaseNoteFactory = new ReleaseNoteFactory();
