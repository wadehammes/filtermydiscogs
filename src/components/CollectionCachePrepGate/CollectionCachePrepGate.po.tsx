import { CollectionCachePrepGate } from "src/components/CollectionCachePrepGate/CollectionCachePrepGate.component";
import { useCollectionCacheReady } from "src/hooks/useCollectionCacheReady.hook";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/hooks/useCollectionCacheReady.hook", () => ({
  ...jest.requireActual("src/hooks/useCollectionCacheReady.hook"),
  useCollectionCacheReady: jest.fn(() => ({
    ready: false,
    hydratedFromCache: false,
  })),
}));

export const mockUseCollectionCacheReady = jest.mocked(useCollectionCacheReady);

export type CollectionCachePrepGateRenderProps = {
  reconnectUsername?: string | null;
};

export class CollectionCachePrepGatePageObject extends BasePageObject {
  mockUseCollectionCacheReady = mockUseCollectionCacheReady;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderCollectionCachePrepGate(
    overrides: CollectionCachePrepGateRenderProps = {},
  ): RenderResult {
    return render(<CollectionCachePrepGate />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={{
            ...testUnauthenticatedAuthState,
            reconnectUsername:
              overrides.reconnectUsername ??
              testUnauthenticatedAuthState.reconnectUsername,
          }}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });
  }
}
