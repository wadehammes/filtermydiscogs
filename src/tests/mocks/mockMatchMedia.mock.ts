type MockMatchMediaOptions = {
  desktop?: boolean;
};

function queryMatches(query: string, desktop: boolean) {
  if (query.includes("min-width: 1024px")) {
    return desktop;
  }
  if (query.includes("min-width: 768px")) {
    return desktop;
  }
  if (query.includes("max-width: 1023px")) {
    return !desktop;
  }
  if (
    query.includes("max-width: 768px") ||
    query.includes("max-width: 767px")
  ) {
    return !desktop;
  }
  return false;
}

export function setupMockMatchMedia({
  desktop = false,
}: MockMatchMediaOptions = {}) {
  // Check if matchMedia already exists and delete it first if needed
  const existingDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "matchMedia",
  );

  if (existingDescriptor && !existingDescriptor.configurable) {
    // If it's not configurable, we can't redefine it - this shouldn't happen in jsdom
    // but if it does, we'll just return early
    return;
  }

  // Delete existing property if it exists to allow redefinition
  try {
    // biome-ignore lint/performance/noDelete: Test code - need to mock matchMedia
    // biome-ignore lint/suspicious/noExplicitAny: Test code - need to mock matchMedia
    delete (window as any).matchMedia;
  } catch {
    // Ignore if can't delete
  }

  // Define matchMedia with configurable: true to allow redefinition
  // Use a regular function instead of jest.fn() so resetAllMocks() doesn't clear it
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    enumerable: true,
    value: (query: string) => ({
      matches: queryMatches(query, desktop),
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}
