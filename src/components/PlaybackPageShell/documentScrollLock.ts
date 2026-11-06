type ElementScrollStyleSnapshot = {
  overflow: string;
  overflowY: string;
  overscrollBehavior: string;
  touchAction: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
};

export type DocumentScrollLockSnapshot = {
  html: ElementScrollStyleSnapshot;
  body: ElementScrollStyleSnapshot;
  windowScrollY: number;
};

const captureElementScrollStyles = (
  element: HTMLElement,
): ElementScrollStyleSnapshot => ({
  overflow: element.style.overflow,
  overflowY: element.style.overflowY,
  overscrollBehavior: element.style.overscrollBehavior,
  touchAction: element.style.touchAction,
  position: element.style.position,
  top: element.style.top,
  left: element.style.left,
  right: element.style.right,
  width: element.style.width,
});

const restoreElementScrollStyles = (
  element: HTMLElement,
  snapshot: ElementScrollStyleSnapshot,
): void => {
  element.style.overflow = snapshot.overflow;
  element.style.overflowY = snapshot.overflowY;
  element.style.overscrollBehavior = snapshot.overscrollBehavior;
  element.style.touchAction = snapshot.touchAction;
  element.style.position = snapshot.position;
  element.style.top = snapshot.top;
  element.style.left = snapshot.left;
  element.style.right = snapshot.right;
  element.style.width = snapshot.width;
};

export const lockDocumentForOverlayScroll = (): DocumentScrollLockSnapshot => {
  const html = document.documentElement;
  const body = document.body;
  const windowScrollY = window.scrollY;

  const snapshot: DocumentScrollLockSnapshot = {
    html: captureElementScrollStyles(html),
    body: captureElementScrollStyles(body),
    windowScrollY,
  };

  html.style.overflow = "hidden";
  html.style.overflowY = "hidden";
  html.style.overscrollBehavior = "none";
  html.style.touchAction = "none";
  html.style.position = "fixed";
  html.style.top = `-${windowScrollY}px`;
  html.style.left = "0";
  html.style.right = "0";
  html.style.width = "100%";

  body.style.overflow = "hidden";
  body.style.overflowY = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.touchAction = "none";

  return snapshot;
};

export const restoreDocumentOverlayScroll = (
  snapshot: DocumentScrollLockSnapshot,
): void => {
  const html = document.documentElement;
  const body = document.body;

  restoreElementScrollStyles(html, snapshot.html);
  restoreElementScrollStyles(body, snapshot.body);

  window.scrollTo({
    top: snapshot.windowScrollY,
    left: 0,
  });
};
