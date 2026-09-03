import classNames from "classnames";
import type { DiscogsArtist } from "src/types";
import styles from "./ReleaseCardTitle.module.css";
import {
  ReleaseHeaderArtistLine,
  ReleaseHeaderTitle,
} from "./ReleaseHeaderLinks.component";

interface ReleaseCardTitleProps {
  artists: DiscogsArtist[];
  title: string;
  releaseUrl: string | null;
  className?: string | undefined;
}

export const ReleaseCardTitle = ({
  artists,
  title,
  releaseUrl,
  className,
}: ReleaseCardTitleProps) => {
  return (
    <div className={classNames(styles.titleGroup, className)}>
      <ReleaseHeaderArtistLine
        artists={artists}
        className={styles.artistLine}
      />
      <ReleaseHeaderTitle
        title={title}
        releaseUrl={releaseUrl}
        className={styles.releaseTitle}
      />
    </div>
  );
};
