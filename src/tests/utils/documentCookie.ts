export const setDocumentCookieForTests = (value: string): void => {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    writable: true,
    value,
  });
};
