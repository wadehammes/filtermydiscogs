import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

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
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!\\.pnpm/)(?!jest-dom|@svgr|@faker-js/faker|@tanstack/react-table|@tanstack/table-core|@tanstack/charts|@tanstack/charts-scales|@tanstack/react-charts|d3-shape)",
  ],
  verbose: false,
  workerIdleMemoryLimit: "512MB",
};

const createJestConfig = nextJest({ dir: "./" })(customJestConfig);

export default async () => {
  const jestConfig = await createJestConfig();

  const moduleNameMapper = {
    "\\.svg$": "<rootDir>/.jest/__mocks__/svg.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    ...jestConfig.moduleNameMapper,
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test-utils$": "<rootDir>/src/tests/utils/test-utils.tsx",
  };

  return { ...jestConfig, moduleNameMapper, testTimeout: 20000 };
};
