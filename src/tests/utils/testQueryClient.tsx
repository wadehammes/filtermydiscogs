import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a test QueryClient with default options suitable for testing
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};
