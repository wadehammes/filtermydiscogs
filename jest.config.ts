// jest.config.ts
import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

// Sync object
const customJestConfig: Config.InitialOptions = {
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupTests.ts"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
  ],
  // pnpm: skip the store root (`node_modules/.pnpm/...`) so inner `node_modules/<pkg>` can opt out of ignore.
  // `@faker-js/faker` is transpiled via `transpilePackages` in next.config; excluding it here avoids an extra OR match.
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!\\.pnpm/)(?!jest-dom|@svgr|@faker-js/faker|@tanstack/react-table|@tanstack/table-core)",
  ],
  verbose: true,
};

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" })(customJestConfig);

export default async () => {
  // Create Next.js jest configuration presets
  const jestConfig = await createJestConfig();

  // Custom `moduleNameMapper` configuration
  // Put SVG mapping first to ensure it takes precedence over any nextJest mappings
  const moduleNameMapper = {
    "\\.svg$": "<rootDir>/.jest/__mocks__/svg.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    ...jestConfig.moduleNameMapper,
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test-utils$": "<rootDir>/src/tests/utils/test-utils.tsx",
  };

  return { ...jestConfig, moduleNameMapper, testTimeout: 20000 };
};
