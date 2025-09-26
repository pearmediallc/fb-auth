import CryptoJS from 'crypto-js';

export function encryptToken(token: string): string {
  const key = process.env.ENCRYPTION_KEY as string;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set');
  }
  return CryptoJS.AES.encrypt(token, key).toString();
}

export function decryptToken(encryptedToken: string): string {
  const key = process.env.ENCRYPTION_KEY as string;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set');
  }
  const decrypted = CryptoJS.AES.decrypt(encryptedToken, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
}