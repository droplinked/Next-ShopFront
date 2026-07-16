/**
 * description-content.ts — Copywriter pass for the premium PDP.
 *
 * POD supplier descriptions (Printful et al.) arrive as one HTML blob that
 * mixes three very different kinds of content:
 *   1. Benefit copy the shopper should read (fabric, fit, features)
 *   2. Fulfillment boilerplate that actively kills trust on a premium page
 *      ("Blank product sourced from China", "Disclaimer: A strong glue smell
 *      is expected…")
 *   3. Sizing charts — big multi-column tables that belong behind a
 *      "Size Guide" affordance (Bloomingdale's pattern), never inline.
 *
 * splitDescription() takes the (already sanitized) description HTML and
 * returns { descriptionHtml, sizeGuideHtml }:
 *   - supplier disclaimers are removed from the visible copy
 *   - everything from the first "Size Guide"-style heading onward — plus any
 *     stray <table> elements — moves to sizeGuideHtml
 *   - both halves stay valid HTML fragments for dangerouslySetInnerHTML
 *     (inputs must already be sanitized — reuse sanitizeHtml from the slug
 *     route before calling this)
 *
 * Pure string transforms, server-safe, no DOM dependency.
 */

// Sentences/paragraphs that are supplier-ops boilerplate, not shopper copy.
// Matched case-insensitively against each block's TEXT content.
const DISCLAIMER_PATTERNS: RegExp[] = [
  /blank product sourced from/i,
  /\bdisclaimer\s*:/i,
  /strong glue smell/i,
  /allow the shoes to air out/i,
  /product is made especially for you/i, // common Printful ops footer
  /printed in|fulfilled by/i,
];

// Headings that mark the start of sizing content.
const SIZE_GUIDE_HEADING = /size\s*(guide|chart|table)|measurements/i;

/**
 * Split an HTML fragment into top-level blocks. We treat block-level tags as
 * boundaries; anything between them (bare text/inline nodes) becomes its own
 * block. This is intentionally simple — supplier HTML is flat (p/ul/table/h*).
 */
function toBlocks(html: string): string[] {
  const re =
    /<(p|ul|ol|table|h[1-6]|div|section|blockquote)\b[\s\S]*?<\/\1>|[^<]+|<[^>]+>/gi;
  const blocks: string[] = [];
  let buf = "";
  for (const m of html.match(re) ?? []) {
    if (/^<(p|ul|ol|table|h[1-6]|div|section|blockquote)\b/i.test(m)) {
      if (buf.trim()) blocks.push(buf);
      buf = "";
      blocks.push(m);
    } else {
      buf += m;
    }
  }
  if (buf.trim()) blocks.push(buf);
  return blocks;
}

/** Text content of an HTML block (tags stripped), for pattern matching. */
function blockText(block: string): string {
  return block
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDisclaimer(block: string): boolean {
  const text = blockText(block);
  if (!text) return false;
  return DISCLAIMER_PATTERNS.some((re) => re.test(text));
}

function isSizeGuideHeading(block: string): boolean {
  // A short heading-like block whose text is basically "Size Guide" etc.
  const text = blockText(block);
  if (!text || text.length > 40) return false;
  return SIZE_GUIDE_HEADING.test(text);
}

export interface SplitDescription {
  /** Shopper-facing copy — boilerplate removed, size charts relocated. */
  descriptionHtml: string;
  /** Sizing tables + everything after the Size Guide heading ('' if none). */
  sizeGuideHtml: string;
}

export function splitDescription(sanitizedHtml: string | null | undefined): SplitDescription {
  const html = (sanitizedHtml ?? "").trim();
  if (!html) return { descriptionHtml: "", sizeGuideHtml: "" };

  const blocks = toBlocks(html);
  const description: string[] = [];
  const sizeGuide: string[] = [];
  let inSizeGuide = false;

  for (const block of blocks) {
    if (!inSizeGuide && isSizeGuideHeading(block)) {
      inSizeGuide = true;
      continue; // the accordion supplies its own "Size Guide" title
    }
    if (inSizeGuide) {
      if (!isDisclaimer(block)) sizeGuide.push(block);
      continue;
    }
    if (isDisclaimer(block)) continue;
    // Stray tables before any heading are sizing content too.
    if (/^<table\b/i.test(block.trim())) {
      sizeGuide.push(block);
      continue;
    }
    description.push(block);
  }

  return {
    descriptionHtml: description.join("").trim(),
    sizeGuideHtml: sizeGuide.join("").trim(),
  };
}
