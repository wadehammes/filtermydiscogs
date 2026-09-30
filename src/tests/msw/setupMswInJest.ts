import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { mswServer } from "src/tests/msw/server";
import { patchFetchForRelativeUrls } from "../../../.jest/patchFetchForRelativeUrls";

let fetchRecorderInstalled = false;
let lifecycleRegistered = false;

const capturedRequests: Request[] = [];

export function setupMswInJest() {
  if (lifecycleRegistered) {
    return;
  }
  lifecycleRegistered = true;

  beforeAll(() => {
    fetchMock.disableMocks();
    patchFetchForRelativeUrls();
    mswServer.listen({
      onUnhandledFrame: "error",
    });

    if (!fetchRecorderInstalled) {
      mswServer.events.on("request:start", (event) => {
        const request = event.request;
        try {
          capturedRequests.push(request.clone());
        } catch {
          capturedRequests.push(
            new Request(request.url, {
              method: request.method,
              headers: request.headers,
            }),
          );
        }
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
