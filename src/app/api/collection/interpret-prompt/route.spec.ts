import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

const mockInterpretIntent: CollectionCommandIntent = {
  searchQuery: "",
  selectedStyles: ["Techno"],
  selectedYears: [],
  selectedFormats: ["Vinyl"],
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  yearStartInclusive: 0,
  yearEndExclusive: 0,
};

jest.mock("src/lib/api-helpers");
jest.mock("src/lib/collection-command-interpret.server", () => ({
  interpretCollectionCommandPrompt: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/collection/interpret-prompt/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type InterpretModule =
  typeof import("src/lib/collection-command-interpret.server");

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockInterpret: jest.MockedFunction<
  InterpretModule["interpretCollectionCommandPrompt"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const route = await import("src/app/api/collection/interpret-prompt/route");
  POST = route.POST;
});

beforeEach(async () => {
  const apiHelpers = await import("src/lib/api-helpers");
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );

  const interpretModule = await import(
    "src/lib/collection-command-interpret.server"
  );
  mockInterpret = jest.mocked(interpretModule.interpretCollectionCommandPrompt);
});

describe("POST /api/collection/interpret-prompt", () => {
  it("returns 401 when session is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      new NextRequest("http://localhost/api/collection/interpret-prompt", {
        method: "POST",
        body: JSON.stringify({ prompt: "techno vinyl" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns intent when interpret succeeds", async () => {
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockInterpret.mockResolvedValue({
      intent: mockInterpretIntent,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/collection/interpret-prompt", {
        method: "POST",
        body: JSON.stringify({ prompt: "techno on vinyl" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      intent: { selectedStyles: string[] };
    };
    expect(body.intent.selectedStyles).toContain("Techno");
  });
});
