import { describe, it, expect } from 'vitest';

describe('frontend config', () => {
  it('APP_CONFIG y SERVER_URL están definidos', async () => {
    await import('../config.js');
    expect(window.APP_CONFIG).toBeTruthy();
    expect(typeof window.APP_CONFIG.SERVER_URL).toBe('string');
    expect(window.APP_CONFIG.SERVER_URL.length).toBeGreaterThan(0);
  });
});
