import { expect } from "@jest/globals";
import { setupMswInJest } from "src/tests/msw/setupMswInJest";

const MSW_SPEC_PATTERN = /\/src\/api\/(helpers|endpoints\/.*)\.spec\.ts$/;

function currentSpecUsesMsw(): boolean {
  const testPath = expect.getState().testPath ?? "";
  return MSW_SPEC_PATTERN.test(testPath);
}

if (currentSpecUsesMsw()) {
  setupMswInJest();
}
