import classNames from "classnames";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import { MobileMenuFooterMoreMenu } from "src/components/StickyHeaderBar/MobileMenuFooterMoreMenu.component";
import GearIcon from "src/styles/icons/gear-thin.svg";
import menuStyles from "./MobileMenu.module.css";
import styles from "./MobileMenuDrawerFooter.module.css";

interface MobileMenuDrawerFooterProps {
  username: string | null;
  onLogout: () => void;
  onNavigate: () => void;
}

export const MobileMenuDrawerFooter = ({
  username,
  onLogout,
  onNavigate,
}: MobileMenuDrawerFooterProps) => {
  const segmentClassName = classNames(
    segmentedStyles.segment,
    styles.footerSegment,
  );

  return (
    <section className={menuStyles.menuAccountSection} aria-label="Account">
      {username ? (
        <p className={menuStyles.menuAccountLabel}>{username}</p>
      ) : null}
      <div className={styles.footerActions}>
        <SegmentedControl
          allowOverflow
          legend="Account actions"
          className={styles.footerSegmented}
        >
          <IconButtonLink
            internal
            href="/settings"
            className={segmentClassName}
            iconClassName={styles.footerSegmentIcon}
            label="Settings"
            onClick={onNavigate}
          >
            <GearIcon />
          </IconButtonLink>
          <MobileMenuFooterMoreMenu
            triggerClassName={segmentClassName}
            triggerIconClassName={styles.footerSegmentIcon}
            onLogout={onLogout}
            onNavigate={onNavigate}
          />
        </SegmentedControl>
      </div>
    </section>
  );
};
