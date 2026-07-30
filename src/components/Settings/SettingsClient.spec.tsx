import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { SettingsClientPageObject } from "src/components/Settings/SettingsClient.po";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { screen, waitFor, within } from "test-utils";

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
});
