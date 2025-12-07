import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/app';
import { registerRoutes } from '../../../server/routes';

describe('Security: A07 Identification and Authentication Failures', () => {
  beforeAll(async () => {
    await registerRoutes(app);
  });

  it('should rate limit authentication attempts', async () => {
    // We use a specific IP for this test to avoid interfering with others
    const testIp = '192.168.1.100';
    
    const responses = [];
    // Limit is 5. We try 7 times.
    for (let i = 0; i < 7; i++) {
        const res = await request(app)
            .post('/api/auth/login')
            .set('X-Forwarded-For', testIp)
            .send({ username: 'rate-limit-test@example.com', password: 'wrong' });
        responses.push(res.status);
    }
    
    // The limit is 5 per 15 min. The 6th and 7th should be 429.
    const rateLimited = responses.some(status => status === 429);
    expect(rateLimited).toBe(true);
  });

  it('should reject weak passwords', async () => {
    // Use a different IP to avoid rate limiting from previous test
    const testIp = '192.168.1.101';
    
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', testIp)
      .send({ username: 'weak@example.com', password: '123' });
      
    // Should be 400 Bad Request
    expect(res.status).toBe(400); 
  });
});
