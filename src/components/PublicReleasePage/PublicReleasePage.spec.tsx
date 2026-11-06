import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import {
  mockDiscogsReleaseApi,
  PublicReleasePageObject,
} from "src/components/PublicReleasePage/PublicReleasePage.po";
import { screen, waitFor } from "test-utils";

jest.mock(
  "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component",
  () => ({
    PublicSharePlaybackShell: ({ children }: { children: ReactNode }) => (
      <div data-testid="fmdPublicSharePlaybackShell">{children}</div>
    ),
  }),
);

describe("PublicReleasePage", () => {
  let po: PublicReleasePageObject;

  beforeEach(() => {
    jest.clearAllMocks();
    po = new PublicReleasePageObject();
  });

  it("when the Discogs API resolves, renders the release title and track heading", async () => {
    po.setupDiscogsReleaseApiMock();
    po.renderPublicReleasePage();

    await waitFor(() => {
      expect(mockDiscogsReleaseApi).toHaveBeenCalledWith(po.releaseId);
    });

    expect(
      await screen.findByRole("heading", { name: "Never Gonna Give You Up" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: /Never Gonna Give You Up tracklist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdPublicSharePlaybackShell"),
    ).toBeInTheDocument();
  });

  it("when the Discogs API returns 404, shows a release not found message", async () => {
    po.mockDiscogsReleaseNotFound();
    po.renderPublicReleaseClient({ setupDiscogsReleaseApi: false });

    expect(
      await screen.findByRole("heading", { name: "Release not found" }),
    ).toBeInTheDocument();
  });
});
