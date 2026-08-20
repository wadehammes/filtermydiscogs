import styles from "./EmptyState.module.css";

export const EmptyState = () => {
  return (
    <div className={styles.emptyState}>
      <h2>No releases found</h2>
      <p>Try adjusting your filters to see more results.</p>
    </div>
  );
};
