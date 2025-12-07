import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app';
import { registerRoutes } from '../../../server/routes';

describe('Security: A03 Injection Attacks', () => {
  beforeAll(async () => {
    // Register routes before testing
    await registerRoutes(app);
  });

  // Testing the Sanitize Middleware directly (Unit Test)
  it('sanitizeInput middleware should strip null bytes and control characters', async () => {
    const { sanitizeInput } = await import('../../../server/middleware/security');
    
    const req: any = {
      body: { name: 'test\0user', script: '<script>alert(1)</script>' },
      query: { search: "admin' OR '1'='1" },
      params: {},
    };
    const res: any = {};
    const next = vi.fn();
    
    sanitizeInput(req, res, next);
    
    expect(req.body.name).toBe('testuser'); // \0 stripped
    expect(next).toHaveBeenCalled();
  });

  // Integration test with SQL Injection payload
  it('should not execute SQL injection payload in search', async () => {
    // We assume the route /api/projects exists
    // Even if it returns 401 (unauthorized), it should not 500 (SQL error)
    const maliciousInput = "'; DROP TABLE users; --";
    
    const res = await request(app)
        .get(`/api/projects?search=${encodeURIComponent(maliciousInput)}`);
    
    // Should handle gracefully (401 Unauthorized or 200/404 with empty list)
    // Should NOT be 500
    expect(res.status).not.toBe(500);
  });
});
