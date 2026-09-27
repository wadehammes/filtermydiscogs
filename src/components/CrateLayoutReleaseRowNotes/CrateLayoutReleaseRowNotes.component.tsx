"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import classNames from "classnames";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import styles from "./CrateLayoutReleaseRowNotes.module.css";

interface CrateLayoutReleaseRowNotesProps {
  isDesktopLayout: boolean;
  release: DiscogsRelease;
}

export const CrateLayoutReleaseRowNotes = ({
  isDesktopLayout,
  release,
}: CrateLayoutReleaseRowNotesProps) => {
  if (isDesktopLayout) {
    return <ReleaseNotes release={release} variant="crate" />;
  }

  return (
    <Collapsible.Root
      className={styles.accordion}
      data-testid="fmdCrateLayoutReleaseRowNotes"
    >
      <Collapsible.Trigger
        className={classNames(textActionStyles.xsmuted, styles.toggle)}
      >
        + Add Release Notes
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.panel}>
        <ReleaseNotes release={release} variant="crate" />
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};
