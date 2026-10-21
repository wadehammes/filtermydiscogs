import { describe, expect, it } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { sanitizePrismaKnownRequestError } from "src/lib/prismaKnownRequestError.server";

const buildKnownRequestError = (code: string, message = "Prisma error") =>
  new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: "7.10.1",
  });

describe("sanitizePrismaKnownRequestError", () => {
  it("when code is P1001, returns 503 DB_CONNECTION_ERROR", () => {
    expect(
      sanitizePrismaKnownRequestError(buildKnownRequestError("P1001")),
    ).toEqual({
      message: "Database connection error. Please try again in a moment",
      code: "DB_CONNECTION_ERROR",
      status: 503,
    });
  });

  it("when code is P2025, returns 404 NOT_FOUND", () => {
    expect(
      sanitizePrismaKnownRequestError(buildKnownRequestError("P2025")),
    ).toEqual({
      message: "Record not found",
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("when error is not a Prisma known request error, returns null", () => {
    expect(sanitizePrismaKnownRequestError(new Error("boom"))).toBeNull();
  });
});
