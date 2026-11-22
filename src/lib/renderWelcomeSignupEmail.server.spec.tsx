import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRender =
  jest.fn<
    (template: unknown, options?: { plainText?: boolean }) => Promise<string>
  >();

jest.mock("react-email", () => ({
  render: (template: unknown, options?: { plainText?: boolean }) =>
    mockRender(template, options),
}));

let renderWelcomeSignupEmail: typeof import("src/lib/renderWelcomeSignupEmail.server").renderWelcomeSignupEmail;

beforeEach(async () => {
  jest.resetModules();
  mockRender.mockReset();
  mockRender.mockImplementation(async (_template, options) => {
    if (options?.plainText) {
      return "plain-text-body";
    }
    return "<html>welcome-body</html>";
  });

  const module = await import("src/lib/renderWelcomeSignupEmail.server");
  renderWelcomeSignupEmail = module.renderWelcomeSignupEmail;
});

describe("renderWelcomeSignupEmail", () => {
  it("returns subject, html, and plain text from react-email", async () => {
    const result = await renderWelcomeSignupEmail({ username: "crate-digger" });

    expect(result.subject).toBe("Welcome to FilterMyDisco.gs");
    expect(result.html).toBe("<html>welcome-body</html>");
    expect(result.text).toBe("plain-text-body");
    expect(mockRender).toHaveBeenCalledTimes(2);
  });
});
