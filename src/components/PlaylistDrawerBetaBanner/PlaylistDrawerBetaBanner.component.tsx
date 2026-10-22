"use client";

import classNames from "classnames";
import {
  BetaBanner,
  type BetaBannerProps,
} from "src/components/BetaBanner/BetaBanner.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./PlaylistDrawerBetaBanner.module.css";

export type PlaylistDrawerBetaBannerProps = Pick<
  BetaBannerProps,
  "onSubmitBugReport"
> & {
  inDrawerHeader?: boolean;
};

export const PlaylistDrawerBetaBanner = ({
  inDrawerHeader = false,
  onSubmitBugReport,
}: PlaylistDrawerBetaBannerProps) => (
  <BetaBanner
    bannerClassName={classNames(styles.banner, {
      [styles.bannerInDrawerHeader]: inDrawerHeader,
    })}
    leading="Playlists are in"
    testId="fmdPlaylistDrawerBetaBanner"
    {...definedProps({ onSubmitBugReport })}
  />
);
