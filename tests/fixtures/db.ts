/**
 * Database Test Fixtures
 * Utilities for setting up and tearing down test database state
 */

import { db } from '../../server/db';
import { storage } from '../../server/storage';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a test organization
 */
export async function createTestOrganization(name = 'Test Organization') {
  const org = await storage.createOrganization({
    name,
    slug: `test-org-${Date.now()}`,
  });
  return org;
}

/**
 * Create a test user
 */
export async function createTestUser(email = `test-${Date.now()}@example.com`, password?: string) {
  const { hashPassword } = await import('../../server/auth');
  
  const userId = `user-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const passwordHash = password ? await hashPassword(password) : null;

  const [user] = await db
    .insert(schema.users)
    .values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: true,
      firstName: 'Test',
      lastName: 'User',
    })
    .returning();

  return user;
}

/**
 * Create a test project
 */
export async function createTestProject(organizationId: number, name = 'Test Project') {
  const project = await storage.createProject({
    organizationId,
    name,
    code: `TEST-${Date.now()}`,
    status: 'active',
  });
  return project;
}

/**
 * Link user to organization
 */
export async function linkUserToOrganization(
  userId: string,
  organizationId: number,
  role: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
) {
  return await storage.createUserOrganization({
    userId,
    organizationId,
    role,
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  // Clean up in reverse order of dependencies
  // This is a simple cleanup - in production, you'd want more sophisticated cleanup
  try {
    // Note: In a real scenario, you'd want to delete all test data
    // For now, this is a placeholder that you can extend
    console.log('[Test Cleanup] Cleaning up test data...');
  } catch (error) {
    console.error('[Test Cleanup] Error cleaning up:', error);
  }
}

/**
 * Reset test database (use with caution)
 */
export async function resetTestDatabase() {
  // This would truncate all tables or drop/recreate the test database
  // Only use in isolated test environments
  console.warn('[Test Cleanup] Database reset requested - implement with caution');
}

