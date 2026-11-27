import { CollectionHealth } from "src/components/Dashboard/CollectionHealth.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { CollectionHealth as CollectionHealthType } from "src/types/dashboard.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const buildHealthWithExactDuplicates = (): CollectionHealthType => {
  const sharedMasterId = 42_001;
  const releases = [
    releaseFactory.withDisplayDefaults({
      basic_information: {
        master_id: sharedMasterId,
        title: "Duplicate Pressing",
      },
    }),
    releaseFactory.withDisplayDefaults({
      basic_information: {
        master_id: sharedMasterId,
        title: "Duplicate Pressing Alt",
      },
    }),
  ];

  return {
    duplicateCount: 1,
    potentialDuplicates: 0,
    releasesWithoutRating: 0,
    duplicateGroups: [
      {
        key: `master_${sharedMasterId}`,
        type: "master_id",
        releases,
      },
    ],
  };
};

export type CollectionHealthRenderOptions = {
  health?: CollectionHealthType;
};

export class CollectionHealthPageObject extends BasePageObject {
  public testId = "fmdDuplicatesDetailModal";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  buildDefaultHealth(): CollectionHealthType {
    return buildHealthWithExactDuplicates();
  }

  renderCollectionHealth(
    options: CollectionHealthRenderOptions = {},
  ): RenderResult {
    const health = options.health ?? this.buildDefaultHealth();

    return render(<CollectionHealth health={health} />);
  }
}
