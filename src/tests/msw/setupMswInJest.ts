import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { mswServer } from "src/tests/msw/server";

let fetchRecorderInstalled = false;

const capturedRequests: Request[] = [];

export function setupMswInJest() {
  beforeAll(() => {
    fetchMock.disableMocks();
    mswServer.listen({
      onUnhandledRequest: "error",
    });

    if (!fetchRecorderInstalled) {
      mswServer.events.on("request:start", ({ request }) => {
        capturedRequests.push(request.clone());
      });
      fetchRecorderInstalled = true;
    }
  });

  beforeEach(() => {
    capturedRequests.length = 0;
    mswServer.resetHandlers();
  });

  afterAll(() => {
    mswServer.close();
    fetchMock.enableMocks();
  });
}

export function getLastCapturedFetchRequest(): Request | undefined {
  return capturedRequests.at(-1);
}
