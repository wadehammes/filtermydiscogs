export const assignBrowserDocumentCookie = (cookie: string): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = cookie;
};
