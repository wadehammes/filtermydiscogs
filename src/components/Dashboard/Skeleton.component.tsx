import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import styles from "./Skeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;
const HORIZONTAL_BAR_WIDTHS = [92, 78, 65, 54, 48, 40, 34, 28];

export const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div
        className={classNames(
          styles.skeletonText,
          styles.skeletonTextSm,
          pulseSurface,
        )}
      />
      <div
        className={classNames(
          styles.skeletonText,
          styles.skeletonTextMd,
          pulseSurface,
        )}
      />
      <div
        className={classNames(
          styles.skeletonText,
          styles.skeletonTextLg,
          pulseSurface,
        )}
      />
    </div>
  );
};

export const SkeletonGrowthChart = () => {
  return (
    <div className={styles.skeletonChart}>
      <div className={classNames(styles.skeletonTitle, pulseSurface)} />
      <div className={classNames(styles.skeletonChartBody, pulseSurface)} />
    </div>
  );
};

export const SkeletonBarChart = () => {
  return (
    <div className={styles.skeletonChart}>
      <div className={classNames(styles.skeletonTitle, pulseSurface)} />
      <div className={classNames(styles.skeletonChartBody, pulseSurface)} />
    </div>
  );
};

export const SkeletonHorizontalBarChart = () => {
  return (
    <div className={styles.skeletonChart}>
      <div className={classNames(styles.skeletonTitle, pulseSurface)} />
      <div className={styles.skeletonHorizontalBars}>
        {HORIZONTAL_BAR_WIDTHS.map((width) => (
          <div className={styles.skeletonHorizontalBarRow} key={width}>
            <div
              className={classNames(
                styles.skeletonHorizontalBarLabel,
                pulseSurface,
              )}
            />
            <div
              className={classNames(styles.skeletonHorizontalBar, pulseSurface)}
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonPieChart = () => {
  return (
    <div className={styles.skeletonChart}>
      <div className={classNames(styles.skeletonTitle, pulseSurface)} />
      <div className={styles.skeletonPieBody}>
        <div className={classNames(styles.skeletonCircle, pulseSurface)} />
        <div className={styles.skeletonLegend}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className={classNames(styles.skeletonLegendItem, pulseSurface)}
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <div className={styles.skeletonChart}>
      <div className={classNames(styles.skeletonTitle, pulseSurface)} />
      <div className={styles.skeletonList}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            className={classNames(styles.skeletonListItem, pulseSurface)}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};
