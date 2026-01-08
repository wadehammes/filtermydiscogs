/**
 * Audit logging for database write operations and sensitive actions
 */

interface AuditLogEntry {
  timestamp: Date;
  userId: number | null;
  operation: string;
  model: string;
  action: "create" | "update" | "delete" | "bulk_delete";
  recordId?: string;
  metadata?: Record<string, unknown>;
}

const auditLogs: AuditLogEntry[] = [];

/**
 * Log a database write operation
 */
export function auditLog(
  userId: number | null,
  operation: string,
  model: string,
  action: AuditLogEntry["action"],
  recordId?: string,
  metadata?: Record<string, unknown>,
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date(),
    userId,
    operation,
    model,
    action,
    ...(recordId !== undefined && { recordId }),
    ...(metadata !== undefined && { metadata }),
  };

  auditLogs.push(entry);

  // Keep only last 1000 entries in memory
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }

  // Log sensitive operations immediately
  if (action === "delete" || action === "bulk_delete") {
    console.warn("[AUDIT] Sensitive operation:", {
      userId,
      operation,
      model,
      action,
      recordId,
      timestamp: entry.timestamp.toISOString(),
    });
  } else if (process.env.NODE_ENV === "development") {
    console.log("[AUDIT]", entry);
  }
}

/**
 * Get audit logs for a specific user
 */
export function getAuditLogsForUser(
  userId: number,
  limit = 100,
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Get audit logs for a specific model/operation
 */
export function getAuditLogsForOperation(
  model: string,
  action?: AuditLogEntry["action"],
  limit = 100,
): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.model === model && (!action || log.action === action))
    .slice(-limit)
    .reverse();
}

/**
 * Get recent sensitive operations
 */
export function getSensitiveOperations(limit = 50): AuditLogEntry[] {
  return auditLogs
    .filter((log) => log.action === "delete" || log.action === "bulk_delete")
    .slice(-limit)
    .reverse();
}

/**
 * Get audit statistics
 */
export function getAuditStats() {
  const totalOperations = auditLogs.length;
  const byAction = auditLogs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const byModel = auditLogs.reduce(
    (acc, log) => {
      acc[log.model] = (acc[log.model] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalOperations,
    byAction,
    byModel,
    recentOperations: auditLogs.slice(-20).reverse(),
  };
}
