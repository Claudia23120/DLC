/**
 * Only same-site paths are allowed as a post-login redirect target: "/x" is
 * fine, "//evil.com", "/\evil.com" and "https://evil.com" are not.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/bolos"): string {
  return next && /^\/(?![/\\])/.test(next) ? next : fallback;
}
