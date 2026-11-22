import { RELEASE_CARD_COVER_PX } from "src/constants/releaseCardCover.constants";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardCoverMedia } from "./ReleaseCardCoverMedia.component";

interface ReleaseCardImageProps {
  release: DiscogsRelease;
  thumbUrl: string;
  onReleaseOpen?: () => void;
  onReleasePrefetch?: () => void;
  priority?: boolean;
}

export const ReleaseCardImage = ({
  release,
  thumbUrl,
  onReleaseOpen,
  onReleasePrefetch,
  priority = false,
}: ReleaseCardImageProps) => {
  const activateProps = onReleaseOpen
    ? getReleaseActivateProps({
        onActivate: onReleaseOpen,
        ariaLabel: `Open release details for ${release.basic_information.title}`,
        ...(onReleasePrefetch ? { onFocus: onReleasePrefetch } : {}),
      })
    : undefined;

  return (
    <div className={styles.imageShell}>
      <div
        className={styles.imageContainer}
        {...definedProps(activateProps ?? {})}
      >
        <ReleaseCardCoverMedia
          thumbUrl={thumbUrl}
          title={release.basic_information.title}
          sizePx={RELEASE_CARD_COVER_PX}
          priority={priority}
          placeholderClassName={styles.coverPlaceholder}
          sizes={`${RELEASE_CARD_COVER_PX}px`}
        />
      </div>
    </div>
  );
};
