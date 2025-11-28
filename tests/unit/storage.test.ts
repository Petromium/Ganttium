/**
 * Storage Layer Unit Tests
 * Tests for database operations and data access layer
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../../server/storage';
import { createTestOrganization, createTestUser, linkUserToOrganization, cleanupTestData } from '../fixtures/db';

describe('Storage Layer', () => {
  let testOrgId: number;
  let testUserId: string;

  beforeAll(async () => {
    // Set up test data
    const org = await createTestOrganization();
    testOrgId = org.id;
    const user = await createTestUser();
    testUserId = user.id;
    await linkUserToOrganization(user.id, org.id, 'owner');
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('User Operations', () => {
    it('should create a user', async () => {
      const email = `test-create-${Date.now()}@example.com`;
      const user = await createTestUser(email);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(email.toLowerCase());
    });

    it('should retrieve a user by ID', async () => {
      const user = await storage.getUser(testUserId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it('should retrieve a user by email', async () => {
      const email = `test-retrieve-${Date.now()}@example.com`;
      const user = await createTestUser(email);
      const retrieved = await storage.getUserByEmail(email);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(user.id);
    });
  });

  describe('Organization Operations', () => {
    it('should create an organization', async () => {
      const org = await createTestOrganization('Test Org CRUD');
      expect(org).toBeDefined();
      expect(org.name).toBe('Test Org CRUD');
    });

    it('should retrieve an organization by ID', async () => {
      const org = await storage.getOrganization(testOrgId);
      expect(org).toBeDefined();
      expect(org?.id).toBe(testOrgId);
    });

    it('should retrieve organizations by user', async () => {
      const orgs = await storage.getOrganizationsByUser(testUserId);
      expect(Array.isArray(orgs)).toBe(true);
      expect(orgs.length).toBeGreaterThan(0);
    });
  });

  describe('Project Operations', () => {
    it('should create a project', async () => {
      const project = await storage.createProject({
        organizationId: testOrgId,
        name: 'Test Project',
        code: `TEST-${Date.now()}`,
        status: 'active',
      });

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.organizationId).toBe(testOrgId);
    });

    it('should retrieve projects by organization', async () => {
      const projects = await storage.getProjectsByOrganization(testOrgId);
      expect(Array.isArray(projects)).toBe(true);
    });
  });
});

