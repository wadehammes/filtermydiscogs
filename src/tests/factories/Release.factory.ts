import { faker } from "@faker-js/faker";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseNoteFactory } from "src/tests/factories/ReleaseNote.factory";
import type { DiscogsRelease, ReleaseNote } from "src/types";

type ReleaseFactoryOptions = {
  artistCount?: number;
  labelCount?: number;
  formatCount?: number;
  styleCount?: number;
};

class ReleaseFactory extends BaseFactory<
  DiscogsRelease,
  ReleaseFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsRelease>,
    options?: ReleaseFactoryOptions,
  ): DiscogsRelease {
    const instance = {
      instance_id: faker.string.uuid(),
      date_added: faker.date.past().toISOString(),
      rating: faker.number.int({ min: 0, max: 5 }),
      basic_information: basicInformationFactory.build({}, options),
      notes: releaseNoteFactory.buildList(faker.number.int({ min: 0, max: 2 })),
    } satisfies DiscogsRelease;

    const factoryBuilt: DiscogsRelease = {
      ...instance,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }

  withDisplayDefaults(
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        title: "Test Album",
        artists: [artistFactory.build({ name: "Test Artist" })],
        year: 2020,
        labels: [labelFactory.build({ name: "Test Label" })],
      }),
      notes: [],
      ...attributes,
    });
  }

  withDateAdded(
    dateAdded: string,
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.build({
      date_added: dateAdded,
      basic_information: basicInformationFactory.build(),
      ...attributes,
    });
  }

  withStyles(
    styles: string[],
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({ styles }),
      ...attributes,
    });
  }

  withNamedFormats(
    formatNames: string[],
    attributes: Partial<DiscogsRelease> = {},
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
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        resource_url: `https://api.discogs.com/releases/${releaseId}`,
      }),
      ...attributes,
    });
  }

  withTitle(
    title: string,
    releaseId: number | string,
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.build({
      basic_information: basicInformationFactory.build({
        title,
        resource_url: `https://api.discogs.com/releases/${releaseId}`,
      }),
      ...attributes,
    });
  }

  withCoverImage(
    coverImage: string,
    thumb: string,
    attributes: Partial<DiscogsRelease> = {},
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
    attributes: Partial<DiscogsRelease> = {},
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
    attributes: Partial<DiscogsRelease> = {},
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
    attributes: Partial<DiscogsRelease> = {},
  ): DiscogsRelease {
    return this.withResourceUrl(releaseId, {
      basic_information: basicInformationFactory.build({
        id: releaseId,
        resource_url: `https://api.discogs.com/releases/${releaseId}`,
      }),
      ...attributes,
    });
  }
}

export const releaseFactory = new ReleaseFactory();
