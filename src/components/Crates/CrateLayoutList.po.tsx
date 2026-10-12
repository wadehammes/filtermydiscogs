import type React from "react";
import { useState } from "react";
import { CrateLayoutList } from "src/components/Crates/CrateLayoutList.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { crateLayoutItemFactory } from "src/tests/factories/CrateLayoutItem.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { CrateLayoutItem } from "src/types/crate.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

const apiError = new Error("API request failed");

export const crateLayoutListLayoutRelease = releaseFactory.withTitle(
  "Layout Row Album",
  249504,
  {
    instance_id: "layout-row-instance",
  },
);

export const crateLayoutListDefaultItems: CrateLayoutItem[] = [
  crateLayoutItemFactory.release("layout-row-instance", 1000, null, {
    release: crateLayoutListLayoutRelease,
  }),
];

export class CrateLayoutListPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdCrateLayoutList";

  constructor() {
    super();
    this.setupCrateLayoutListMocks();
  }

  setupCrateLayoutListMocks(releaseId = 249504): void {
    this.setupReleaseOpenPrefetchMocks(releaseId);
    mockApiResponse(
      true,
      this.mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
  }

  mockDiscogsReleaseForId(releaseId: number): void {
    setupFetchDiscogsReleaseMock(
      this.mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: releaseId }),
    );
  }

  private crateLayoutListWrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <TestProviders
      authInitialState={testAuthenticatedAuthState}
      includeCollectionSync={false}
    >
      {children}
    </TestProviders>
  );

  renderCrateLayoutList(
    props: React.ComponentProps<typeof CrateLayoutList>,
  ): RenderResult {
    return render(<CrateLayoutList {...props} />, {
      wrapper: this.crateLayoutListWrapper,
    });
  }

  renderCrateLayoutWithEdgeInserts(
    layoutItems: CrateLayoutItem[],
    props: Partial<React.ComponentProps<typeof CrateLayoutList>> = {},
  ): RenderResult {
    const CrateLayoutWithEdgeInserts = () => {
      const [topInsertMount, setTopInsertMount] = useState<HTMLElement | null>(
        null,
      );
      const [bottomInsertMount, setBottomInsertMount] =
        useState<HTMLElement | null>(null);

      return (
        <>
          <div
            ref={setTopInsertMount}
            data-testid="fmdCrateLayoutTopInsertMount"
          />
          <CrateLayoutList
            crateId="crate-1"
            layoutItems={layoutItems}
            hidePackedItems={false}
            packedEnabled={false}
            isPacked={() => false}
            setPacked={jest.fn()}
            removeFromCrate={jest.fn()}
            onReleaseClick={jest.fn()}
            topInsertMount={topInsertMount}
            bottomInsertMount={bottomInsertMount}
            {...props}
          />
          <div
            ref={setBottomInsertMount}
            data-testid="fmdCrateLayoutBottomInsertMount"
          />
        </>
      );
    };

    return render(<CrateLayoutWithEdgeInserts />, {
      wrapper: this.crateLayoutListWrapper,
    });
  }

  renderCrateLayoutOnDetailShell(
    sectionLayout: CrateLayoutItem[],
  ): RenderResult {
    const CrateLayoutOnDetailShell = () => {
      const [topInsertMount, setTopInsertMount] = useState<HTMLElement | null>(
        null,
      );
      const [bottomInsertMount, setBottomInsertMount] =
        useState<HTMLElement | null>(null);

      return (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          <CollectionPlaybackPageShell currentPage="crates" hideFilters>
            <div
              ref={setTopInsertMount}
              data-testid="fmdCrateLayoutTopInsertMount"
            />
            <CrateLayoutList
              crateId="crate-1"
              layoutItems={sectionLayout}
              hidePackedItems={false}
              packedEnabled={false}
              isPacked={() => false}
              setPacked={jest.fn()}
              removeFromCrate={jest.fn()}
              onReleaseClick={jest.fn()}
              topInsertMount={topInsertMount}
              bottomInsertMount={bottomInsertMount}
            />
            <div
              ref={setBottomInsertMount}
              data-testid="fmdCrateLayoutBottomInsertMount"
            />
          </CollectionPlaybackPageShell>
        </TestProviders>
      );
    };

    return render(<CrateLayoutOnDetailShell />);
  }
}
