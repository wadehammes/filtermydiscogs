"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseActions } from "src/components/CrateDrawerReleaseActions/CrateDrawerReleaseActions.component";
import styles from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";

interface CrateDrawerReleaseItemProps {
  release: DiscogsRelease;
  packed: boolean;
  onReleaseClick?: (instanceId: string) => void;
  onPackedChange: (packed: boolean) => void;
  onRemove: (releaseId: string) => void;
}

export const CrateDrawerReleaseItem = ({
  release,
  packed,
  onReleaseClick,
  onPackedChange,
  onRemove,
}: CrateDrawerReleaseItemProps) => {
  const { packedEnabled } = useCrateDrawerContext();
  const { basic_information } = release;
  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseOpenHandler({
      release,
      onReleaseClick,
    });
  const imageUrl = getReleaseImageUrl({
    thumb: basic_information.thumb,
    cover_image: basic_information.cover_image,
    width: 100,
    height: 100,
    preferCoverImage: true,
  });

  const artist = formatArtistNames(release);
  const meta = formatReleaseMetaLine({ release, includeCatno: false }) || null;

  return (
    <div
      className={classNames(styles.listItem, {
        [styles.listItemFound]: packedEnabled && packed,
      })}
      data-testid="fmdCrateDrawerReleaseItem"
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <button
        type="button"
        className={styles.listItemMain}
        onClick={openRelease}
        {...definedProps(canOpen ? { onFocus: prefetchReleaseOpen } : {})}
      >
        <div className={styles.itemImage}>
          <Image
            src={imageUrl}
            height={100}
            width={100}
            quality={100}
            alt={basic_information.title}
            loading="lazy"
            sizes="100px"
          />
        </div>
        <div className={styles.itemContent}>
          <span className={classNames("typography-span", styles.itemArtist)}>
            {artist}
          </span>
          <span className={classNames("typography-span", styles.itemTitle)}>
            {basic_information.title}
          </span>
          {meta ? (
            <span className={classNames("typography-span", styles.itemLabel)}>
              {meta}
            </span>
          ) : null}
        </div>
      </button>
      <CrateDrawerReleaseActions
        packed={packed}
        releaseTitle={basic_information.title}
        onPackedChange={onPackedChange}
        onRemove={() => onRemove(String(release.instance_id))}
      />
    </div>
  );
};
