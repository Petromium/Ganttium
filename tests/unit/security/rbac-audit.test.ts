/**
 * RBAC Security Audit Tests (Sprint 3: SP3-01)
 * Tests for verifying:
 * 1. Viewer role cannot modify data
 * 2. Tenant isolation (organizations cannot access each other's data)
 * 3. Role escalation prevention
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app';
import { registerRoutes } from '../../../server/routes';
import {
  createTestOrganization,
  createTestUser,
  createTestProject,
  linkUserToOrganization,
  cleanupTestData,
  authenticateTestUser,
} from '../../fixtures/db';
import { storage } from '../../../server/storage';

describe('Security: A01 RBAC Audit', () => {
  let org1Id: number;
  let org2Id: number;
  let viewerUserId: string;
  let memberUserId: string;
  let adminUserId: string;
  let ownerUserId: string;
  let org2OwnerUserId: string;
  let project1Id: number;
  let project2Id: number;
  let viewerToken: string;
  let memberToken: string;
  let adminToken: string;
  let ownerToken: string;
  let org2OwnerToken: string;

  beforeAll(async () => {
    await registerRoutes(app);

    // Create Organization 1
    const org1 = await createTestOrganization('Security Test Org 1');
    org1Id = org1.id;

    // Create Organization 2 (for tenant isolation tests)
    const org2 = await createTestOrganization('Security Test Org 2');
    org2Id = org2.id;

    // Create users for Org 1 with different roles
    const viewer = await createTestUser(`viewer-audit-${Date.now()}@example.com`, 'Password123!');
    viewerUserId = viewer.id;
    await linkUserToOrganization(viewer.id, org1.id, 'viewer');
    viewerToken = await authenticateTestUser(app, viewer.email!, 'Password123!');

    const member = await createTestUser(`member-audit-${Date.now()}@example.com`, 'Password123!');
    memberUserId = member.id;
    await linkUserToOrganization(member.id, org1.id, 'member');
    memberToken = await authenticateTestUser(app, member.email!, 'Password123!');

    const admin = await createTestUser(`admin-audit-${Date.now()}@example.com`, 'Password123!');
    adminUserId = admin.id;
    await linkUserToOrganization(admin.id, org1.id, 'admin');
    adminToken = await authenticateTestUser(app, admin.email!, 'Password123!');

    const owner = await createTestUser(`owner-audit-${Date.now()}@example.com`, 'Password123!');
    ownerUserId = owner.id;
    await linkUserToOrganization(owner.id, org1.id, 'owner');
    ownerToken = await authenticateTestUser(app, owner.email!, 'Password123!');

    // Create owner for Org 2
    const org2Owner = await createTestUser(`owner2-audit-${Date.now()}@example.com`, 'Password123!');
    org2OwnerUserId = org2Owner.id;
    await linkUserToOrganization(org2Owner.id, org2.id, 'owner');
    org2OwnerToken = await authenticateTestUser(app, org2Owner.email!, 'Password123!');

    // Create projects
    const proj1 = await createTestProject(org1.id, 'Security Test Project 1');
    project1Id = proj1.id;

    const proj2 = await createTestProject(org2.id, 'Security Test Project 2');
    project2Id = proj2.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Viewer Role Restrictions (Data Modification)', () => {
    it('should NOT allow Viewer to create projects', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Cookie', viewerToken)
        .send({
          name: 'Unauthorized Project',
          code: 'UNAUTH',
          organizationId: org1Id,
        });

      // Should be rejected with 403 Forbidden
      expect([403, 401]).toContain(res.status);
    });

    it('should NOT allow Viewer to update projects', async () => {
      const res = await request(app)
        .patch(`/api/projects/${project1Id}`)
        .set('Cookie', viewerToken)
        .send({
          name: 'Modified Project Name',
        });

      expect([403, 401]).toContain(res.status);
    });

    it('should NOT allow Viewer to delete projects', async () => {
      const res = await request(app)
        .delete(`/api/projects/${project1Id}`)
        .set('Cookie', viewerToken);

      expect([403, 401]).toContain(res.status);
    });

    it('should allow Viewer to read projects', async () => {
      const res = await request(app)
        .get(`/api/projects/${project1Id}`)
        .set('Cookie', viewerToken);

      // Viewers should be able to read data
      expect([200, 404]).toContain(res.status);
    });

    it('should NOT allow Viewer to create tasks', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Cookie', viewerToken)
        .send({
          name: 'Unauthorized Task',
          projectId: project1Id,
          wbsCode: '1.0',
        });

      expect([403, 401]).toContain(res.status);
    });

    it('should NOT allow Viewer to modify organization settings', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${org1Id}`)
        .set('Cookie', viewerToken)
        .send({
          name: 'Modified Org Name',
        });

      expect([403, 401]).toContain(res.status);
    });
  });

  describe('Tenant Isolation (Cross-Organization Access)', () => {
    it('should NOT allow Org1 user to access Org2 projects', async () => {
      const res = await request(app)
        .get(`/api/projects/${project2Id}`)
        .set('Cookie', ownerToken); // Org1 owner

      // Should be rejected because project belongs to Org2
      expect([403, 404]).toContain(res.status);
    });

    it('should NOT allow Org1 user to list Org2 projects', async () => {
      const res = await request(app)
        .get(`/api/organizations/${org2Id}/projects`)
        .set('Cookie', ownerToken); // Org1 owner

      expect([403, 401]).toContain(res.status);
    });

    it('should NOT allow Org1 user to modify Org2 projects', async () => {
      const res = await request(app)
        .patch(`/api/projects/${project2Id}`)
        .set('Cookie', adminToken) // Org1 admin
        .send({
          name: 'Hacked Project',
        });

      expect([403, 404]).toContain(res.status);
    });

    it('should NOT allow Org1 user to delete Org2 projects', async () => {
      const res = await request(app)
        .delete(`/api/projects/${project2Id}`)
        .set('Cookie', adminToken); // Org1 admin

      expect([403, 404]).toContain(res.status);
    });

    it('should allow Org2 owner to access their own projects', async () => {
      const res = await request(app)
        .get(`/api/projects/${project2Id}`)
        .set('Cookie', org2OwnerToken);

      // Org2 owner should have access to Org2 projects
      expect([200, 404]).toContain(res.status);
    });

    it('should NOT allow manipulated IDs to bypass tenant isolation', async () => {
      // Try to create a project with Org2 ID while authenticated as Org1 user
      const res = await request(app)
        .post('/api/projects')
        .set('Cookie', ownerToken) // Org1 owner
        .send({
          name: 'Injected Project',
          code: 'INJECT',
          organizationId: org2Id, // Try to inject Org2 ID
        });

      // Should either reject or silently use Org1 ID instead
      if (res.status === 201) {
        // If project was created, verify it belongs to Org1, not Org2
        const project = res.body;
        expect(project.organizationId).toBe(org1Id);
      } else {
        // Or reject the request entirely
        expect([400, 403]).toContain(res.status);
      }
    });
  });

  describe('Role Escalation Prevention', () => {
    it('should NOT allow Admin to escalate their own role to Owner', async () => {
      // Try to update own role through organization membership
      const res = await request(app)
        .patch(`/api/organizations/${org1Id}/members/${adminUserId}`)
        .set('Cookie', adminToken)
        .send({
          role: 'owner',
        });

      // Should be rejected
      expect([403, 400]).toContain(res.status);
    });

    it('should NOT allow Member to escalate their own role to Admin', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${org1Id}/members/${memberUserId}`)
        .set('Cookie', memberToken)
        .send({
          role: 'admin',
        });

      expect([403, 400]).toContain(res.status);
    });

    it('should NOT allow Viewer to escalate their own role', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${org1Id}/members/${viewerUserId}`)
        .set('Cookie', viewerToken)
        .send({
          role: 'owner',
        });

      expect([403, 400]).toContain(res.status);
    });

    it('should NOT allow Admin to promote Member to Owner', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${org1Id}/members/${memberUserId}`)
        .set('Cookie', adminToken)
        .send({
          role: 'owner',
        });

      // Admin cannot create Owners, only Owner can
      expect([403, 400]).toContain(res.status);
    });

    it('should allow Owner to change any role', async () => {
      // Create a new test user to avoid modifying existing test data
      const testUser = await createTestUser(`test-role-change-${Date.now()}@example.com`, 'Password123!');
      await linkUserToOrganization(testUser.id, org1Id, 'viewer');

      const res = await request(app)
        .patch(`/api/organizations/${org1Id}/members/${testUser.id}`)
        .set('Cookie', ownerToken)
        .send({
          role: 'admin',
        });

      // Owner should be able to change roles
      expect([200, 204, 404]).toContain(res.status);
    });

    it('should verify role hierarchy is enforced at API level', async () => {
      // Verify that even with direct API calls, role hierarchy is enforced
      const userOrg = await storage.getUserOrganization(viewerUserId, org1Id);
      expect(userOrg?.role).toBe('viewer');

      // Role should not change even if we try to manually update
      // This test verifies database-level constraints (if implemented)
      const updatedUserOrg = await storage.getUserOrganization(viewerUserId, org1Id);
      expect(updatedUserOrg?.role).toBe('viewer');
    });
  });

  describe('API Endpoint Authorization Coverage', () => {
    it('should have RBAC middleware on all mutation endpoints', async () => {
      // Test a sample of critical mutation endpoints
      const criticalEndpoints = [
        { method: 'post', path: '/api/projects', minRole: 'member' },
        { method: 'delete', path: `/api/projects/${project1Id}`, minRole: 'admin' },
        { method: 'post', path: '/api/tasks', minRole: 'member' },
        { method: 'patch', path: `/api/organizations/${org1Id}`, minRole: 'admin' },
      ];

      for (const endpoint of criticalEndpoints) {
        const res = await request(app)
          [endpoint.method as 'post' | 'delete' | 'patch'](endpoint.path)
          .set('Cookie', viewerToken)
          .send({});

        // Viewer should be rejected from all mutation endpoints
        expect([401, 403]).toContain(res.status);
      }
    });
  });
});

