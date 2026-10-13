import { faker } from "@faker-js/faker";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseNoteFactory } from "src/tests/factories/ReleaseNote.factory";
import type {
  DiscogsBasicInformation,
  DiscogsRelease,
  ReleaseNote,
} from "src/types";

export type ReleaseFactoryAttributes = Omit<
  Partial<DiscogsRelease>,
  "basic_information"
> & {
  basic_information?: Partial<DiscogsBasicInformation>;
};

type ReleaseFactoryOptions = {
  artistCount?: number;
  labelCount?: number;
  formatCount?: number;
  styleCount?: number;
};

class ReleaseFactory extends BaseFactory<
  DiscogsRelease,
  ReleaseFactoryOptions,
  unknown,
  ReleaseFactoryAttributes
> {
  build(
    attributes?: ReleaseFactoryAttributes,
    options?: ReleaseFactoryOptions,
  ): DiscogsRelease {
    const instance = {
      instance_id: faker.string.uuid(),
      date_added: faker.date.past().toISOString(),
      rating: faker.number.int({ min: 0, max: 5 }),
      basic_information: basicInformationFactory.build({}, options),
      notes: releaseNoteFactory.buildList(faker.number.int({ min: 0, max: 2 })),
    } satisfies DiscogsRelease;

    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes ?? {};

    const factoryBuilt: DiscogsRelease = {
      ...instance,
      ...releaseOverrides,
      ...(basicInformationOverrides !== undefined
        ? {
            basic_information: basicInformationFactory.build(
              basicInformationOverrides,
              options,
            ),
          }
        : {}),
    };

    return factoryBuilt;
  }

  withDisplayDefaults(
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes;

    return this.build({
      notes: [],
      ...releaseOverrides,
      basic_information: basicInformationFactory.build({
        title: "Test Album",
        artists: [artistFactory.build({ name: "Test Artist" })],
        year: 2020,
        labels: [labelFactory.build({ name: "Test Label" })],
        ...(basicInformationOverrides ?? {}),
      }),
    });
  }

  withDateAdded(
    dateAdded: string,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    return this.build({
      date_added: dateAdded,
      basic_information: basicInformationFactory.build(),
      ...attributes,
    });
  }

  withStyles(
    styles: string[],
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes;

    return this.build({
      ...releaseOverrides,
      basic_information: basicInformationFactory.build({
        styles,
        ...(basicInformationOverrides ?? {}),
      }),
    });
  }

  withNamedFormats(
    formatNames: string[],
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        formats: formatNames.map((name) => formatFactory.build({ name })),
      }),
      ...attributes,
    });
  }

  withResourceUrl(
    releaseId: number | string,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes;

    return this.build({
      ...releaseOverrides,
      basic_information: basicInformationFactory.build({
        resource_url: `https://api.discogs.com/releases/${releaseId}`,
        ...(basicInformationOverrides ?? {}),
      }),
    });
  }

  withTitle(
    title: string,
    releaseId: number | string,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes;

    return this.build({
      ...releaseOverrides,
      basic_information: basicInformationFactory.build({
        title,
        resource_url: `https://api.discogs.com/releases/${releaseId}`,
        ...(basicInformationOverrides ?? {}),
      }),
    });
  }

  withCoverImage(
    coverImage: string,
    thumb: string,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        cover_image: coverImage,
        thumb,
      }),
      ...attributes,
    });
  }

  withThumbOnly(
    thumb: string,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        thumb,
        cover_image: "",
      }),
      ...attributes,
    });
  }

  withNotes(
    notes: ReleaseNote[],
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    return this.build({
      notes,
      ...attributes,
    });
  }

  withEmptyNotes(attributes: Partial<DiscogsRelease> = {}): DiscogsRelease {
    return this.build({
      notes: [],
      ...attributes,
    });
  }

  forNotesEditor(
    releaseId = 12345,
    attributes: ReleaseFactoryAttributes = {},
  ): DiscogsRelease {
    const {
      basic_information: basicInformationOverrides,
      ...releaseOverrides
    } = attributes;

    return this.withResourceUrl(releaseId, {
      ...releaseOverrides,
      basic_information: basicInformationFactory.build({
        id: releaseId,
        ...(basicInformationOverrides ?? {}),
      }),
    });
  }
}

export const releaseFactory = new ReleaseFactory();
