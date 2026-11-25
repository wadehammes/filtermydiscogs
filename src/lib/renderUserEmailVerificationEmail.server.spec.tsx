import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRender =
  jest.fn<
    (template: unknown, options?: { plainText?: boolean }) => Promise<string>
  >();

jest.mock("react-email", () => ({
  render: (template: unknown, options?: { plainText?: boolean }) =>
    mockRender(template, options),
}));

let renderUserEmailVerificationEmail: typeof import("src/lib/renderUserEmailVerificationEmail.server").renderUserEmailVerificationEmail;

beforeEach(async () => {
  jest.resetModules();
  mockRender.mockReset();
  mockRender.mockImplementation(async (_template, options) => {
    if (options?.plainText) {
      return "plain-text-body";
    }
    return "<html>verify-body</html>";
  });

  const module = await import(
    "src/lib/renderUserEmailVerificationEmail.server"
  );
  renderUserEmailVerificationEmail = module.renderUserEmailVerificationEmail;
});

describe("renderUserEmailVerificationEmail", () => {
  it("returns subject, html, and plain text from react-email", async () => {
    const result = await renderUserEmailVerificationEmail({
      confirmUrl:
        "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=abc",
    });

    expect(result.subject).toBe("Verify your email for FilterMyDisco.gs");
    expect(result.html).toBe("<html>verify-body</html>");
    expect(result.text).toBe("plain-text-body");
    expect(mockRender).toHaveBeenCalledTimes(2);
  });
});