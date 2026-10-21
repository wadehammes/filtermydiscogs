import "server-only";

import { Prisma } from "@prisma/client";
import {
  databaseConnectionErrorSanitized,
  isPrismaConnectionErrorCode,
} from "src/lib/databaseConnectionErrorMessage";

export type SanitizedApiError = {
  message: string;
  code?: string;
  status: number;
};

export const isPrismaClientKnownRequestError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

export const sanitizePrismaKnownRequestError = (
  error: unknown,
): SanitizedApiError | null => {
  if (!isPrismaClientKnownRequestError(error)) {
    return null;
  }

  if (isPrismaConnectionErrorCode(error.code)) {
    return databaseConnectionErrorSanitized();
  }

  if (error.code === "P2025") {
    return {
      message: "Record not found",
      code: "NOT_FOUND",
      status: 404,
    };
  }

  if (error.code === "P2002") {
    return {
      message: "Duplicate entry",
      code: "DUPLICATE_ENTRY",
      status: 409,
    };
  }

  return null;
};
