export const TRANSIENT_NODE_CONNECTION_CODES = [
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ETIMEDOUT",
] as const;

const transientNodeConnectionCodeSet = new Set<string>(
  TRANSIENT_NODE_CONNECTION_CODES,
);

export const PRISMA_CONNECTION_ERROR_CODES = new Set(["P1001"]);

export const isPrismaConnectionErrorCode = (code: string): boolean =>
  PRISMA_CONNECTION_ERROR_CODES.has(code);

export const isTransientNodeConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const code = String((error as { code: unknown }).code);
  return transientNodeConnectionCodeSet.has(code);
};

export const DATABASE_CONNECTION_ERROR_USER_MESSAGE =
  "Database connection error. Please try again in a moment";

export const databaseConnectionErrorSanitized = () => ({
  message: DATABASE_CONNECTION_ERROR_USER_MESSAGE,
  code: "DB_CONNECTION_ERROR",
  status: 503,
});

const DATABASE_CONNECTION_MESSAGE_MARKERS = [
  "can't reach database",
  "too many connections",
  "failed to connect to upstream database",
  "insufficient resources",
  "connection terminated",
  "terminated unexpectedly",
  "connection refused",
  "connection timeout",
  "connect timeout",
  "connect econnreset",
  "socket hang up",
  "p1001",
] as const;

export const isDatabaseConnectionErrorMessage = (message: string): boolean => {
  const lower = message.toLowerCase();

  return DATABASE_CONNECTION_MESSAGE_MARKERS.some((marker) =>
    lower.includes(marker),
  );
};

export const isTransientDatabaseConnectionFailure = (
  error: unknown,
): boolean => {
  if (isTransientNodeConnectionError(error)) {
    return true;
  }

  if (error instanceof Error) {
    return isDatabaseConnectionErrorMessage(error.message);
  }

  return false;
};
