"use client";

import {
  BetaBanner,
  type BetaBannerProps,
} from "src/components/BetaBanner/BetaBanner.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateLayoutBetaBanner.module.css";

export type CrateLayoutBetaBannerProps = Pick<
  BetaBannerProps,
  "onSubmitBugReport"
>;

export const CrateLayoutBetaBanner = ({
  onSubmitBugReport,
}: CrateLayoutBetaBannerProps) => (
  <BetaBanner
    bannerClassName={styles.banner}
    leading="Crate layout and sections are in"
    testId="fmdCrateLayoutBetaBanner"
    {...definedProps({ onSubmitBugReport })}
  />
);
