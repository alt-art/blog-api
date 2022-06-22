import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

export async function generateSecret() {
  return randomBytes(48).toString('hex');
}

export async function encrypt(text: string, secret: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(`${text}${secret}`, salt);
}

export async function compare(text: string, encrypted: string, secret: string) {
  return bcrypt.compare(`${text}${secret}`, encrypted);
}
