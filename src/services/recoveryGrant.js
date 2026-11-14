// One-time navigation proof created ONLY after Supabase verifies a recovery OTP.
// Intentionally in memory: refreshing /reset-password requires a fresh OTP.
let grant = null;
export function setRecoveryGrant(userId, email) {
  grant = { userId, email: email.trim().toLowerCase(), issuedAt: Date.now() };
}
export function getRecoveryGrant() {
  if (!grant || Date.now() - grant.issuedAt > 5 * 60 * 1000) return null;
  return grant;
}
export function clearRecoveryGrant() { grant = null; }
