import {
  WHATS_NEW_OPEN_QUERY_PARAM,
  WHATS_NEW_OPEN_QUERY_VALUE,
} from "src/constants/whatsNew.constants";
import { replacePathHash } from "src/utils/hashNavigation";

export const buildUrlWithWhatsNewOpenQuery = (href: string): string => {
  const url = new URL(href);

  url.searchParams.set(WHATS_NEW_OPEN_QUERY_PARAM, WHATS_NEW_OPEN_QUERY_VALUE);

  return url.toString();
};

export const navigateToSamePageWithWhatsNewQuery = (): void => {
  window.location.replace(buildUrlWithWhatsNewOpenQuery(window.location.href));
};

const stripWhatsNewOpenQueryParam = (): void => {
  const params = new URLSearchParams(window.location.search);

  if (params.get(WHATS_NEW_OPEN_QUERY_PARAM) !== WHATS_NEW_OPEN_QUERY_VALUE) {
    return;
  }

  params.delete(WHATS_NEW_OPEN_QUERY_PARAM);
  const query = params.toString();

  replacePathHash({
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: query ? `?${query}` : "",
  });
};

export const handleWhatsNewOpenFromQuery = (
  handledRef: { current: boolean },
  {
    userId,
    authResolved,
    isAuthenticated,
    hasUnseenWhatsNew,
    onOpen,
  }: {
    userId: string | null;
    authResolved: boolean;
    isAuthenticated: boolean;
    hasUnseenWhatsNew: boolean;
    onOpen: () => void;
  },
): void => {
  if (handledRef.current) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (params.get(WHATS_NEW_OPEN_QUERY_PARAM) !== WHATS_NEW_OPEN_QUERY_VALUE) {
    return;
  }

  if (!authResolved) {
    return;
  }

  if (isAuthenticated && !userId) {
    return;
  }

  handledRef.current = true;
  stripWhatsNewOpenQueryParam();

  if (!(isAuthenticated && userId && hasUnseenWhatsNew)) {
    return;
  }

  onOpen();
};
