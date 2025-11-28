/**
 * Authentication Test Fixtures
 * Utilities for testing authentication flows
 */

import { createTestUser, createTestOrganization, linkUserToOrganization } from './db';

/**
 * Create an authenticated test user session
 */
export async function createAuthenticatedUser() {
  const password = 'TestPassword123!';
  const user = await createTestUser(undefined, password);
  const org = await createTestOrganization();
  await linkUserToOrganization(user.id, org.id, 'owner');

  return {
    user,
    organization: org,
    password,
    userId: user.id,
    organizationId: org.id,
  };
}

/**
 * Create a test session for API requests
 */
export async function createTestSession(userId: string, organizationId: number) {
  // In a real test scenario, you'd create a session using the session store
  // This is a placeholder that you can extend based on your session implementation
  return {
    userId,
    organizationId,
    // Add other session properties as needed
  };
}

