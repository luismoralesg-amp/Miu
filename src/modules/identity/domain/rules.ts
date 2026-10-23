/** Sign-in rules from ARQUITECTURA_MIU.md §4.2. Pure functions: tested without any adapter. */

export const CODE_TTL_MS = 10 * 60 * 1000;
export const LINK_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 30 * 1000;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const REMEMBERED_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const UFM_EMAIL = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?@ufm\.edu$/;

/** Only addresses on the exact ufm.edu domain (no subdomains, no lookalikes). */
export function normalizeUfmEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return UFM_EMAIL.test(email) ? email : null;
}

/** "ana.lopez@ufm.edu" → "a•••••••@ufm.edu": enough to recognise, not enough to harvest. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}${"•".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export function isSixDigitCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Google ID token checks we must run on the server (the `hd` request parameter is only a UI hint).
 * The real adapter calls this after verifying the signature; the mock calls it with simulated claims.
 */
export type GoogleClaims = {
  iss: string;
  aud: string;
  exp: number;
  email: string;
  email_verified: boolean;
  hd?: string;
};

export function acceptGoogleClaims(
  claims: GoogleClaims,
  clientId: string,
  nowSeconds: number,
): boolean {
  return (
    (claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com") &&
    claims.aud === clientId &&
    claims.exp > nowSeconds &&
    claims.email_verified === true &&
    claims.hd === "ufm.edu" &&
    normalizeUfmEmail(claims.email) !== null
  );
}

/** Human description of a user agent for the devices list ("Chrome en macOS"). */
export function describeUserAgent(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Firefox\//.test(ua)
      ? "Firefox"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Navegador";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "otro sistema";
  return `${browser} en ${os}`;
}
