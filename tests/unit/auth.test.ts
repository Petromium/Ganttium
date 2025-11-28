/**
 * Authentication Unit Tests
 * Tests for authentication, authorization, and security features
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword } from '../../server/auth';
import { createAuthenticatedUser } from '../fixtures/auth';

describe('Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20); // bcrypt hashes are long
    });

    it('should verify a correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('User Creation', () => {
    it('should create an authenticated user', async () => {
      const { user, organization, password } = await createAuthenticatedUser();
      
      expect(user).toBeDefined();
      expect(organization).toBeDefined();
      expect(password).toBeDefined();
      expect(user.emailVerified).toBe(true);
    });
  });
});

