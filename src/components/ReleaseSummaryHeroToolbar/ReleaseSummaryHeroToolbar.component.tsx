"use client";

import classNames from "classnames";
import { DiscogsReleaseExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { ModalToolbar } from "src/components/ModalToolbar/ModalToolbar.component";
import modalToolbarStyles from "src/components/ModalToolbar/ModalToolbar.module.css";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";

interface ReleaseSummaryHeroToolbarProps {
  release: DiscogsRelease;
  onClose?: () => void;
}

export const ReleaseSummaryHeroToolbar = ({
  release,
  onClose,
}: ReleaseSummaryHeroToolbarProps) => {
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
      <DiscogsReleaseExternalLink release={release} variant="toolbar" />
    </ModalToolbar>
  );
};
