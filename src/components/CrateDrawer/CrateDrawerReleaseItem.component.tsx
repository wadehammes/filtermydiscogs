import classNames from "classnames";
import Image from "next/image";
import type { DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerReleaseActions } from "./CrateDrawerReleaseActions.component";

interface CrateDrawerReleaseItemProps {
  release: DiscogsRelease;
  onReleaseClick?: (instanceId: string) => void;
  onRemove: (releaseId: string) => void;
}

export const CrateDrawerReleaseItem = ({
  release,
  onReleaseClick,
  onRemove,
}: CrateDrawerReleaseItemProps) => {
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
    <div className={styles.listItem}>
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
      <CrateDrawerReleaseActions
        releaseTitle={basic_information.title}
        onRemove={() => onRemove(String(release.instance_id))}
      />
    </div>
  );
};
