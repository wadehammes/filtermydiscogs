import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import styles from "./CollectionSidePanelPlaceholder.module.css";

export const CollectionSidePanelPlaceholder = () => {
  return (
    <div
      className={styles.drawer}
      data-testid="fmdCollectionSidePanelPlaceholder"
    >
      <div className={styles.header} aria-hidden />
      <div className={styles.body}>
        <PageLoader message="Loading..." />
      </div>
    </div>
  );
};
