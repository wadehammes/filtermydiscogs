import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import type { CrateWithCount } from "src/types/crate.types";
import styles from "./CrateHubCard.module.css";

interface CrateHubCardProps {
  crate: CrateWithCount;
}

const getCollageSlots = (previewThumbs: string[]) => {
  if (previewThumbs.length >= 3) {
    return {
      left: previewThumbs[0],
      center: previewThumbs[1],
      right: previewThumbs[2],
    };
  }

  if (previewThumbs.length === 2) {
    return {
      left: previewThumbs[0],
      center: undefined,
      right: previewThumbs[1],
    };
  }

  if (previewThumbs.length === 1) {
    return {
      left: undefined,
      center: previewThumbs[0],
      right: undefined,
    };
  }

  return {
    left: undefined,
    center: undefined,
    right: undefined,
  };
};

export const CrateHubCard = ({ crate }: CrateHubCardProps) => {
  const previewThumbs = crate.previewThumbs ?? [];
  const slots = getCollageSlots(previewThumbs);
  const releaseCount = crate.releaseCount ?? 0;
  const hasVisual = previewThumbs.length > 0;

  return (
    <Link href={`/crates/${crate.id}`} className={styles.card}>
      <div
        className={classNames(styles.visual, {
          [styles.visualEmpty]: !hasVisual,
        })}
      >
        {hasVisual ? (
          <div
            className={classNames(styles.collage, {
              [styles.collageSingle]: previewThumbs.length === 1,
              [styles.collagePair]: previewThumbs.length === 2,
            })}
          >
            {slots.left ? (
              <Image
                src={slots.left}
                alt=""
                width={120}
                height={120}
                className={classNames(styles.cover, styles.coverLeft)}
                sizes="(max-width: 768px) 28vw, 120px"
              />
            ) : null}
            {slots.center ? (
              <Image
                src={slots.center}
                alt=""
                width={144}
                height={144}
                className={classNames(styles.cover, styles.coverCenter)}
                sizes="(max-width: 768px) 36vw, 144px"
              />
            ) : null}
            {slots.right ? (
              <Image
                src={slots.right}
                alt=""
                width={120}
                height={120}
                className={classNames(styles.cover, styles.coverRight)}
                sizes="(max-width: 768px) 28vw, 120px"
              />
            ) : null}
          </div>
        ) : (
          <div aria-hidden className={styles.emptyVisual}>
            <span className={styles.emptyGlyph} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className={styles.nameRow}>
            <h2 className={styles.name}>{crate.name}</h2>
            {crate.is_default ? (
              <span className={styles.defaultBadge}>Default</span>
            ) : null}
          </div>
          <p className={styles.meta}>
            {releaseCount} release{releaseCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
};
