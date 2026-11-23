import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { Resend } from "resend";

const mockEmailsSend =
  jest.fn<
    (input: Record<string, unknown>) => Promise<{
      data: { id: string } | null;
      error?: { message: string; name: string };
    }>
  >();

let getResendReplyTo: typeof import("src/lib/resend.server").getResendReplyTo;
let resendReplyToSendFields: typeof import("src/lib/resend.server").resendReplyToSendFields;
let sendResendEmail: typeof import("src/lib/resend.server").sendResendEmail;

const resendEnvKeys = ["RESEND_REPLY_TO"] as const;

const resendStub = {
  emails: { send: mockEmailsSend },
} as unknown as Resend;

beforeEach(async () => {
  jest.resetModules();
  mockEmailsSend.mockReset();
  mockEmailsSend.mockResolvedValue({ data: { id: "msg-1" } });

  const module = await import("src/lib/resend.server");
  getResendReplyTo = module.getResendReplyTo;
  resendReplyToSendFields = module.resendReplyToSendFields;
  sendResendEmail = module.sendResendEmail;
});

afterEach(() => {
  for (const key of resendEnvKeys) {
    delete process.env[key];
  }
});

describe("resend.server", () => {
  const baseInput = {
    from: "FilterMyDisco.gs <no-reply@updates.filtermydisco.gs>",
    to: "dig@example.com",
    subject: "Welcome",
    text: "plain",
    html: "<p>html</p>",
  };

  it("returns trimmed RESEND_REPLY_TO when set", () => {
    process.env.RESEND_REPLY_TO = "  noise@filtermydisco.gs ";

    expect(getResendReplyTo()).toBe("noise@filtermydisco.gs");
  });

  it("returns null when RESEND_REPLY_TO is empty", () => {
    process.env.RESEND_REPLY_TO = "   ";

    expect(getResendReplyTo()).toBeNull();
  });

  it("returns reply_to fields when RESEND_REPLY_TO is set", () => {
    process.env.RESEND_REPLY_TO = "noise@filtermydisco.gs";

    expect(resendReplyToSendFields()).toEqual({
      reply_to: "noise@filtermydisco.gs",
    });
  });

  it("returns undefined reply fields when RESEND_REPLY_TO is unset", () => {
    expect(resendReplyToSendFields()).toBeUndefined();
  });

  it("sends with reply_to when RESEND_REPLY_TO is configured", async () => {
    process.env.RESEND_REPLY_TO = "noise@filtermydisco.gs";

    await sendResendEmail(resendStub, baseInput);

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        ...baseInput,
        reply_to: "noise@filtermydisco.gs",
      }),
    );
  });

  it("throws when Resend returns an error without throwing", async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified", name: "validation_error" },
    });

    await expect(sendResendEmail(resendStub, baseInput)).rejects.toThrow(
      "Domain not verified",
    );
  });

  it("throws when Resend transport fails", async () => {
    mockEmailsSend.mockRejectedValue(new Error("Resend down"));

    await expect(sendResendEmail(resendStub, baseInput)).rejects.toThrow(
      "Resend down",
    );
  });
});
