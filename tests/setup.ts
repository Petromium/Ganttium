/**
 * Test Setup File
 * Runs before all tests to configure the testing environment
 */

import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for testing if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/projectflow_test';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';
}

// Global test setup
beforeAll(async () => {
  // Set up test database connection
  // This could include:
  // - Creating test database if it doesn't exist
  // - Running migrations
  // - Seeding test data
  console.log('[Test Setup] Initializing test environment...');
});

// Global test teardown
afterAll(async () => {
  // Cleanup after all tests
  // This could include:
  // - Closing database connections
  // - Cleaning up test data
  console.log('[Test Setup] Cleaning up test environment...');
});

