import { describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";
import {
  createPaginatedResponse,
  getPaginationParams,
  wantsAllResults,
} from "src/lib/api-helpers";

describe("wantsAllResults", () => {
  it("when all=true is present, returns true", () => {
    const request = new NextRequest("http://localhost/api/crates?all=true");

    expect(wantsAllResults(request)).toBe(true);
  });

  it("when all is absent or not true, returns false", () => {
    expect(
      wantsAllResults(new NextRequest("http://localhost/api/crates")),
    ).toBe(false);
    expect(
      wantsAllResults(new NextRequest("http://localhost/api/crates?all=false")),
    ).toBe(false);
  });
});

describe("getPaginationParams", () => {
  it("when all=true, returns a single capped page", () => {
    const request = new NextRequest("http://localhost/api/crates?all=true");

    expect(getPaginationParams(request, { allMaxTake: 200 })).toEqual({
      skip: 0,
      take: 200,
      page: 1,
      pageSize: 200,
      all: true,
    });
  });

  it("parses page and pageSize with sane bounds", () => {
    const request = new NextRequest(
      "http://localhost/api/crates?page=3&pageSize=25",
    );

    expect(getPaginationParams(request)).toEqual({
      skip: 50,
      take: 25,
      page: 3,
      pageSize: 25,
      all: false,
    });
  });

  it("clamps invalid page and pageSize values", () => {
    const request = new NextRequest(
      "http://localhost/api/crates?page=0&pageSize=500",
    );

    expect(getPaginationParams(request)).toEqual({
      skip: 0,
      take: 100,
      page: 1,
      pageSize: 100,
      all: false,
    });
  });
});

describe("createPaginatedResponse", () => {
  it("returns data and pagination metadata", async () => {
    const response = createPaginatedResponse(["a", "b"], 10, 1, 2);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: ["a", "b"],
      pagination: {
        page: 1,
        pageSize: 2,
        total: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    });
  });
});
