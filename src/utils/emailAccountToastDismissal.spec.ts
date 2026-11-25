import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  hasEmailAccountToastBeenDismissed,
  markEmailAccountToastDismissed,
} from "src/utils/emailAccountToastDismissal";

describe("emailAccountToastDismissal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("when dismissal was not stored, returns false", () => {
    expect(hasEmailAccountToastBeenDismissed("42")).toBe(false);
  });

  it("when dismissal was stored for the user, returns true", () => {
    markEmailAccountToastDismissed("42");

    expect(hasEmailAccountToastBeenDismissed("42")).toBe(true);
    expect(hasEmailAccountToastBeenDismissed("99")).toBe(false);
  });
});
