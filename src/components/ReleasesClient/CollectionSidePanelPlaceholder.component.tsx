import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import styles from "./CollectionSidePanelPlaceholder.module.css";

export const CollectionSidePanelPlaceholder = () => {
  return (
    <div
      className={classNames(skeletonPulseStyles.pulsesurface, styles.root)}
      data-testid="fmdCollectionSidePanelPlaceholder"
      aria-hidden
    />
  );
};
