import type { Config } from "@jest/types";
import nextJest from "next/jest.js";

// Sync object
const customJestConfig: Config.InitialOptions = {
  verbose: true,
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
  setupFilesAfterEnv: ["<rootDir>/.jest/setupTests.ts"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!isbot|swiper)"],
};

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" })(customJestConfig);

export default async () => {
  // Create Next.js jest configuration presets
  const jestConfig = await createJestConfig();

  // Custom `moduleNameMapper` configuration
  const moduleNameMapper = {
    ...jestConfig.moduleNameMapper,
    "swiper/react": "<rootDir>/node_modules/swiper",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  };

  return { ...jestConfig, moduleNameMapper };
};
