import classNames from "classnames";
import Image from "next/image";
import { trackEvent } from "src/analytics/analytics";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import MinusIcon from "src/styles/icons/minus-solid.svg";
import PlusIcon from "src/styles/icons/plus-solid.svg";
import StarIcon from "src/styles/icons/star-solid.svg";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleaseCard.module.css";

interface ReleaseCardImageProps {
  release: DiscogsRelease;
  thumbUrl: string | null;
  resourceUrl: string | null;
}

export function ReleaseCardImage({
  release,
  thumbUrl,
  resourceUrl,
}: ReleaseCardImageProps) {
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

  return (
    <div
      className={styles.imageContainer}
      data-bg-image={thumbUrl || undefined}
      style={thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined}
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
      <div className={styles.actionButtonsContainer}>
        {resourceUrl && (
          <div className={styles.buttonWrapper}>
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.discogsButton}
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "home",
                  label: "Release Clicked",
                  value: resourceUrl,
                });
              }}
              aria-label="View on Discogs"
              title="View on Discogs"
            >
              <ExternalLinkIcon className={styles.externalLinkIcon} />
            </a>
            <span className={styles.tooltip}>View on Discogs</span>
          </div>
        )}
        <div className={styles.buttonWrapper}>
          <button
            type="button"
            className={classNames(
              styles.listButton,
              isInCrate(release.instance_id) && styles.removeButton,
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
              <MinusIcon className={styles.listButtonIcon} />
            ) : (
              <PlusIcon className={styles.listButtonIcon} />
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
  );
}
