import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  AuthenticatedProvidersGatePageObject,
  testAuthenticatedAuthState,
} from "src/components/AuthenticatedProvidersGate.component.po";
import { screen } from "test-utils";

jest.mock("src/components/PlaybackProvidersShell.component", () => ({
  PlaybackProvidersShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fmdPlaybackProvidersShell">{children}</div>
  ),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function AuthenticatedProvidersDynamic({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <div data-testid="fmdAuthenticatedProvidersDynamic">{children}</div>
      );
    },
}));

let po: AuthenticatedProvidersGatePageObject;

describe("AuthenticatedProvidersGate", () => {
  beforeEach(() => {
    po = new AuthenticatedProvidersGatePageObject();
  });

  it("mounts the static playback shell on logged-out public routes including home", () => {
    po.renderAuthenticatedProvidersGate({ pathname: "/" });

    expect(screen.getByTestId(po.playbackShellTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("mounts the static playback shell on logged-out public crate routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb",
    });

    expect(screen.getByTestId(po.playbackShellTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("passes children through without playback on logged-out protected routes", () => {
    po.renderAuthenticatedProvidersGate({ pathname: "/releases" });

    expect(
      screen.queryByTestId(po.playbackShellTestId),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("uses the dynamic authenticated shell when the session is active", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb",
      authInitialState: testAuthenticatedAuthState,
    });

    expect(
      screen.getByTestId(po.authenticatedDynamicTestId),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(po.playbackShellTestId),
    ).not.toBeInTheDocument();
  });
});
