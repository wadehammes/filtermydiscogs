import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { SettingsClientPageObject } from "src/components/Settings/SettingsClient.po";
import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import {
  SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL,
  SETTINGS_EMAIL_SAVE_LABEL,
  SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE,
} from "src/constants/settingsCopy.constants";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
import {
  expectPortaledPopupAttachedToBody,
  openFilterSelect,
} from "src/tests/filterControlTestHelpers";
import { createFilterView } from "src/utils/filterViews";
import { toast } from "src/utils/toast";
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
      screen.getByRole("button", { name: "Account Profile and email" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: "Complete logout" }),
    ).toBeInTheDocument();
  });

  it("does not save email when the field loses focus without Save", async () => {
    po.mockUserContact({
      email: "current@example.com",
      pendingEmail: null,
      emailVerified: true,
      marketingEmailsOptIn: false,
    });

    const user = userEvent.setup();

    po.renderSettingsClient();

    const emailInput = await screen.findByRole("textbox", { name: "Email" });

    await waitFor(() => {
      expect(emailInput).toBeEnabled();
    });

    await user.clear(emailInput);
    await user.type(emailInput, "digests@example.com");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: SETTINGS_EMAIL_SAVE_LABEL }),
      ).toBeEnabled();
    });

    expect(po.mockApi.updateUserContact).not.toHaveBeenCalled();
  });

  it("saves a valid email when Save email is pressed", async () => {
    const nextContact = {
      email: null,
      pendingEmail: "digests@example.com",
      emailVerified: false,
      marketingEmailsOptIn: false,
    };

    po.mockUpdateUserContact(nextContact);

    const user = userEvent.setup();

    po.renderSettingsClient();

    const emailInput = await screen.findByRole("textbox", { name: "Email" });

    await waitFor(() => {
      expect(emailInput).toBeEnabled();
    });

    await user.clear(emailInput);
    await user.type(emailInput, "digests@example.com");

    await user.click(
      screen.getByRole("button", { name: SETTINGS_EMAIL_SAVE_LABEL }),
    );

    await waitFor(() => {
      expect(po.mockApi.updateUserContact).toHaveBeenCalledWith({
        email: "digests@example.com",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE,
      );
    });
  });

  it("resends verification email from the resend control", async () => {
    const pendingContact = {
      email: "dig@example.com",
      pendingEmail: "pending@example.com",
      emailVerified: false,
      marketingEmailsOptIn: false,
    };

    po.mockUserContact(pendingContact);
    po.mockUpdateUserContact(pendingContact);

    const user = userEvent.setup();

    po.renderSettingsClient();

    const resendControl = await screen.findByRole("button", {
      name: SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL,
    });

    await user.click(resendControl);

    await waitFor(() => {
      expect(po.mockApi.updateUserContact).toHaveBeenCalledWith({
        resendEmailVerification: true,
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE,
      );
    });
  });

  it("switches to the data panel and opens the clear-data dialog", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Privacy Cookies and analytics",
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Privacy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Allow analytics cookies")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete account" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainOneByRole("heading", {
      level: 2,
      name: "Delete account",
    });
    expect(dialog).toContainOneByText(/permanently deletes your/i);
    expect(dialog).toContainOneByRole("textbox", {
      name: /type delete my account to confirm/i,
    });
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

  it("portals the default view select listbox to document.body", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

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

    await openFilterSelect("Default view");

    expectPortaledPopupAttachedToBody(
      screen.getByRole("listbox", { name: "Default view" }),
    );
  });

  it("enables analytics cookies in local storage", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");

    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Privacy Cookies and analytics",
      }),
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /allow analytics cookies/i,
    });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(checkbox).toBeChecked();
  });

  it("clears stored data only after typing the confirm phrase", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Privacy Cookies and analytics",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: "Delete account",
    });
    expect(confirmButton).toBeDisabled();

    await user.type(
      within(dialog).getByRole("textbox", {
        name: /type delete my account to confirm/i,
      }),
      CLEAR_ALL_DATA_CONFIRM_PHRASE,
    );
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(po.mockApi.clearData).toHaveBeenCalled();
    });
  });

  it("shows analytics consent in the clear-data dialog message", async () => {
    const user = userEvent.setup();

    po.renderSettingsClient();

    await user.click(
      screen.getByRole("button", {
        name: "Privacy Cookies and analytics",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    expect(
      within(screen.getByRole("dialog")).getByText(
        /including your analytics cookie choice/i,
      ),
    ).toBeInTheDocument();
  });

  it("renames a saved view from the filters panel", async () => {
    const technoView = createFilterView(
      "Techno",
      persistedFiltersFactory.withDefaults({ selectedStyles: ["Techno"] }),
    );

    po.mockUserPreferences(
      userPreferencesFactory.asApiResponse({
        filterViews: [technoView],
      }),
    );
    po.mockUpdateUserPreferences(
      userPreferencesFactory.asApiResponse({
        filterViews: [
          {
            ...technoView,
            name: "Peak time",
          },
        ],
      }),
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
      expect(po.mockApi.updateUserPreferences).toHaveBeenCalledWith(
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
