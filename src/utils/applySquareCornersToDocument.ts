export const applySquareCornersToDocument = (squareCorners: boolean): void => {
  if (typeof document === "undefined") {
    return;
  }

  const rootElement = document.documentElement;

  if (squareCorners) {
    rootElement.setAttribute("data-ui-radius", "square");
    return;
  }

  rootElement.removeAttribute("data-ui-radius");
};
