/**
 * Pure JS twin of the white-label prefix matcher exported from
 * src/components/core/AppLayout.tsx. Mirrors that file's logic so a
 * Node test can assert against it without React/Next-runtime imports.
 *
 * Keep the prefix list in sync with AppLayout.tsx — any divergence is a
 * test failure.
 */

export const WHITE_LABEL_PREFIXES = ['/publisher-invite', '/publisher'];

export function isWhiteLabelRoute(pathname) {
  if (!pathname) return false;
  return WHITE_LABEL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
