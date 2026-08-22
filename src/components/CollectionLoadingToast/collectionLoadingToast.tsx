import { toast } from "sonner";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { isLargeCollection } from "src/constants/collection";
import type { DiscogsCollection } from "src/types";
import { readStoredCollectionItemCount } from "src/utils/collectionItemCountStorage";

export const COLLECTION_LOADING_TOAST_ID = "collection-loading";

export function resolveCollectionTotalItems(
  username: string | null | undefined,
  collection: DiscogsCollection | null,
): number | null {
  const items = collection?.pagination?.items;
  if (typeof items === "number" && Number.isFinite(items) && items >= 0) {
    return items;
  }

  if (username) {
    return readStoredCollectionItemCount(username);
  }

  return null;
}

export function formatLargeCollectionLoadingTitle(totalItems: number): string {
  return `Loading ${totalItems.toLocaleString()} releases from Discogs…`;
}

export function formatLargeCollectionLoadingProgress(
  loadedCount: number,
  totalItems: number,
): string {
  return `${loadedCount.toLocaleString()} of ${totalItems.toLocaleString()} loaded`;
}

function CollectionLoadingToastDescription({
  loadedCount,
  totalItems,
}: {
  loadedCount: number;
  totalItems: number;
}) {
  return (
    <div className="fmd-collection-loading-toast-description">
      {loadedCount > 0 ? (
        <p className="fmd-collection-loading-toast-progress">
          {formatLargeCollectionLoadingProgress(loadedCount, totalItems)}
        </p>
      ) : null}
      <p className="fmd-collection-loading-toast-hint">
        May take a minute or two.
      </p>
    </div>
  );
}

export interface ShowCollectionLoadingToastParams {
  loadedCount: number;
  totalItems: number;
}

export const showCollectionLoadingToast = ({
  loadedCount,
  totalItems,
}: ShowCollectionLoadingToastParams) => {
  if (!isLargeCollection(totalItems)) {
    return;
  }

  const title = formatLargeCollectionLoadingTitle(totalItems);

  toast.loading(title, {
    id: COLLECTION_LOADING_TOAST_ID,
    duration: Number.POSITIVE_INFINITY,
    position: "bottom-center",
    description: (
      <CollectionLoadingToastDescription
        loadedCount={loadedCount}
        totalItems={totalItems}
      />
    ),
    icon: <Spinner size="md" aria-label={title} />,
    classNames: {
      toast: "fmd-toast fmd-collection-loading-toast",
      title: "fmd-toast-title",
      description: "fmd-toast-description",
      icon: "fmd-collection-loading-toast-icon-wrap",
      content: "fmd-collection-loading-toast-content",
    },
  });
};

export const dismissCollectionLoadingToast = () => {
  toast.dismiss(COLLECTION_LOADING_TOAST_ID);
};
