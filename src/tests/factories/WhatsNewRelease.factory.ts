import { faker } from "@faker-js/faker";
import type {
  WhatsNewBullet,
  WhatsNewBulletBadge,
  WhatsNewRelease,
} from "src/constants/whatsNew.constants";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";

const WHATS_NEW_BADGES: WhatsNewBulletBadge[] = [
  "new",
  "fixed",
  "improved",
  "removed",
];

type WhatsNewFactoryOptions = Record<string, never>;

class WhatsNewBulletFactory extends BaseFactory<
  WhatsNewBullet,
  WhatsNewFactoryOptions
> {
  build(
    attributes?: Partial<WhatsNewBullet>,
    _options?: WhatsNewFactoryOptions,
  ): WhatsNewBullet {
    const instance = {
      id: faker.string.alphanumeric(12),
      badge: faker.helpers.arrayElement(WHATS_NEW_BADGES),
      text: faker.lorem.sentence(),
    } satisfies WhatsNewBullet;

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      WhatsNewBullet,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

class WhatsNewReleaseFactory extends BaseFactory<
  WhatsNewRelease,
  WhatsNewFactoryOptions
> {
  build(
    attributes?: Partial<WhatsNewRelease>,
    _options?: WhatsNewFactoryOptions,
  ): WhatsNewRelease {
    const instance = {
      version: `v${faker.date.past({ years: 1 }).toISOString().slice(0, 10)}`,
      highlights: [whatsNewBulletFactory.build()],
    } satisfies WhatsNewRelease;

    const factoryBuilt: WhatsNewRelease = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      WhatsNewRelease,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const whatsNewBulletFactory = new WhatsNewBulletFactory();
export const whatsNewReleaseFactory = new WhatsNewReleaseFactory();

export const whatsNewModalTestCopy = {
  latestVersion: "v2026.11.28",
  priorVersion: "v2026.11.27",
  latestImprovedBulletText:
    "Mobile collection and workspace pages: the playback dock scrolls with your releases instead of sitting in a fixed overlay at the bottom of the screen.",
  priorHighlightText: "Prior release highlight for modal tests.",
} as const;

export const buildWhatsNewModalTestReleases =
  (): readonly WhatsNewRelease[] => [
    whatsNewReleaseFactory.build({
      version: whatsNewModalTestCopy.latestVersion,
      highlights: [
        whatsNewBulletFactory.build({
          id: "mobile-dock-in-scroll",
          badge: "improved",
          text: whatsNewModalTestCopy.latestImprovedBulletText,
        }),
      ],
    }),
    whatsNewReleaseFactory.build({
      version: whatsNewModalTestCopy.priorVersion,
      highlights: [
        whatsNewBulletFactory.build({
          id: "prior-release",
          badge: "new",
          text: whatsNewModalTestCopy.priorHighlightText,
        }),
      ],
    }),
  ];
