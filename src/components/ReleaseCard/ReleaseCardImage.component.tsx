import Image from "next/image";
import { RELEASE_CARD_COVER_PX } from "src/constants/releaseCardCover.constants";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./ReleaseCard.module.css";

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

  const isPlaceholder = thumbUrl.startsWith("data:");

  return (
    <div className={styles.imageShell}>
      <div
        className={styles.imageContainer}
        {...definedProps(activateProps ?? {})}
      >
        {thumbUrl ? (
          <Image
            key={thumbUrl}
            src={thumbUrl}
            height={RELEASE_CARD_COVER_PX}
            width={RELEASE_CARD_COVER_PX}
            quality={85}
            unoptimized={isPlaceholder}
            alt={release.basic_information.title}
            {...(priority
              ? { priority: true, loading: "eager" as const }
              : { loading: "lazy" as const })}
            sizes={`${RELEASE_CARD_COVER_PX}px`}
          />
        ) : null}
      </div>
    </div>
  );
};
