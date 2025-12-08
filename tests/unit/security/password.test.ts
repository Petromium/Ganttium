import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../server/auth';

describe('Security: A02 Cryptographic Failures (Password Hashing)', () => {
  
  it('should use bcrypt with a cost factor of at least 10', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    // Bcrypt hash format: $2b$[cost]$[salt][hash]
    // Example: $2b$12$abcdefghijklmnopqrstuv...
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    
    // Check for bcrypt prefix ($2a$, $2b$, or $2y$)
    expect(hash).toMatch(/^\$2[aby]\$/);

    // Extract cost factor
    const parts = hash.split('$');
    const cost = parseInt(parts[2], 10);

    expect(cost).toBeGreaterThanOrEqual(10);
    expect(cost).toBe(12); // Specifically expect 12 as per our config
  });

  it('should verify correct passwords successfully', async () => {
    const password = 'CorrectPassword';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const password = 'CorrectPassword';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword', hash);
    
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password (salting)', async () => {
    const password = 'SamePassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).not.toBe(hash2);
  });
});

