import classNames from "classnames";
import Image from "next/image";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import StarIcon from "src/styles/icons/star-solid.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./ReleaseCard.module.css";

interface ReleaseCardImageProps {
  release: DiscogsRelease;
  thumbUrl: string | null;
  onReleaseOpen?: () => void;
}

export const ReleaseCardImage = ({
  release,
  thumbUrl,
  onReleaseOpen,
}: ReleaseCardImageProps) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const handleCrateToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCrate(release.instance_id)) {
      removeFromCrate(release.instance_id);
    } else {
      addToCrate(release);
      if (!isMobile) {
        openDrawer();
      }
    }
  };

  const activateProps = onReleaseOpen
    ? getReleaseActivateProps({
        onActivate: onReleaseOpen,
        ariaLabel: `Open ${release.basic_information.title} details`,
      })
    : undefined;

  return (
    <div className={styles.imageShell}>
      <div
        className={styles.imageContainer}
        data-bg-image={thumbUrl || undefined}
        style={thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined}
        {...definedProps(activateProps ?? {})}
      >
        {release.rating > 0 && (
          <div
            className={styles.ratingBadge}
            title={`Rating: ${release.rating}/5`}
          >
            <StarIcon className={styles.starIcon} />
            {release.rating}
          </div>
        )}
        {thumbUrl && (
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
        )}
      </div>
      <div className={styles.actionButtonsContainer}>
        <div
          className={classNames(
            segmentedStyles.container,
            styles.actionSegmented,
          )}
        >
          <ReleaseNotesCardAction />
          <div className={styles.segmentSlot}>
            <button
              type="button"
              className={classNames(
                segmentedStyles.segment,
                styles.actionSegment,
                {
                  [segmentedStyles.active]: isInCrate(release.instance_id),
                },
              )}
              onClick={handleCrateToggle}
              aria-label={
                isInCrate(release.instance_id)
                  ? "Remove from crate"
                  : "Add to crate"
              }
              title={
                isInCrate(release.instance_id)
                  ? "Remove from Crate"
                  : "Add to Crate"
              }
            >
              {isInCrate(release.instance_id) ? (
                <MinusIcon className={styles.actionIcon} />
              ) : (
                <PlusIcon className={styles.actionIcon} />
              )}
            </button>
            <span className={styles.tooltip}>
              {isInCrate(release.instance_id)
                ? "Remove from Crate"
                : "Add to Crate"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
