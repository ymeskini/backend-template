import { decrypt, encrypt } from './encryption';
import crypto from 'crypto';

describe('encryption', () => {
  const key = crypto.randomBytes(32).toString('base64');

  it('should encrypt and decrypt', () => {
    const text =
      'this is a secret that should not be shared and should be securely stored somewhere';
    const encrypted = encrypt(text, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(text);
  });
});
