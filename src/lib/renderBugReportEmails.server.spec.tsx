import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRender =
  jest.fn<
    (template: unknown, options?: { plainText?: boolean }) => Promise<string>
  >();

jest.mock("react-email", () => ({
  render: (template: unknown, options?: { plainText?: boolean }) =>
    mockRender(template, options),
}));

let renderBugReportReceivedEmail: typeof import("src/lib/renderBugReportEmails.server").renderBugReportReceivedEmail;
let renderBugReportSupportEmail: typeof import("src/lib/renderBugReportEmails.server").renderBugReportSupportEmail;

beforeEach(async () => {
  jest.resetModules();
  mockRender.mockReset();
  mockRender.mockImplementation(async (_template, options) => {
    if (options?.plainText) {
      return "plain-text-body";
    }
    return "<html>bug-report-body</html>";
  });

  const module = await import("src/lib/renderBugReportEmails.server");
  renderBugReportReceivedEmail = module.renderBugReportReceivedEmail;
  renderBugReportSupportEmail = module.renderBugReportSupportEmail;
});

describe("renderBugReportEmails", () => {
  it("returns subject, html, and plain text for the user receipt", async () => {
    const result = await renderBugReportReceivedEmail({ username: "wax-head" });

    expect(result.subject).toBe("We received your FilterMyDisco.gs bug report");
    expect(result.html).toBe("<html>bug-report-body</html>");
    expect(result.text).toBe("plain-text-body");
    expect(mockRender).toHaveBeenCalledTimes(2);
  });

  it("returns subject, html, and plain text for the support inbox copy", async () => {
    const result = await renderBugReportSupportEmail({
      message: "Broken filters",
      feedbackSourceTag: "collection_command",
      username: "wax-head",
    });

    expect(result.subject).toBe(
      "FilterMyDisco.gs bug report [collection_command] — wax-head",
    );
    expect(result.html).toBe("<html>bug-report-body</html>");
    expect(result.text).toBe("plain-text-body");
    expect(mockRender).toHaveBeenCalledTimes(2);
  });
});
