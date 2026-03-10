/**
 * Centralized API base URL for all backend requests.
 *
 * Set NEXT_PUBLIC_API_URL in your environment to point at the deployed backend.
 * Leave it unset (or set to an empty string) when using a reverse proxy that
 * routes `/api/v1/*` traffic on the same origin — relative URLs will be used.
 *
 * Example values:
 *   Development  : http://127.0.0.1:8000
 *   Production   : https://api.yourdomain.com
 *   Same-origin  : (empty string)
 */
export const API_BASE_URL: string =
    (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
