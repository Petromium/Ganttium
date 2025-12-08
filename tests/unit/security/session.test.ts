import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';

// Mock dependencies before importing auth
vi.mock('connect-pg-simple', () => {
  return {
    default: (session: any) => {
      return class MockStore extends session.Store {
        constructor(options: any) {
          super(options);
        }
        get = (sid: string, cb: any) => cb(null, {});
        set = (sid: string, sess: any, cb: any) => cb(null);
        destroy = (sid: string, cb: any) => cb(null);
        touch = (sid: string, sess: any, cb: any) => cb(null);
      };
    }
  };
});

// Mock db to avoid connection attempts
vi.mock('../../../server/db', () => ({
  db: {
    execute: vi.fn(),
  },
  pool: {
    connect: vi.fn(),
  }
}));

describe('Security: A07 Session Management', () => {
  
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should set secure cookies in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'test-secret-must-be-at-least-32-chars-long');
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/db');

    // Import auth module after mocking
    const { getSession } = await import('../../../server/auth');
    
    const app = express();
    // Important: Trust proxy must be enabled for secure cookies to work in supertest/behind proxies
    app.set('trust proxy', 1);
    app.use(getSession());
    
    app.get('/', (req, res) => {
      // Trigger session creation
      (req.session as any).test = 'value';
      res.status(200).send('ok');
    });

    // We must simulate HTTPS for the secure cookie to be set
    const res = await request(app)
      .get('/')
      .set('X-Forwarded-Proto', 'https'); // Simulate HTTPS
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies?.find((c: string) => c.startsWith('sessionId='));
    expect(sessionCookie).toBeDefined();
    
    // Verify Secure flag is present
    expect(sessionCookie).toContain('Secure');
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
  });

  it('should NOT set secure cookies in development environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SESSION_SECRET', 'test-secret-must-be-at-least-32-chars-long');
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/db');

    const { getSession } = await import('../../../server/auth');
    
    const app = express();
    app.use(getSession());
    
    app.get('/', (req, res) => {
      (req.session as any).test = 'value';
      res.status(200).send('ok');
    });

    const res = await request(app).get('/');
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies?.find((c: string) => c.startsWith('sessionId='));
    expect(sessionCookie).toBeDefined();
    
    // Verify Secure flag is ABSENT
    expect(sessionCookie).not.toContain('Secure');
    expect(sessionCookie).toContain('HttpOnly');
  });
});
