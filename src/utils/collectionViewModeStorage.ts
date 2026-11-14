import { collectionViewCookieAttributeSuffix } from "src/constants/collectionViewCookie.constants";
import {
  VIEW_STATE_COOKIE_NAME,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import {
  defaultViewState,
  parseViewStateJson,
  type ViewMode,
} from "src/types/view.types";
import { assignBrowserDocumentCookie } from "src/utils/browserDocumentCookie";

const isViewMode = (value: string | null | undefined): value is ViewMode =>
  value === "card" || value === "list" || value === "random";

export const parseCollectionViewCookie = (
  value: string | undefined,
): ViewMode | undefined => (isViewMode(value) ? value : undefined);

export const formatCollectionViewCookie = (view: ViewMode): string =>
  `${VIEW_STATE_COOKIE_NAME}=${view}${collectionViewCookieAttributeSuffix}`;

export const syncCollectionViewCookie = (view: ViewMode) => {
  assignBrowserDocumentCookie(formatCollectionViewCookie(view));
};

export const readInitialCollectionViewMode = (): ViewMode => {
  if (typeof document !== "undefined") {
    const fromDom = document.documentElement.getAttribute(
      "data-collection-view",
    );
    if (isViewMode(fromDom)) {
      return fromDom;
    }
  }

  if (typeof window !== "undefined") {
    return parseViewStateJson(localStorage.getItem(VIEW_STATE_STORAGE_KEY))
      .currentView;
  }

  return defaultViewState.currentView;
};
