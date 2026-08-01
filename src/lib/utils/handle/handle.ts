/**
 * titleCaseHandle — present a raw merchant handle/slug as a display name.
 *
 * Used ONLY as a fallback when a product has no real brand name and the PDP
 * would otherwise show the bare, lowercase merchant slug in the breadcrumb /
 * brand line (e.g. `unstoppable`). A real `brandName` must never be passed
 * through this — it is already display copy and could be mangled.
 *
 * Splitting rules (best-effort, never throws):
 *   - split on `-`, `_`, `.`, `+` and whitespace → separate words
 *   - split camelCase / PascalCase boundaries (`theShoeCircle` → the Shoe Circle)
 *   - uppercase only the FIRST letter of each word; the rest is left untouched
 *     so an acronym (`nasa`→`Nasa`, `UNSTOPPABLE`→`UNSTOPPABLE`) is not damaged
 *
 * A blob slug with no clean delimiter/camel boundary (e.g. `theshoecircle`)
 * degrades gracefully to a single capitalised word (`Theshoecircle`) — the
 * "else just capitalize words" branch. That is strictly better than the raw
 * lowercase slug and never invents word boundaries that aren't there.
 *
 * @example titleCaseHandle('unstoppable')      // 'Unstoppable'
 * @example titleCaseHandle('the-shoe-circle')  // 'The Shoe Circle'
 * @example titleCaseHandle('theShoeCircle')    // 'The Shoe Circle'
 * @example titleCaseHandle('theshoecircle')    // 'Theshoecircle'
 */
export function titleCaseHandle(handle: string): string {
  if (!handle || typeof handle !== "string") return handle ?? "";

  const words = handle
    // camelCase / PascalCase → space-separated
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // delimiter families → spaces
    .replace(/[-_.+\s]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return handle;

  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default titleCaseHandle;
