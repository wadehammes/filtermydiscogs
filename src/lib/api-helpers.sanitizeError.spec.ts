import { describe, expect, it } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { sanitizeError } from "src/lib/api-helpers";

const dbConnection503 = {
  message: "Database connection error. Please try again in a moment",
  code: "DB_CONNECTION_ERROR",
  status: 503,
};

describe("sanitizeError database connection classification", () => {
  it("when Prisma reports P1001, returns unified 503 DB_CONNECTION_ERROR", () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server",
      { code: "P1001", clientVersion: "7.10.1" },
    );

    expect(sanitizeError(error)).toEqual(dbConnection503);
  });

  it("when error carries ECONNRESET, returns 503 DB_CONNECTION_ERROR", () => {
    const error = new Error("read ECONNRESET");
    Object.assign(error, { code: "ECONNRESET" });

    const result = sanitizeError(error);

    expect(result).toEqual(dbConnection503);
  });

  it("when pg pool reports Connection terminated unexpectedly, returns 503 DB_CONNECTION_ERROR", () => {
    const result = sanitizeError(
      new Error("Connection terminated unexpectedly"),
    );

    expect(result).toEqual(dbConnection503);
  });

  it("when message is unrelated, returns generic 500 in production", () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = env.NODE_ENV;
    env.NODE_ENV = "production";

    const result = sanitizeError(new Error("Validation failed"));

    expect(result.status).toBe(500);
    expect(result.message).toBe("An unexpected error occurred");

    env.NODE_ENV = previousNodeEnv;
  });
});
