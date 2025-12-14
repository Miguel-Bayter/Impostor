import { describe, it, expect } from 'vitest';

describe('jwt utils', () => {
  it('generateToken y verifyToken funcionan', async () => {
    process.env.JWT_SECRET = 'testsecret';
    const jwt = await import('../../utils/jwt.js');
    const { generateToken, verifyToken, extractTokenFromHeader } = jwt;

    const token = generateToken('u1', 'user');
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.username).toBe('user');

    expect(extractTokenFromHeader(`Bearer ${token}`)).toBe(token);
    expect(extractTokenFromHeader('Basic abc')).toBeNull();
    expect(() => verifyToken('bad.token')).toThrow();
  });
});
