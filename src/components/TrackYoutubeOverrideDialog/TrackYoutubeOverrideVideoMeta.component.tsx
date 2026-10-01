"use client";

import classNames from "classnames";
import { useYoutubeOembedQuery } from "src/hooks/queries/useYoutubeOembedQuery";
import styles from "./TrackYoutubeOverrideVideoMeta.module.css";

type TrackYoutubeOverrideVideoMetaProps = {
  videoId: string | null;
  enabled: boolean;
};

const TrackYoutubeOverrideVideoMetaSkeleton = ({
  isBusy,
}: {
  isBusy: boolean;
}) => (
  <div
    className={styles.videoMetaSkeleton}
    data-testid="fmdTrackYoutubeOverrideVideoMetaSkeleton"
    aria-busy={isBusy}
    aria-hidden={!isBusy}
  >
    <div className={classNames(styles.skeletonBar, styles.skeletonTitleBar)} />
    <div className={classNames(styles.skeletonBar, styles.skeletonAuthorBar)} />
  </div>
);

export const TrackYoutubeOverrideVideoMeta = ({
  videoId,
  enabled,
}: TrackYoutubeOverrideVideoMetaProps) => {
  const { data, isFetching } = useYoutubeOembedQuery({
    videoId,
    enabled,
  });

  if (data) {
    return (
      <div
        className={styles.videoMeta}
        data-testid="fmdTrackYoutubeOverrideVideoMeta"
      >
        <p className={styles.videoMetaTitle}>{data.title}</p>
        <p className={styles.videoMetaAuthor}>{data.authorName}</p>
      </div>
    );
  }

  return (
    <TrackYoutubeOverrideVideoMetaSkeleton
      isBusy={Boolean(videoId && isFetching)}
    />
  );
};
