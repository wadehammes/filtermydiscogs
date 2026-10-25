import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  AuthenticatedProvidersGatePageObject,
  testAuthenticatedAuthState,
} from "src/components/AuthenticatedProvidersGate.component.po";
import { screen } from "test-utils";

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

  it("passes children through on logged-out public routes including home", () => {
    po.renderAuthenticatedProvidersGate({ pathname: "/" });

    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("passes children through on logged-out public crate routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb",
    });

    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("passes children through on logged-out public playlist routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/playlist/11111111-2222-3333-4444-555555555555",
    });

    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("passes children through without the authenticated shell on logged-out protected routes", () => {
    po.renderAuthenticatedProvidersGate({ pathname: "/releases" });

    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();
  });

  it("uses the dynamic authenticated shell when the session is active on protected routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/releases",
      authInitialState: testAuthenticatedAuthState,
    });

    expect(
      screen.getByTestId(po.authenticatedDynamicTestId),
    ).toBeInTheDocument();
  });

  it("uses the dynamic authenticated shell when the session is active on public playlist routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/playlist/11111111-2222-3333-4444-555555555555",
      authInitialState: testAuthenticatedAuthState,
    });

    expect(
      screen.getByTestId(po.authenticatedDynamicTestId),
    ).toBeInTheDocument();
  });

  it("uses the dynamic authenticated shell when the session is active on public crate routes", () => {
    po.renderAuthenticatedProvidersGate({
      pathname: "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb",
      authInitialState: testAuthenticatedAuthState,
    });

    expect(
      screen.getByTestId(po.authenticatedDynamicTestId),
    ).toBeInTheDocument();
  });

  it("passes children through when the live URL is a public playlist but the router pathname still points at a protected route", () => {
    const playlistPath = "/playlist/11111111-2222-3333-4444-555555555555";
    const pathnameGetter = jest
      .spyOn(window.location, "pathname", "get")
      .mockReturnValue(playlistPath);

    po.setPathname("/releases");
    po.renderAuthenticatedProvidersGate({ pathname: "/releases" });

    expect(
      screen.queryByTestId(po.authenticatedDynamicTestId),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(po.childProbeTestId)).toBeInTheDocument();

    pathnameGetter.mockRestore();
  });
});
