/**
 * True when a browser request comes from the very site this server is serving.
 *
 * The built web app loads its script as a module, so the browser sends an Origin header even for
 * the site's own files. Without this check the site blocks itself (a blank page) whenever
 * CORS_ALLOWED_ORIGINS does not happen to list the address it is deployed at.
 */
export function isSameOriginRequest(
  origin: string | undefined,
  host: string | undefined,
  forwardedHost?: string | undefined,
): boolean {
  if (!origin || !host) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  if (!originHost) return false;
  // A proxy (Render, Cloudflare) may put the public host in X-Forwarded-Host, possibly as a list
  const candidates = [host, ...(forwardedHost ?? '').split(',')]
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return candidates.includes(originHost);
}
