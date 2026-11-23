import type { validateReleaseDataForStorage } from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";

type ReleaseValidationSuccess = Extract<
  ReturnType<typeof validateReleaseDataForStorage>,
  { release: DiscogsRelease }
>;

type ReleaseValidationFailure = Extract<
  ReturnType<typeof validateReleaseDataForStorage>,
  { error: string }
>;

export const releaseValidationResultFactory = {
  success(
    release: DiscogsRelease,
    attributes?: Partial<DiscogsRelease>,
  ): ReleaseValidationSuccess {
    return {
      release: {
        ...release,
        ...attributes,
      },
    };
  },
  failure(error: string): ReleaseValidationFailure {
    return { error };
  },
};
