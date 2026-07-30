import classNames from "classnames";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import buttonStyles from "src/components/Button/Button.module.css";
import EditIcon from "src/styles/icons/edit-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";

export const CrateDrawerFooter = () => {
  const {
    activeCrateId,
    isDeletingCrate,
    isUpdatingCrate,
    selectedReleases,
    setShowClearDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.footer}>
      <div className={styles.footerActionsRow}>
        {activeCrateId ? (
          <Link
            href={`/crates/${activeCrateId}`}
            className={classNames(
              buttonStyles.button,
              buttonStyles.secondary,
              buttonStyles.sm,
              styles.openCrateLink,
            )}
          >
            <span className={styles.footerSegmentIcon} aria-hidden>
              <EditIcon />
            </span>
            View/Edit Crate
          </Link>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          className={styles.emptyCrateButton}
          onPress={() => setShowClearDialog(true)}
          disabled={releaseCount === 0 || isBusy}
        >
          <span className={styles.footerSegmentIcon} aria-hidden>
            <TrashOpenIcon />
          </span>
          Empty
        </Button>
      </div>
    </div>
  );
};
