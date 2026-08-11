import { toast } from "sonner";
import { formatLoadingMessage } from "src/components/AppPageLoading/appPageLoadingMessages";
import { Spinner } from "src/components/Spinner/Spinner.component";

export const COLLECTION_LOADING_TOAST_ID = "collection-loading";

export const showCollectionLoadingToast = (loadedCount: number) => {
  const message = formatLoadingMessage("releases", loadedCount);

  toast.loading(message, {
    id: COLLECTION_LOADING_TOAST_ID,
    duration: Number.POSITIVE_INFINITY,
    icon: <Spinner size="sm" aria-label={message} />,
  });
};

export const dismissCollectionLoadingToast = () => {
  toast.dismiss(COLLECTION_LOADING_TOAST_ID);
};
