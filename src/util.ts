import bs58check from 'bs58check';
import createHash from 'create-hash';

export function getRootFingerprint(xpub: string): string {
  const rawBytes = bs58check.decode(xpub);
  if (rawBytes.length !== 78) {
    throw new Error('Invalid extended key length');
  }
  const pubkey = rawBytes.slice(45, 78);
  const sha256Hash = createHash('sha256').update(pubkey).digest();
  const ripemd160Hash = createHash('ripemd160').update(sha256Hash).digest();

  return ripemd160Hash.slice(0, 4).toString('hex');
}
