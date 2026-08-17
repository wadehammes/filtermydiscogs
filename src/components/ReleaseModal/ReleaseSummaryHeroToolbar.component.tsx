"use client";

import classNames from "classnames";
import { useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import {
  ModalToolbar,
  ModalToolbarAction,
  ModalToolbarLink,
} from "src/components/shared/ModalToolbar/ModalToolbar.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseSummaryHero.module.css";

interface ReleaseSummaryHeroToolbarProps {
  release: DiscogsRelease;
  onClose?: () => void;
}

export const ReleaseSummaryHeroToolbar = ({
  release,
  onClose,
}: ReleaseSummaryHeroToolbarProps) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const inCrate = isInCrate(release.instance_id);
  const releaseUrl = getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });

  const handleCrateToggle = useCallback(() => {
    if (inCrate) {
      removeFromCrate(release.instance_id);
      return;
    }

    addToCrate(release);
    if (!isMobile) {
      openDrawer();
    }
  }, [addToCrate, inCrate, isMobile, openDrawer, release, removeFromCrate]);

  return (
    <ModalToolbar {...definedProps({ onClose })}>
      <ModalToolbarAction
        className={classNames({
          [styles.crateButtonActive]: inCrate,
        })}
        onClick={handleCrateToggle}
        aria-label={inCrate ? "Remove from crate" : "Add to crate"}
        title={inCrate ? "Remove from Crate" : "Add to Crate"}
      >
        {inCrate ? (
          <MinusIcon className={styles.actionIcon} aria-hidden />
        ) : (
          <PlusIcon className={styles.actionIcon} aria-hidden />
        )}
      </ModalToolbarAction>
      {releaseUrl ? (
        <ModalToolbarLink
          href={releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Discogs"
          title="View on Discogs"
          onClick={() => {
            trackEvent("releaseClicked", {
              action: "releaseClicked",
              category: "releaseModal",
              label: "View on Discogs",
              value: releaseUrl,
            });
          }}
        >
          <ExternalLinkIcon className={styles.actionIcon} aria-hidden />
        </ModalToolbarLink>
      ) : null}
    </ModalToolbar>
  );
};
