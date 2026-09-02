import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleasesClientPageObject } from "src/components/ReleasesClient/ReleasesClient.po";
import {
  type IntersectionObserverMockControls,
  setupIntersectionObserverMock,
} from "src/tests/mocks/mockIntersectionObserver.mock";
import { act, screen, waitFor } from "test-utils";

const INITIAL_VISIBLE_RELEASES = 100;
const VISIBLE_BATCH_SIZE = 100;

let po: ReleasesClientPageObject;
let intersectionObserver: IntersectionObserverMockControls;

describe("ReleasesClient", () => {
  beforeEach(() => {
    intersectionObserver = setupIntersectionObserverMock();
    po = new ReleasesClientPageObject();
  });

  it("renders the collection grid after releases load", async () => {
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId).length).toBeGreaterThan(0);
    });
  });

  it("opens the release modal when a card is activated", async () => {
    const user = userEvent.setup();

    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId).length).toBeGreaterThan(0);
    });

    const openButtons = screen.getAllByRole("button", {
      name: /Open release details for/i,
    });
    await user.click(openButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId(po.modalTestId)).toBeInTheDocument();
    });
  });
});

describe("ReleasesClient infinite scroll", () => {
  beforeEach(() => {
    intersectionObserver = setupIntersectionObserverMock();
    po = new ReleasesClientPageObject();
  });

  it("wires the scroll container to intersection observation", async () => {
    po.mockCollectionWithReleaseCount(120);
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId).length).toBeGreaterThan(0);
    });

    const scrollRoot = document.querySelector("[data-releases-scroll-root]");
    const sentinel = screen.getByTestId("fmdReleasesLoadingTrigger");

    expect(scrollRoot).toBeTruthy();
    await waitFor(() => {
      expect(intersectionObserver.getLastObserverRoot()).toBe(scrollRoot);
    });
    expect(intersectionObserver.getObservedElements()).toContain(sentinel);
  });

  it("renders only the first visible batch before the sentinel enters view", async () => {
    po.mockCollectionWithReleaseCount(150);
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId)).toHaveLength(
        INITIAL_VISIBLE_RELEASES,
      );
    });
  });

  it("renders more cards when the sentinel enters view", async () => {
    po.mockCollectionWithReleaseCount(150);
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId)).toHaveLength(
        INITIAL_VISIBLE_RELEASES,
      );
    });

    const sentinel = screen.getByTestId("fmdReleasesLoadingTrigger");
    act(() => {
      intersectionObserver.triggerIntersection(sentinel, true);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId)).toHaveLength(150);
    });
  });

  it("continues expanding in batches of 100", async () => {
    po.mockCollectionWithReleaseCount(250);
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId)).toHaveLength(
        INITIAL_VISIBLE_RELEASES,
      );
    });

    const sentinel = screen.getByTestId("fmdReleasesLoadingTrigger");
    act(() => {
      intersectionObserver.triggerIntersection(sentinel, true);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId)).toHaveLength(
        INITIAL_VISIBLE_RELEASES + VISIBLE_BATCH_SIZE,
      );
    });
  });
});
