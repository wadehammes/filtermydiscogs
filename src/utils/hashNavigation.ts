export const normalizeHash = (hash: string) =>
  hash.startsWith("#") ? hash : `#${hash}`;

export const getHashElementId = (hash: string) => normalizeHash(hash).slice(1);

export const splitPathHashHref = (href: string) => {
  const url = new URL(href, "http://local");

  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    href: `${url.pathname}${url.search}${url.hash}`,
  };
};

export const scrollToHash = ({
  hash,
  behavior = "smooth",
  block = "start",
}: {
  hash: string;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}) => {
  const elementId = getHashElementId(hash);

  if (!elementId) {
    return;
  }

  document.getElementById(elementId)?.scrollIntoView({ behavior, block });
};

export const replacePathHash = ({
  pathname,
  hash,
  search = "",
}: {
  pathname: string;
  hash: string;
  search?: string;
}) => {
  window.history.replaceState(
    null,
    "",
    `${pathname}${search}${normalizeHash(hash)}`,
  );
};

export const scrollToPathHash = ({
  pathname,
  hash,
  search = "",
  behavior = "smooth",
  block = "start",
}: {
  pathname: string;
  hash: string;
  search?: string;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}) => {
  scrollToHash({ hash, behavior, block });
  replacePathHash({ pathname, hash, search });
};

export const navigateToPathHash = ({
  href,
  currentPathname,
  router,
  event,
}: {
  href: string;
  currentPathname: string;
  router: { push: (href: string) => void };
  event?: Pick<MouseEvent, "defaultPrevented" | "preventDefault">;
}) => {
  const target = splitPathHashHref(href);

  if (currentPathname === target.pathname) {
    event?.preventDefault();
    scrollToPathHash({
      pathname: target.pathname,
      hash: target.hash,
      search: target.search,
    });
    return;
  }

  router.push(target.href);
};

export const matchesCurrentHash = (hash: string) =>
  window.location.hash === normalizeHash(hash);
