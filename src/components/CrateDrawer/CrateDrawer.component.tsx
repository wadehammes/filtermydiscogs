import Image from "next/image";
import Button from "src/components/Button/Button.component";
import { useCrate } from "src/context/crate.context";
import styles from "./CrateDrawer.module.css";

interface CrateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReleaseClick?: (instanceId: string) => void;
}

const CrateDrawerComponent = ({
  isOpen,
  onClose,
  onReleaseClick,
}: CrateDrawerProps) => {
  const { selectedReleases, removeFromCrate, clearCrate } = useCrate();

  return (
    <>
      {isOpen && (
        <button
          className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
          onClick={onClose}
          type="button"
        />
      )}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>My Crate ({selectedReleases.length})</h2>
          <div className={styles.headerActions}>
            {selectedReleases.length > 0 && (
              <Button variant="danger" size="sm" onPress={clearCrate}>
                Clear All
              </Button>
            )}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close drawer"
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {selectedReleases.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No releases added to your crate yet.</p>
              <p>Click the + button on any release to add it here.</p>
            </div>
          ) : (
            <div className={styles.releasesList}>
              {selectedReleases.map((release) => {
                const { basic_information } = release;
                const thumbUrl =
                  basic_information.thumb ||
                  "https://placehold.jp/effbf2/000/150x150.png?text=%F0%9F%98%B5";

                const _handleReleaseClick = () => {
                  if (onReleaseClick) {
                    onReleaseClick(release.instance_id);
                  }
                };

                return (
                  <a
                    key={release.instance_id}
                    className={styles.listItem}
                    href={`#release-${release.instance_id}`}
                  >
                    <div className={styles.itemImage}>
                      <Image
                        src={thumbUrl}
                        height={60}
                        width={60}
                        quality={100}
                        alt={basic_information.title}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.itemContent}>
                      <span
                        className={`typography-span ${styles.itemTitle || ""}`}
                      >
                        {basic_information.title}
                      </span>
                      <span
                        className={`typography-span ${styles.itemArtist || ""}`}
                      >
                        {basic_information.artists
                          .map((artist) => artist.name)
                          .join(", ")}
                      </span>
                      <span
                        className={`typography-span ${styles.itemLabel || ""}`}
                      >
                        {basic_information.labels[0]?.name} —{" "}
                        {basic_information.year}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromCrate(release.instance_id);
                      }}
                      aria-label={`Remove ${basic_information.title} from crate`}
                    >
                      ×
                    </button>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const CrateDrawer = CrateDrawerComponent;
export default CrateDrawer;
