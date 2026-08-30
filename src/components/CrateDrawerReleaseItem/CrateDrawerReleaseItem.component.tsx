import classNames from "classnames";
import Image from "next/image";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseActions } from "src/components/CrateDrawerReleaseActions/CrateDrawerReleaseActions.component";
import styles from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.module.css";
import { TrackDjMetadataDisplay } from "src/components/TrackDjMetadata/TrackDjMetadataDisplay.component";
import type { DiscogsRelease } from "src/types";
import type { TrackDjMetadata } from "src/types/trackMetadata.types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";

interface CrateDrawerReleaseItemProps {
  release: DiscogsRelease;
  packed: boolean;
  showDjMetadata?: boolean;
  djMetadata?: TrackDjMetadata | null;
  isDjMetadataLoading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
  onPackedChange: (packed: boolean) => void;
  onRemove: (releaseId: string) => void;
}

export const CrateDrawerReleaseItem = ({
  release,
  packed,
  showDjMetadata = false,
  djMetadata,
  isDjMetadataLoading = false,
  onReleaseClick,
  onPackedChange,
  onRemove,
}: CrateDrawerReleaseItemProps) => {
  const { packedEnabled } = useCrateDrawerContext();
  const { basic_information } = release;
  const imageUrl = getReleaseImageUrl({
    thumb: basic_information.thumb,
    cover_image: basic_information.cover_image,
    width: 100,
    height: 100,
    preferCoverImage: true,
  });

  const handleActivate = () => {
    onReleaseClick?.(String(release.instance_id));
  };

  const artist = formatArtistNames(release);
  const meta = formatReleaseMetaLine({ release, includeCatno: false }) || null;

  return (
    <div
      className={classNames(styles.listItem, {
        [styles.listItemFound]: packedEnabled && packed,
        [styles.listItemWithDjMetadata]: showDjMetadata,
      })}
    >
      <button
        type="button"
        className={styles.listItemMain}
        onClick={handleActivate}
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
      {showDjMetadata ? (
        <TrackDjMetadataDisplay
          metadata={djMetadata}
          isLoading={isDjMetadataLoading}
          variant="crate"
          className={styles.djMetadata}
        />
      ) : null}
      <CrateDrawerReleaseActions
        packed={packed}
        releaseTitle={basic_information.title}
        onPackedChange={onPackedChange}
        onRemove={() => onRemove(String(release.instance_id))}
      />
    </div>
  );
};
