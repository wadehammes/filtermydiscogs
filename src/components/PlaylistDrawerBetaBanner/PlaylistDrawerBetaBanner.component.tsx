"use client";

import {
  BetaBanner,
  type BetaBannerProps,
} from "src/components/BetaBanner/BetaBanner.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./PlaylistDrawerBetaBanner.module.css";

export type PlaylistDrawerBetaBannerProps = Pick<
  BetaBannerProps,
  "onSubmitBugReport"
>;

export const PlaylistDrawerBetaBanner = ({
  onSubmitBugReport,
}: PlaylistDrawerBetaBannerProps) => (
  <BetaBanner
    bannerClassName={styles.banner}
    leading="Playlists are in"
    testId="fmdPlaylistDrawerBetaBanner"
    {...definedProps({ onSubmitBugReport })}
  />
);
