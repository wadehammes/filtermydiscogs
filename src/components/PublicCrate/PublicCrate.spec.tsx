import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { AuthenticatedProvidersGate } from "src/components/AuthenticatedProvidersGate.component";
import {
  buildPublicCratePagination,
  PublicCratePageObject,
} from "src/components/PublicCrate/PublicCrate.po";
import { PublicCrateClient } from "src/components/PublicCrate/PublicCrateClient.component";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

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

jest.mock("src/components/ReleaseCardGrid/ReleaseCardGrid.component", () => ({
  ReleaseCardGrid: () => <div data-testid="fmdReleaseCardGridMock" />,
}));

jest.mock(
  "src/components/PublicReleaseModal/PublicReleaseModal.component",
  () => ({
    PublicReleaseModal: () => null,
  }),
);

jest.mock(
  "src/components/LoginConnectButton/LoginConnectButton.component",
  () => ({
    LoginConnectButton: () => null,
  }),
);

const mockApi = jest.mocked(api);

let po: PublicCratePageObject;

describe("PublicCrateClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    po = new PublicCratePageObject();
  });

  it("loads a public crate via the public API without touching the collection API", async () => {
    const crate = crateFactory.build({
      id: po.crateId,
      name: "Gig crate",
      private: false,
    });
    const releases = releaseFactory.buildList(2);
    const payload = crateWithReleasesResponseFactory.withReleases(
      crate,
      releases,
      {
        pagination: buildPublicCratePagination(releases.length),
      },
    );

    mockApi.publicCrate.mockResolvedValueOnce(payload);

    po.renderPublicCrate();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText("Loading crate...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Gig crate" }),
      ).toBeInTheDocument();
    });

    expect(mockApi.publicCrate).toHaveBeenCalledWith(po.crateId);
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
    expect(screen.queryByText("Loading crate...")).not.toBeInTheDocument();
  });

  it("settles after one fetch when mounted through the logged-out public crate gate", async () => {
    const crate = crateFactory.build({
      id: po.crateId,
      name: "Shared picks",
      private: false,
    });
    const releases = releaseFactory.buildList(1);
    mockApi.publicCrate.mockResolvedValueOnce(
      crateWithReleasesResponseFactory.withReleases(crate, releases, {
        pagination: buildPublicCratePagination(releases.length),
      }),
    );

    po.setPathname(`/crate/${po.crateId}`);

    render(
      <AuthenticatedProvidersGate>
        <PublicCrateClient crateId={po.crateId} />
      </AuthenticatedProvidersGate>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testUnauthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Shared picks" }),
      ).toBeInTheDocument();
    });

    expect(mockApi.publicCrate).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId("fmdAuthenticatedProvidersDynamic"),
    ).not.toBeInTheDocument();
  });

  it("shows a not-found state when the public crate API fails", async () => {
    mockApi.publicCrate.mockRejectedValueOnce(
      new Error("Crate not found or is private"),
    );

    po.renderPublicCrate();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Crate Not Found" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("This crate is private and cannot be viewed."),
    ).toBeInTheDocument();
  });
});
