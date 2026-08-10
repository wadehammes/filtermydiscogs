import classNames from "classnames";
import type { ReactNode } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { CrateSelector } from "src/components/CrateSelector/CrateSelector.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { definedProps } from "src/utils/definedProps";
import {
  CrateDrawerProvider,
  useCrateDrawerContext,
} from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerDialogs } from "./CrateDrawerDialogs.component";
import { CrateDrawerFooter } from "./CrateDrawerFooter.component";
import { CrateDrawerReleases } from "./CrateDrawerReleases.component";

interface CrateDrawerProps {
  isOpen: boolean;
  onReleaseClick?: (instanceId: string) => void;
  aboveMiniPlayer?: boolean;
}

interface CrateDrawerMobileProps {
  isOpen: boolean;
  aboveMiniPlayer: boolean;
  crateSelector: ReactNode;
  onClose: () => void;
}

const useShowPackingToolbar = () => {
  const { packedCount, packedEnabled } = useCrateDrawerContext();
  return packedEnabled && packedCount > 0;
};

const CrateDrawerMobile = ({
  isOpen,
  aboveMiniPlayer,
  crateSelector,
  onClose,
}: CrateDrawerMobileProps) => {
  const showPackingToolbar = useShowPackingToolbar();

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      closeButtonAriaLabel="Close crate drawer"
      contentClassName={
        showPackingToolbar ? styles.mobileDrawerContentFlushTop : undefined
      }
      headerContent={crateSelector}
      footer={<CrateDrawerFooter />}
      aboveMiniPlayer={aboveMiniPlayer}
    >
      <div className={styles.mobileContent}>
        <CrateDrawerReleases />
      </div>
    </BottomDrawer>
  );
};

interface CrateDrawerDesktopProps {
  crateSelector: ReactNode;
}

const CrateDrawerDesktop = ({ crateSelector }: CrateDrawerDesktopProps) => {
  const showPackingToolbar = useShowPackingToolbar();

  return (
    <div className={styles.drawer} data-crate-drawer-desktop>
      <div className={styles.header}>{crateSelector}</div>
      <div
        className={classNames(styles.content, {
          [styles.contentFlushTop]: showPackingToolbar,
        })}
      >
        <CrateDrawerReleases />
      </div>
      <CrateDrawerFooter />
    </div>
  );
};

export const CrateDrawer = ({
  isOpen,
  onReleaseClick,
  aboveMiniPlayer = false,
}: CrateDrawerProps) => {
  const { toggleDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const crateSelector = (
    <CrateSelector className={classNames(styles.headerCrateSelector)} />
  );

  return (
    <CrateDrawerProvider {...definedProps({ onReleaseClick })}>
      {isMobile ? (
        <CrateDrawerMobile
          isOpen={isOpen}
          aboveMiniPlayer={aboveMiniPlayer}
          crateSelector={crateSelector}
          onClose={toggleDrawer}
        />
      ) : (
        <CrateDrawerDesktop crateSelector={crateSelector} />
      )}

      <CrateDrawerDialogs />
    </CrateDrawerProvider>
  );
};
