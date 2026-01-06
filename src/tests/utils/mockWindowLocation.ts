/**
 * Helper to mock window.location.href for tests
 * Returns a function to restore the original href
 */
export const mockWindowLocationHref = (
  initialHref: string = "http://localhost/",
) => {
  let locationHref = initialHref;
  const originalHrefDescriptor = Object.getOwnPropertyDescriptor(
    window.location,
    "href",
  );

  Object.defineProperty(window.location, "href", {
    configurable: true,
    get() {
      return locationHref;
    },
    set(value: string) {
      locationHref = value;
    },
  });

  return {
    get href() {
      return locationHref;
    },
    set href(value: string) {
      locationHref = value;
    },
    restore: () => {
      if (originalHrefDescriptor) {
        Object.defineProperty(window.location, "href", originalHrefDescriptor);
      }
    },
  };
};
