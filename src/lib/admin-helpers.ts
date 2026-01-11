/**
 * Admin authorization utilities
 */

import { discogsOAuthService } from "src/services/discogs-oauth.service";

/**
 * Check if a user ID matches the admin user ID
 * NOTE: This is NOT secure on its own - use verifyAdminUser() for secure verification
 * @param userId - The user ID to check
 * @returns true if the user ID matches admin, false otherwise
 */
export function isAdminUser(userId: number): boolean {
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!adminUserId) {
    return false;
  }

  const adminUserIdNum = parseInt(adminUserId, 10);

  if (Number.isNaN(adminUserIdNum)) {
    return false;
  }

  return userId === adminUserIdNum;
}

/**
 * Securely verify that the authenticated user is an admin by verifying their identity
 * with Discogs API using their OAuth tokens. This prevents cookie tampering attacks.
 * @param accessToken - OAuth access token from cookies
 * @param accessTokenSecret - OAuth access token secret from cookies
 * @returns Promise that resolves to true if user is admin, false otherwise
 */
export async function verifyAdminUser(
  accessToken: string | undefined,
  accessTokenSecret: string | undefined,
): Promise<boolean> {
  if (!(accessToken && accessTokenSecret)) {
    return false;
  }

  try {
    const identity = await discogsOAuthService.getIdentity(
      accessToken,
      accessTokenSecret,
    );

    return isAdminUser(identity.id);
  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}
