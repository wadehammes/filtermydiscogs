import classNames from "classnames";
import Image from "next/image";
import type { DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerReleaseActions } from "./CrateDrawerReleaseActions.component";

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

  return (
    // biome-ignore lint/a11y/useSemanticElements: row opens modal; action column holds separate buttons
    <div
      className={classNames(styles.listItem, {
        [styles.listItemFound]: packedEnabled && packed,
      })}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
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
          {basic_information.artists.map((artist) => artist.name).join(", ")}
        </span>
        <span className={classNames("typography-span", styles.itemTitle)}>
          {basic_information.title}
        </span>
        <span className={classNames("typography-span", styles.itemLabel)}>
          {basic_information.labels[0]?.name} &bull; {basic_information.year}
        </span>
      </div>
      <CrateDrawerReleaseActions
        packed={packed}
        releaseTitle={basic_information.title}
        onPackedChange={onPackedChange}
        onRemove={() => onRemove(String(release.instance_id))}
      />
    </div>
  );
};
