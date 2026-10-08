import { describe, expect, it } from "@jest/globals";
import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import { clearAllDataConfirmFormSchema } from "src/lib/validation/clearData.schemas";

describe("clearAllDataConfirmFormSchema", () => {
  it("accepts the exact confirm phrase", () => {
    expect(
      clearAllDataConfirmFormSchema.safeParse({
        phrase: CLEAR_ALL_DATA_CONFIRM_PHRASE,
      }).success,
    ).toBe(true);
  });

  it("rejects a mismatched phrase", () => {
    expect(
      clearAllDataConfirmFormSchema.safeParse({ phrase: "delete my data" })
        .success,
    ).toBe(false);
  });

  it("accepts lowercase input after normalizing to the confirm phrase", () => {
    expect(
      clearAllDataConfirmFormSchema.safeParse({ phrase: "delete my account" })
        .success,
    ).toBe(true);
  });
});
