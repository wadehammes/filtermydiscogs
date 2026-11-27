import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const mockGetResendClient = jest.fn();
const mockGetResendFromEmail = jest.fn<() => string | null>();
const mockReportResendNotConfiguredOnce = jest.fn();
const mockSendResendEmail =
  jest.fn<
    (
      resend: unknown,
      input: {
        from: string;
        to: string;
        subject: string;
        text: string;
        html: string;
        replyTo?: string;
      },
    ) => Promise<void>
  >();

jest.mock("src/lib/resend.server", () => ({
  getResendClient: () => mockGetResendClient(),
  getResendFromEmail: () => mockGetResendFromEmail(),
  reportResendNotConfiguredOnce: mockReportResendNotConfiguredOnce,
  sendResendEmail: (
    resend: unknown,
    input: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
      replyTo?: string;
    },
  ) => mockSendResendEmail(resend, input),
}));

const mockRenderBugReportReceivedEmail =
  jest.fn<() => Promise<{ subject: string; html: string; text: string }>>();

const mockRenderBugReportSupportEmail =
  jest.fn<() => Promise<{ subject: string; html: string; text: string }>>();

jest.mock("src/lib/renderBugReportEmails.server", () => ({
  renderBugReportReceivedEmail: mockRenderBugReportReceivedEmail,
  renderBugReportSupportEmail: mockRenderBugReportSupportEmail,
}));

let sendBugReportNotificationEmails: typeof import("src/lib/sendBugReportNotificationEmails.server").sendBugReportNotificationEmails;

const resendStub = { emails: { send: jest.fn() } };

beforeAll(async () => {
  ({ sendBugReportNotificationEmails } = await import(
    "src/lib/sendBugReportNotificationEmails.server"
  ));
});

describe("sendBugReportNotificationEmails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetResendClient.mockReturnValue(resendStub as never);
    mockGetResendFromEmail.mockReturnValue(
      "Filter My Discogs <noreply@filtermydisco.gs>",
    );
    mockRenderBugReportSupportEmail.mockResolvedValue({
      subject: "Support copy",
      html: "<p>support</p>",
      text: "support",
    });
    mockRenderBugReportReceivedEmail.mockResolvedValue({
      subject: "Receipt copy",
      html: "<p>thanks</p>",
      text: "thanks",
    });
  });

  it("sends support mail with reply-to and a receipt mail to the reporter", async () => {
    await sendBugReportNotificationEmails({
      message: "Wrong preview count",
      feedbackSourceTag: "collection_command",
      reporterEmail: "reporter@example.com",
      username: "wax-head",
      discogsUserId: "99",
    });

    expect(mockSendResendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendResendEmail).toHaveBeenNthCalledWith(
      1,
      resendStub,
      expect.objectContaining({
        to: "noise@filtermydisco.gs",
        replyTo: "reporter@example.com",
      }),
    );
    expect(mockSendResendEmail).toHaveBeenNthCalledWith(
      2,
      resendStub,
      expect.objectContaining({
        to: "reporter@example.com",
      }),
    );
  });
});
