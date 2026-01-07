// jest.config.ts
import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

// Sync object
const customJestConfig: Config.InitialOptions = {
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupTests.ts"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!isbot|jest-dom|@svgr)"],
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
  };

  return { ...jestConfig, moduleNameMapper, testTimeout: 20000 };
};
