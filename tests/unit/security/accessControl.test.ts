import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app';
import { registerRoutes } from '../../../server/routes';

describe('Security: A01 Broken Access Control', () => {
  beforeAll(async () => {
    await registerRoutes(app);
  });

  it('should default to deny for unknown routes', async () => {
    const res = await request(app).get('/api/admin/secret-backdoor');
    // Should be 404
    expect(res.status).toBe(404);
  });
  
  it('should reject unauthenticated access to protected routes', async () => {
    // /api/organizations is protected
    const res = await request(app).get('/api/organizations');
    // Expect 401 Unauthorized or 403 Forbidden
    // If it returns 404, it means the route doesn't exist or is hidden
    expect([401, 403]).toContain(res.status);
  });
});
