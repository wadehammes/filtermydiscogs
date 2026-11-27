import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

type DbModule = typeof import("src/lib/db");

let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let resolveBugReportReporterContact: typeof import("src/lib/resolveBugReportReporterContact.server").resolveBugReportReporterContact;

beforeAll(async () => {
  const db = await import("src/lib/db");
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  ({ resolveBugReportReporterContact } = await import(
    "src/lib/resolveBugReportReporterContact.server"
  ));
});

describe("resolveBugReportReporterContact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the stored account email when the submitted email matches", async () => {
    mockFindUnique.mockResolvedValue({
      email: "wax@example.com",
    } as never);

    await expect(
      resolveBugReportReporterContact({
        discogsUserId: 42,
        submittedEmail: "  Wax@Example.com ",
        submittedName: " Wade ",
      }),
    ).resolves.toEqual({
      reporterEmail: "wax@example.com",
      reporterName: "Wade",
    });
  });

  it("drops receipt and reply email when the submitted address does not match the account", async () => {
    mockFindUnique.mockResolvedValue({
      email: "wax@example.com",
    } as never);

    await expect(
      resolveBugReportReporterContact({
        discogsUserId: 42,
        submittedEmail: "victim@example.com",
        submittedName: "Wade",
      }),
    ).resolves.toEqual({
      reporterName: "Wade",
    });
  });
});
