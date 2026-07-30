import classNames from "classnames";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { CrateSelector } from "src/components/CrateSelector/CrateSelector.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { definedProps } from "src/utils/definedProps";
import { CrateDrawerProvider } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerDialogs } from "./CrateDrawerDialogs.component";
import { CrateDrawerFooter } from "./CrateDrawerFooter.component";
import { CrateDrawerReleases } from "./CrateDrawerReleases.component";

interface CrateDrawerProps {
  isOpen: boolean;
  onReleaseClick?: (instanceId: string) => void;
  aboveMiniPlayer?: boolean;
}

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
        <BottomDrawer
          isOpen={isOpen}
          onClose={toggleDrawer}
          closeButtonAriaLabel="Close crate drawer"
          headerContent={crateSelector}
          footer={<CrateDrawerFooter />}
          aboveMiniPlayer={aboveMiniPlayer}
        >
          <div className={styles.content}>
            <CrateDrawerReleases />
          </div>
        </BottomDrawer>
      ) : (
        <div className={styles.drawer} data-crate-drawer-desktop>
          <div className={styles.header}>{crateSelector}</div>
          <div className={styles.content}>
            <CrateDrawerReleases />
          </div>
          <CrateDrawerFooter />
        </div>
      )}

      <CrateDrawerDialogs />
    </CrateDrawerProvider>
  );
};
