import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies
vi.mock('../../../server/db', () => ({
  db: { execute: vi.fn() },
  pool: { connect: vi.fn() }
}));

describe('Security: A05 CORS Lockdown', () => {
  let app: express.Express;

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'test-secret-must-be-at-least-32-chars-long-for-production');
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/db');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com,https://app.example.com');

    // Import after env stubbing
    const { app: expressApp } = await import('../../../server/app');
    app = expressApp;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('should allow requests from whitelisted origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    
    const allowedOrigin = res.headers['access-control-allow-origin'];
    expect(allowedOrigin).toBe('https://example.com');
  });

  it('should reject requests from non-whitelisted origins in production', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.com');
    
    // Should either reject with 403 or not set CORS headers
    if (res.status === 403) {
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not allowed');
    } else {
      // If not rejecting, should at least not return the evil origin
      const allowedOrigin = res.headers['access-control-allow-origin'];
      expect(allowedOrigin).not.toBe('https://evil.com');
    }
  });

  it('should NEVER use wildcard (*) for Access-Control-Allow-Origin in production', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://random-site.com');
    
    const allowedOrigin = res.headers['access-control-allow-origin'];
    
    // Wildcard is a critical security issue when credentials are enabled
    expect(allowedOrigin).not.toBe('*');
  });

  it('should set Access-Control-Allow-Credentials to true', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://example.com');
    
    const allowCredentials = res.headers['access-control-allow-credentials'];
    expect(allowCredentials).toBe('true');
  });

  it('should handle preflight OPTIONS requests correctly', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');
    
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
  });

  it('should set appropriate Access-Control-Max-Age for preflight caching', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'https://example.com');
    
    const maxAge = res.headers['access-control-max-age'];
    expect(maxAge).toBeDefined();
    
    // Should be at least 1 hour (3600 seconds) for performance
    const maxAgeValue = parseInt(maxAge, 10);
    expect(maxAgeValue).toBeGreaterThanOrEqual(3600);
  });

  it('should restrict allowed methods to necessary ones only', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'https://example.com');
    
    const allowedMethods = res.headers['access-control-allow-methods'];
    expect(allowedMethods).toBeDefined();
    
    // Should include common methods
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');
    
    // Should NOT include dangerous methods like TRACE
    expect(allowedMethods).not.toContain('TRACE');
    expect(allowedMethods).not.toContain('CONNECT');
  });
});

describe('Security: A05 CORS Development Mode', () => {
  let app: express.Express;

  beforeAll(async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SESSION_SECRET', 'test-secret-development');
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/db');

    // Import after env stubbing
    const { app: expressApp } = await import('../../../server/app');
    app = expressApp;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('should be more permissive in development mode', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');
    
    // In development, should allow localhost origins
    const allowedOrigin = res.headers['access-control-allow-origin'];
    expect(allowedOrigin).toBeDefined();
    
    // Should either be the requested origin or a default localhost
    expect(
      allowedOrigin === 'http://localhost:3000' ||
      allowedOrigin === 'http://localhost:5000' ||
      allowedOrigin?.includes('localhost')
    ).toBe(true);
  });
});

