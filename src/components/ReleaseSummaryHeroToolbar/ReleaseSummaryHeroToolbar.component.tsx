"use client";

import classNames from "classnames";
import {
  ModalToolbar,
  ModalToolbarLink,
} from "src/components/ModalToolbar/ModalToolbar.component";
import modalToolbarStyles from "src/components/ModalToolbar/ModalToolbar.module.css";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import styles from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.module.css";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";

interface ReleaseSummaryHeroToolbarProps {
  release: DiscogsRelease;
  onClose?: () => void;
}

export const ReleaseSummaryHeroToolbar = ({
  release,
  onClose,
}: ReleaseSummaryHeroToolbarProps) => {
  const releaseUrl = getResourceUrl({
    resourceUrl: release.basic_information.resource_url,
    type: "release",
  });

  return (
    <ModalToolbar {...definedProps({ onClose })}>
      <ReleaseCrateMenu
        release={release}
        triggerVariant="custom"
        actionClass={(active) =>
          classNames(modalToolbarStyles.actionButton, {
            [modalToolbarStyles.actionButtonActive]: active,
          })
        }
      />
      {releaseUrl ? (
        <ModalToolbarLink
          href={releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Discogs"
          title="View on Discogs"
          onClick={() => {}}
        >
          <ExternalLinkIcon className={styles.actionIcon} aria-hidden />
        </ModalToolbarLink>
      ) : null}
    </ModalToolbar>
  );
};
