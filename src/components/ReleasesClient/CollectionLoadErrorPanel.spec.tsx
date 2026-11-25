import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ApiFetchError } from "src/api/apiFetchError";
import { CollectionLoadErrorPanel } from "src/components/ReleasesClient/CollectionLoadErrorPanel.component";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen } from "test-utils";

describe("CollectionLoadErrorPanel", () => {
  it("shows mapped outage copy, status link, and a retry button", async () => {
    const user = userEvent.setup();

    render(
      <CollectionLoadErrorPanel
        error={new ApiFetchError(503, "Discogs unavailable")}
      />,
      { authInitialState: testAuthenticatedAuthState },
    );

    expect(
      screen.getByRole("heading", { name: /Discogs is having trouble/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Discogs status" }),
    ).toHaveAttribute("href", "https://status.discogs.com");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
});
