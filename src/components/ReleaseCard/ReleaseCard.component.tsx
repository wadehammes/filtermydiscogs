import classNames from "classnames";
import { memo } from "react";
import { useCrate } from "src/context/crate.context";
import type { ReleaseCardProps } from "src/types";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardContent } from "./ReleaseCardContent.component";
import { ReleaseCardImage } from "./ReleaseCardImage.component";

const ReleaseCardComponent = ({
  release,
  isHighlighted = false,
  isRandomMode = false,
  onExitRandomMode,
}: ReleaseCardProps) => {
  const { isInCrate } = useCrate();

  const thumbUrl = getReleaseImageUrl({
    thumb: release.basic_information.thumb,
    cover_image: release.basic_information.cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  const releaseUrl = getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });

  const labelUrl = getResourceUrl({
    resourceUrl: release.basic_information.labels[0]?.resource_url,
    type: "label",
  });

  return release ? (
    <div
      className={classNames(styles.releaseCard, {
        [styles.highlighted as string]: isHighlighted,
        [styles.inCrate as string]: isInCrate(release.instance_id),
        [styles.randomMode as string]: isRandomMode,
      })}
    >
      <ReleaseCardImage
        release={release}
        thumbUrl={thumbUrl}
        resourceUrl={releaseUrl}
      />
      <ReleaseCardContent
        release={release}
        releaseUrl={releaseUrl}
        labelUrl={labelUrl}
        {...(onExitRandomMode && { onExitRandomMode })}
      />
    </div>
  ) : null;
};

export const ReleaseCard = memo(ReleaseCardComponent);
