import Image from "next/image";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardOverlayActions } from "./ReleaseCardOverlayActions.component";

interface ReleaseCardImageProps {
  release: DiscogsRelease;
  thumbUrl: string | null;
  releaseUrl: string | null;
  resourceUrl: string | null;
  onReleaseOpen?: () => void;
}

export const ReleaseCardImage = ({
  release,
  thumbUrl,
  releaseUrl,
  resourceUrl,
  onReleaseOpen,
}: ReleaseCardImageProps) => {
  const activateProps = onReleaseOpen
    ? getReleaseActivateProps({
        onActivate: onReleaseOpen,
        ariaLabel: `Open release details for ${release.basic_information.title}`,
      })
    : undefined;

  return (
    <div className={styles.imageShell}>
      <div
        className={styles.imageContainer}
        {...definedProps(activateProps ?? {})}
      >
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            height={200}
            width={200}
            quality={85}
            alt={release.basic_information.title}
            loading="lazy"
            style={{
              position: "relative",
              zIndex: 2,
              filter: "none",
            }}
            sizes="(max-width: 1200px) 50vw, 33vw"
          />
        ) : null}
      </div>
      <div className={styles.actionButtonsContainer}>
        <ReleaseCardOverlayActions
          release={release}
          releaseUrl={releaseUrl}
          resourceUrl={resourceUrl}
          {...definedProps({ onReleaseOpen })}
        />
      </div>
    </div>
  );
};
