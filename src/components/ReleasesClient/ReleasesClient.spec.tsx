import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleasesClientPageObject } from "src/components/ReleasesClient/ReleasesClient.po";
import { screen, waitFor } from "test-utils";

const MAX_VIRTUALIZED_CARD_DOM = 80;

let po: ReleasesClientPageObject;

describe("ReleasesClient", () => {
  beforeEach(() => {
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

describe("ReleasesClient virtualization", () => {
  beforeEach(() => {
    po = new ReleasesClientPageObject();
  });

  it("mounts only a bounded number of cards for large collections", async () => {
    po.mockCollectionWithReleaseCount(250);
    po.renderReleasesClient();

    await waitFor(() => {
      expect(screen.getAllByTestId(po.cardTestId).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByTestId(po.cardTestId).length).toBeLessThanOrEqual(
      MAX_VIRTUALIZED_CARD_DOM,
    );
  });
});
