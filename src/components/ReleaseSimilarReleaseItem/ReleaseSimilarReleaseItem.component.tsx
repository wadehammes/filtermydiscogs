"use client";

import classNames from "classnames";
import Image from "next/image";
import type { MouseEvent } from "react";
import { useCallback } from "react";
import crateItemStyles from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css";
import { useCrate } from "src/context/crate.context";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import styles from "./ReleaseSimilarReleaseItem.module.css";

interface ReleaseSimilarReleaseItemProps {
  release: DiscogsRelease;
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseSimilarReleaseItem = ({
  release,
  onReleaseClick,
}: ReleaseSimilarReleaseItemProps) => {
  const { addToCrate, removeFromCrate, isInCrate } = useCrate();
  const { basic_information: basicInfo } = release;
  const inCrate = isInCrate(release.instance_id);
  const imageUrl = getReleaseImageUrl({
    thumb: basicInfo.thumb,
    cover_image: basicInfo.cover_image,
    width: 76,
    height: 76,
    preferCoverImage: true,
  });
  const artist = formatArtistNames(release);
  const meta = formatReleaseMetaLine({ release, includeCatno: false });
  const { openRelease } = useReleaseOpenHandler({ release, onReleaseClick });

  const handleCrateToggle = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (inCrate) {
        removeFromCrate(release.instance_id);
        return;
      }

      addToCrate(release);
    },
    [addToCrate, inCrate, release, removeFromCrate],
  );

  return (
    <div
      className={classNames(crateItemStyles.listItem, styles.listItem, {
        [styles.listItemInCrate]: inCrate,
      })}
      data-testid="fmdReleaseSimilarItem"
    >
      <button
        type="button"
        className={classNames(
          crateItemStyles.listItemMain,
          styles.listItemMain,
        )}
        onClick={openRelease}
        aria-label={`Open ${basicInfo.title} details`}
      >
        <div
          className={classNames(crateItemStyles.itemImage, styles.itemImage)}
        >
          <Image
            src={imageUrl}
            height={76}
            width={76}
            quality={100}
            alt={basicInfo.title}
            loading="lazy"
            sizes="76px"
          />
        </div>
        <div
          className={classNames(
            crateItemStyles.itemContent,
            styles.itemContent,
          )}
        >
          <span
            className={classNames(
              "typography-span",
              crateItemStyles.itemArtist,
            )}
          >
            {artist}
          </span>
          <span
            className={classNames("typography-span", crateItemStyles.itemTitle)}
          >
            {basicInfo.title}
          </span>
          {meta ? (
            <span
              className={classNames(
                "typography-span",
                crateItemStyles.itemLabel,
              )}
            >
              {meta}
            </span>
          ) : null}
        </div>
      </button>
      <div
        className={classNames(
          crateItemStyles.listItemActions,
          styles.listItemActions,
        )}
      >
        <div className={stackStyles.overlayActions}>
          <div className={stackStyles.overlayActionSlot}>
            <button
              type="button"
              className={classNames(stackStyles.overlayAction, {
                [stackStyles.overlayActionActive]: inCrate,
              })}
              onClick={handleCrateToggle}
              aria-pressed={inCrate}
              aria-label={
                inCrate
                  ? `Remove ${basicInfo.title} from crate`
                  : `Add ${basicInfo.title} to crate`
              }
              title={inCrate ? "Remove from crate" : "Add to crate"}
            >
              {inCrate ? (
                <MinusIcon className={stackStyles.actionIcon} aria-hidden />
              ) : (
                <PlusIcon className={stackStyles.actionIcon} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
