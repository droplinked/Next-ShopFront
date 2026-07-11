/**
 * SSR-safe HTML sanitizer for imported product descriptions.
 *
 * Imported catalog descriptions (e.g. Shopify `body_html`) arrive as real HTML
 * — headings, paragraphs, `<strong>`, `<br>`, `<img>`. The GMC-feed landing page
 * previously rendered that string as a JSX text node, so React escaped it and
 * the raw tags showed as literal text. We instead render it via
 * `dangerouslySetInnerHTML`, so it must be sanitized first.
 *
 * This runs during SSR (no DOM / no `window`), so it is a dependency-free,
 * string-only pass — deliberately conservative: it removes the constructs that
 * can execute script or exfiltrate, and keeps ordinary formatting + images.
 * It is NOT a full DOM-aware sanitizer; the input is semi-trusted merchant
 * content, and the goal is defense-in-depth over an already-raw render, without
 * pulling a jsdom-backed dep into the server bundle.
 */

// Whole dangerous elements (tag + contents) that must never survive.
const DANGEROUS_BLOCKS =
  /<(script|style|iframe|object|embed|noscript|template|form|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi;
// Self-closing / unclosed variants of those same elements.
const DANGEROUS_VOID =
  /<\/?(script|style|iframe|object|embed|noscript|template|form|svg|math)\b[^>]*>/gi;
// Inline event handlers: on*="..." | on*='...' | on*=unquoted
const EVENT_HANDLERS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
// Dangerous URI schemes in any attribute value (javascript:, vbscript:, and
// non-image data: payloads). Leaves http(s):, protocol-relative, and
// `data:image/...` intact.
const JS_URI = /\s+(href|src|xlink:href)\s*=\s*("|')?\s*(javascript:|vbscript:|data:(?!image\/))[^"'>\s]*("|')?/gi;

/**
 * Sanitize an HTML description string for safe `dangerouslySetInnerHTML` use.
 * Returns an empty string for nullish/blank input.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  let out = input;
  // Strip dangerous elements first (blocks before their orphaned tags).
  out = out.replace(DANGEROUS_BLOCKS, "");
  out = out.replace(DANGEROUS_VOID, "");
  // Neutralize inline handlers and script-bearing URIs.
  out = out.replace(EVENT_HANDLERS, "");
  out = out.replace(JS_URI, "");
  return out.trim();
}

// Named HTML entities common in imported descriptions (numeric refs handled below).
const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&trade;": "™",
  "&reg;": "®",
  "&copy;": "©",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => NAMED_ENTITIES[m.toLowerCase()] ?? m);
}

function safeFromCodePoint(cp: number): string {
  try {
    return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : "";
  } catch {
    return "";
  }
}

/**
 * Flatten an HTML description string to clean plain text for crawler-facing
 * fields (`<meta name="description">`, og/twitter descriptions, JSON-LD
 * `description`). Those are TEXT fields — leaving HTML markup in them shows up
 * as literal `<div class="product-description">…` in search/social/GMC and reads
 * as low-quality/misrepresentation. Strips tags (block tags → spaces so words
 * don't run together), decodes entities, collapses whitespace, and optionally
 * truncates on a word boundary with an ellipsis.
 */
export function htmlToText(
  input: string | null | undefined,
  maxLen?: number,
): string {
  if (!input || typeof input !== "string") return "";
  let out = sanitizeHtml(input);
  // Block-level boundaries → space so adjacent words don't concatenate.
  out = out.replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, " ");
  out = out.replace(/<br\s*\/?>/gi, " ");
  // Drop all remaining tags, decode entities, collapse whitespace.
  out = out.replace(/<[^>]+>/g, " ");
  out = decodeEntities(out);
  out = out.replace(/\s+/g, " ").trim();
  if (maxLen && out.length > maxLen) {
    const cut = out.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    out = (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
  }
  return out;
}
