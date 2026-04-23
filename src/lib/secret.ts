// Client-side gate for the parody area.
//
// SECURITY MODEL: this is a CLIENT-SIDE gate, not real encryption. Anyone
// who finds a /secret URL and views the page source after unlocking can
// read the content. The gate stops casual visitors and stops the URL from
// leaking content via screenshots, search engines, or sitemaps.
//
// To rotate the password:
//   1. Pick a new password.
//   2. Compute its SHA-256 hash:
//        node -e "console.log(require('crypto').createHash('sha256').update('YOUR_NEW_PASSWORD').digest('hex'))"
//   3. Replace PASSWORD_HASH below with the output.
//   4. Tell anyone who needs access the new password (out of band, not in
//      a commit message).

// SHA-256("crayons")
export const PASSWORD_HASH = 'e23ce146f7285d84c5ce5f7181c3092df9e1ca14adb0986aa7269cb14c70f250';

export const SESSION_KEY = 'ihhs:secret:unlocked';

// Browser-side SHA-256 via the SubtleCrypto API.
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isUnlocked(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function setUnlocked(value: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  if (value) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}
