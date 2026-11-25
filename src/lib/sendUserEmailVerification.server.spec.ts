import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetResendClient = jest.fn();
const mockGetResendFromEmail = jest.fn<() => string | null>();
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
      },
    ) => Promise<void>
  >();

jest.mock("src/lib/resend.server", () => ({
  getResendClient: () => mockGetResendClient(),
  getResendFromEmail: () => mockGetResendFromEmail(),
  reportResendNotConfiguredOnce: jest.fn(),
  sendResendEmail: (
    resend: unknown,
    input: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    },
  ) => mockSendResendEmail(resend, input),
}));

const mockRenderUserEmailVerificationEmail =
  jest.fn<
    (input: { confirmUrl: string }) => Promise<{
      subject: string;
      html: string;
      text: string;
    }>
  >();

jest.mock("src/lib/renderUserEmailVerificationEmail.server", () => ({
  renderUserEmailVerificationEmail: mockRenderUserEmailVerificationEmail,
}));

jest.mock("src/lib/user-email-verification.server", () => ({
  buildEmailVerificationConfirmUrl: (token: string, siteOrigin: string) =>
    `${siteOrigin}/api/user/email-verification/confirm?token=${encodeURIComponent(token)}`,
}));

let sendUserEmailVerification: typeof import("src/lib/sendUserEmailVerification.server").sendUserEmailVerification;

const resendClientStub = { emails: { send: jest.fn() } };

beforeEach(async () => {
  jest.resetModules();
  mockGetResendClient.mockReset();
  mockGetResendFromEmail.mockReset();
  mockSendResendEmail.mockReset();
  mockRenderUserEmailVerificationEmail.mockReset();
  mockGetResendClient.mockReturnValue(resendClientStub);
  mockGetResendFromEmail.mockReturnValue("from@example.com");
  mockRenderUserEmailVerificationEmail.mockResolvedValue({
    subject: "Verify your email",
    html: "<p>html</p>",
    text: "text",
  });

  const module = await import("src/lib/sendUserEmailVerification.server");
  sendUserEmailVerification = module.sendUserEmailVerification;
});

describe("sendUserEmailVerification", () => {
  it("sends a rendered verification message through Resend", async () => {
    await sendUserEmailVerification({
      to: "user@example.com",
      token: "secret-token",
      siteOrigin: "https://www.filtermydisco.gs",
    });

    expect(mockRenderUserEmailVerificationEmail).toHaveBeenCalledWith({
      confirmUrl:
        "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=secret-token",
    });
    expect(mockSendResendEmail).toHaveBeenCalledWith(
      resendClientStub,
      expect.objectContaining({
        from: "from@example.com",
        to: "user@example.com",
        subject: "Verify your email",
      }),
    );
  });

  it("does not send when Resend is not configured", async () => {
    mockGetResendClient.mockReturnValue(null);

    await sendUserEmailVerification({
      to: "user@example.com",
      token: "secret-token",
      siteOrigin: "https://www.filtermydisco.gs",
    });

    expect(mockSendResendEmail).not.toHaveBeenCalled();
    expect(mockRenderUserEmailVerificationEmail).not.toHaveBeenCalled();
  });
});
