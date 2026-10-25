import { beforeEach, describe, expect, it } from "@jest/globals";
import { PublicSharePlaybackShellPageObject } from "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.po";
import { screen } from "test-utils";

let po: PublicSharePlaybackShellPageObject;

describe("PublicSharePlaybackShell", () => {
  beforeEach(() => {
    po = new PublicSharePlaybackShellPageObject();
  });

  it("mounts playback providers for public share pages without an outer shell", () => {
    po.renderPublicSharePlaybackShell({
      children: <span data-testid={po.childProbeTestId}>share content</span>,
    });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaybackDockBar")).toBeInTheDocument();
  });

  it("passes children through when ReleasePlaybackProvider is already mounted", () => {
    po.renderPublicSharePlaybackShellNestedInPlaybackShell();

    expect(screen.getByTestId(po.childProbeTestId)).toHaveTextContent("nested");
    expect(screen.getAllByTestId("fmdPlaybackDockBar")).toHaveLength(1);
  });
});
