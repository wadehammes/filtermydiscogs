import {
  VIEW_STATE_COOKIE_NAME,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import {
  defaultViewState,
  parseViewStateJson,
  type ViewMode,
} from "src/types/view.types";

export const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const isViewMode = (value: string | null | undefined): value is ViewMode =>
  value === "card" || value === "list" || value === "random";

export const parseCollectionViewCookie = (
  value: string | undefined,
): ViewMode | undefined => (isViewMode(value) ? value : undefined);

export const syncCollectionViewCookie = (view: ViewMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${VIEW_STATE_COOKIE_NAME}=${view}; path=/; max-age=${VIEW_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
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
