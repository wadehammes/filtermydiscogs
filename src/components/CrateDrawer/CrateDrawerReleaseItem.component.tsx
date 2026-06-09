import classNames from "classnames";
import Image from "next/image";
import XIcon from "src/styles/icons/x.svg";
import type { DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import styles from "./CrateDrawer.module.css";

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

  return (
    // biome-ignore lint/a11y/useSemanticElements: Cannot use button here due to nested button (remove button)
    <div
      className={styles.listItem}
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
      <button
        type="button"
        className={styles.removeButton}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(String(release.instance_id));
        }}
        aria-label={`Remove ${basic_information.title} from crate`}
      >
        <XIcon className={styles.removeIcon} aria-hidden />
      </button>
    </div>
  );
};
