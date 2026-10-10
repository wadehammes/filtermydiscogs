import { jest } from "@jest/globals";
import { NextResponse } from "next/server";

const actual =
  jest.requireActual<typeof import("../api-helpers")>("../api-helpers");

const stubCreateErrorResponse = (error: unknown) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : "Unknown error" },
    { status: 500 },
  );

export const rethrowNextInternalError = jest.fn(
  actual.rethrowNextInternalError,
);

export const logSanitizedApiRouteFailure = jest.fn((error: unknown) => {
  stubCreateErrorResponse(error);
  return { status: 500 };
});

export const createErrorResponse = jest.fn(stubCreateErrorResponse);

export const sanitizeError = jest.fn(actual.sanitizeError);

export const getVerifiedUserFromRequestWithRateLimit = jest.fn();

export const checkRateLimitWithResponse = jest.fn(
  actual.checkRateLimitWithResponse,
);

export const wantsAllResults = jest.fn(actual.wantsAllResults);

export const getPaginationParams = jest.fn(actual.getPaginationParams);

export const createPaginatedResponse = jest.fn(actual.createPaginatedResponse);

export const auditDatabaseOperation = jest.fn();

export const fetchPublicCrateMetadata = jest.fn();

export type { VerifiedDiscogsUser } from "../api-helpers";
