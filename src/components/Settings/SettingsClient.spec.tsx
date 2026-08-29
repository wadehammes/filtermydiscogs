import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { SettingsClientPageObject } from "src/components/Settings/SettingsClient.po";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import { createFilterView } from "src/utils/filterViews";
import { screen, waitFor, within } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

let po: SettingsClientPageObject;

describe("SettingsClient", () => {
  beforeEach(() => {
    po = new SettingsClientPageObject();
  });

  it("renders the settings page with the account panel by default", async () => {
    po.renderSettingsClient();

    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Discogs username")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Account Profile and sign-out" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: "Complete logout" }),
    ).toBeInTheDocument();
  });

  it("switches to the data panel and opens the clear-data dialog", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", { name: "Data Stored app data" }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Allow analytics cookies")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear all stored data" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear all stored data" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Clear all stored data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/delete all your stored crates/i),
    ).toBeInTheDocument();
  });

  it("switches to the appearance panel", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Appearance Theme and default view",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Appearance" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Default view")).toBeInTheDocument();
  });

  it("enables analytics cookies in local storage", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");

    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", { name: "Data Stored app data" }),
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /allow analytics cookies/i,
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(checkbox).toBeChecked();
  });

  it("shows analytics consent in the clear-data dialog message", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", { name: "Data Stored app data" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Clear all stored data" }),
    );

    expect(
      within(screen.getByRole("dialog")).getByText(
        /including your analytics cookie choice/i,
      ),
    ).toBeInTheDocument();
  });

  it("renames a saved view from the filters panel", async () => {
    const technoView = createFilterView("Techno", {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
    });

    mockApiResponse(
      true,
      mockApi.userPreferences,
      {
        preferences: userPreferencesFactory.build({
          filterViews: [technoView],
        }),
      },
      new Error("Preferences request failed"),
    );
    mockApiResponse(
      true,
      mockApi.updateUserPreferences,
      {
        preferences: userPreferencesFactory.build({
          filterViews: [
            {
              ...technoView,
              name: "Peak time",
            },
          ],
        }),
      },
      new Error("Preferences update failed"),
    );

    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Filters Saved views and filter preferences",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Rename Techno" }));

    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByLabelText("View name");

    await user.clear(nameInput);
    await user.type(nameInput, "Peak time");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockApi.updateUserPreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          filterViews: [
            expect.objectContaining({
              id: technoView.id,
              name: "Peak time",
            }),
          ],
        }),
      );
    });
  });
});
