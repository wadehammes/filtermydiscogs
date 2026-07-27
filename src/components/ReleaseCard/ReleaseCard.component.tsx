import classNames from "classnames";
import { memo } from "react";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { useCrate } from "src/context/crate.context";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { ReleaseCardProps } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardContent } from "./ReleaseCardContent.component";
import { ReleaseCardImage } from "./ReleaseCardImage.component";

const ReleaseCardComponent = ({
  release,
  isHighlighted = false,
  isRandomMode = false,
  onExitRandomMode,
  onReleaseClick,
}: ReleaseCardProps) => {
  const { isInCrate } = useCrate();
  const { openRelease, canOpen } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });

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
    <ReleaseNotesEditorProvider release={release}>
      <div
        className={classNames(styles.releaseCard, {
          [styles.highlighted]: isHighlighted,
          [styles.inCrate]: isInCrate(release.instance_id),
          [styles.randomMode]: isRandomMode,
        })}
        data-testid="fmdReleaseCard"
      >
        <ReleaseCardImage
          release={release}
          thumbUrl={thumbUrl}
          releaseUrl={releaseUrl}
          resourceUrl={release.basic_information.resource_url}
          {...definedProps({
            onReleaseOpen: canOpen ? openRelease : undefined,
          })}
        />
        <ReleaseCardContent
          release={release}
          releaseUrl={releaseUrl}
          labelUrl={labelUrl}
          {...definedProps({
            onExitRandomMode,
          })}
        />
      </div>
    </ReleaseNotesEditorProvider>
  ) : null;
};

export const ReleaseCard = memo(ReleaseCardComponent);
