import { describe, it, expect } from 'vitest';
import sanitizer from '../../utils/sanitizer.js';

const {
  sanitizeClue,
  sanitizeUsername,
  sanitizeEmail,
  sanitizeString,
  sanitizeRoomName,
  isValidAfterSanitization,
  LIMITS,
} = sanitizer;

describe('sanitizer', () => {
  it('sanitizeClue escapa HTML y normaliza', () => {
    const s = sanitizeClue(' <script>x</script>   hola ');
    const expectedA = '&lt;script&gt;x&lt;/script&gt; hola';
    const expectedB = '&lt;script&gt;x&lt;&#x2F;script&gt; hola';
    expect([expectedA, expectedB]).toContain(s);
    expect(s.length).toBeLessThanOrEqual(LIMITS.CLUE_MAX_LENGTH);
  });

  it('sanitizeUsername remueve no permitidos y limita longitud', () => {
    const s = sanitizeUsername('José<script>_User 123!!');
    expect(s.includes('<')).toBe(false);
    expect(s).toMatch(/^[\w\-\sáéíóúÁÉÍÓÚñÑüÜ]+$/);
    expect(s.length).toBeLessThanOrEqual(LIMITS.USERNAME_MAX_LENGTH);
  });

  it('sanitizeEmail valida formato y lowercase', () => {
    expect(sanitizeEmail('BAD')).toBeNull();
    expect(sanitizeEmail('Test@Example.com')).toBe('test@example.com');
  });

  it('sanitizeString y sanitizeRoomName limitan y escapan', () => {
    const s = sanitizeString('  <b>hola</b>   ', 30);
    const expectedA = '&lt;b&gt;hola&lt;/b&gt;';
    const expectedB = '&lt;b&gt;hola&lt;&#x2F;b&gt;';
    expect([expectedA, expectedB]).toContain(s);
    const r = sanitizeRoomName(' <i>Sala</i> ');
    const expectedRoomA = '&lt;i&gt;Sala&lt;/i&gt;';
    const expectedRoomB = '&lt;i&gt;Sala&lt;&#x2F;i&gt;';
    expect([expectedRoomA, expectedRoomB]).toContain(r);
  });

  it('isValidAfterSanitization valida no vacío', () => {
    expect(isValidAfterSanitization(' a ')).toBe(true);
    expect(isValidAfterSanitization('   ')).toBe(false);
  });
});
