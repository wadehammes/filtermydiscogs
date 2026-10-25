import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaybackProvidersShellPageObject } from "src/components/PlaybackProvidersShell.component.po";
import { screen } from "test-utils";

let po: PlaybackProvidersShellPageObject;

describe("PlaybackProvidersShell", () => {
  beforeEach(() => {
    po = new PlaybackProvidersShellPageObject();
  });

  it("mounts ReleasePlaybackProvider and the global playback dock", () => {
    po.renderPlaybackProvidersShell();

    expect(screen.getByTestId(po.shellTestId)).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaybackDockBar")).toBeInTheDocument();
  });

  it("wraps children with PlaybackProvidersShell when no provider is mounted", () => {
    po.renderEnsurePlaybackProvidersShellWithoutOuterShell();

    expect(screen.getByTestId(po.ensureProbeTestId)).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaybackDockBar")).toBeInTheDocument();
  });

  it("defers mounting playback until auth is not checking", () => {
    po.renderEnsurePlaybackProvidersShellWhileCheckingAuth();

    expect(screen.getByTestId(po.ensureProbeTestId)).toBeInTheDocument();
    expect(screen.queryByTestId("fmdPlaybackDockBar")).toBeNull();
  });

  it("passes children through when ReleasePlaybackProvider is already mounted", () => {
    po.renderEnsurePlaybackProvidersShellInsideShell();

    expect(screen.getByTestId(po.ensureProbeTestId)).toHaveTextContent(
      "nested",
    );
    expect(screen.getAllByTestId("fmdPlaybackDockBar")).toHaveLength(1);
  });
});
