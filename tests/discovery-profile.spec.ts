/**
 * discovery-profile.spec.ts
 *
 * Unit tests for the parseDiscoveryProfile runtime validator.
 * Tests run without a network call — the exported parser is called
 * directly with fixture payloads.
 *
 * These use Playwright's `test`/`expect` which can run without a browser
 * via `npx playwright test --project=unit` (headless, no browser launch).
 * The existing playwright.config.ts uses @playwright/test runner, so
 * these tests slot in with no extra tooling.
 */

import { test, expect } from "@playwright/test";
// Path resolves from project root (tests/tsconfig.json sets baseUrl: "..")
import { parseDiscoveryProfile } from "../src/app/m/[slug]/lib/discovery-profile";

const VALID_FULL_PAYLOAD = {
  slug: "acme-co",
  name: "Acme Co",
  description: "Quality tools since 1952",
  logoUrl: "https://cdn.example.com/acme-logo.png",
  websiteUrl: "https://acme.example.com",
  storefrontUrl: "https://droplinked.io/acme-co",
  verifiedTier: "full",
  topProducts: [
    {
      id: "prod-1",
      title: "Super Widget",
      description: "The best widget",
      price: 29.99,
      currency: "USD",
      imageUrl: "https://cdn.example.com/widget.png",
      productUrl: "https://droplinked.io/acme-co/super-widget",
    },
  ],
  social: {
    twitter: "https://twitter.com/acmeco",
  },
};

const VALID_DIRECTORY_PAYLOAD = {
  slug: "small-merchant",
  name: "Small Merchant LLC",
  description: "",
  logoUrl: "",
  websiteUrl: "",
  storefrontUrl: "https://droplinked.io/small-merchant",
  verifiedTier: "directory_only",
  topProducts: [],
};

test.describe("parseDiscoveryProfile @unit", () => {
  test("parses a valid full-tier payload", () => {
    const result = parseDiscoveryProfile(VALID_FULL_PAYLOAD);
    expect(result).not.toBeNull();
    expect(result?.slug).toBe("acme-co");
    expect(result?.name).toBe("Acme Co");
    expect(result?.verifiedTier).toBe("full");
    expect(result?.topProducts).toHaveLength(1);
    expect(result?.topProducts[0].price).toBe(29.99);
    expect(result?.social?.twitter).toBe("https://twitter.com/acmeco");
  });

  test("parses a valid directory_only payload", () => {
    const result = parseDiscoveryProfile(VALID_DIRECTORY_PAYLOAD);
    expect(result).not.toBeNull();
    expect(result?.verifiedTier).toBe("directory_only");
    expect(result?.topProducts).toHaveLength(0);
  });

  test("returns null for null input", () => {
    expect(parseDiscoveryProfile(null)).toBeNull();
  });

  test("returns null for non-object input", () => {
    expect(parseDiscoveryProfile("string")).toBeNull();
    expect(parseDiscoveryProfile(42)).toBeNull();
    expect(parseDiscoveryProfile([])).toBeNull();
  });

  test("returns null when slug is missing", () => {
    const { slug: _slug, ...noSlug } = VALID_FULL_PAYLOAD;
    expect(parseDiscoveryProfile(noSlug)).toBeNull();
  });

  test("returns null when name is missing", () => {
    const { name: _name, ...noName } = VALID_FULL_PAYLOAD;
    expect(parseDiscoveryProfile(noName)).toBeNull();
  });

  test("returns null for unknown verifiedTier value", () => {
    const payload = { ...VALID_FULL_PAYLOAD, verifiedTier: "premium" };
    expect(parseDiscoveryProfile(payload)).toBeNull();
  });

  test("filters out malformed products and keeps valid ones", () => {
    const payload = {
      ...VALID_FULL_PAYLOAD,
      topProducts: [
        VALID_FULL_PAYLOAD.topProducts[0],
        { id: "bad", title: 123 }, // malformed — missing price, wrong title type
        null,
      ],
    };
    const result = parseDiscoveryProfile(payload);
    expect(result?.topProducts).toHaveLength(1);
  });

  test("caps topProducts at 8 items", () => {
    const lotsOfProducts = Array.from({ length: 12 }, (_, i) => ({
      id: `prod-${i}`,
      title: `Product ${i}`,
      description: "",
      price: 10 + i,
      currency: "USD",
      imageUrl: "",
      productUrl: "",
    }));
    const payload = { ...VALID_FULL_PAYLOAD, topProducts: lotsOfProducts };
    const result = parseDiscoveryProfile(payload);
    expect(result?.topProducts).toHaveLength(8);
  });

  test("falls back storefrontUrl to droplinked.io/<slug> when missing", () => {
    const { storefrontUrl: _sf, ...noStorefront } = VALID_FULL_PAYLOAD;
    const result = parseDiscoveryProfile(noStorefront);
    expect(result?.storefrontUrl).toBe(`https://droplinked.io/${VALID_FULL_PAYLOAD.slug}`);
  });

  test("gracefully handles absent social field", () => {
    const { social: _s, ...noSocial } = VALID_FULL_PAYLOAD;
    const result = parseDiscoveryProfile(noSocial);
    expect(result).not.toBeNull();
    expect(result?.social).toBeUndefined();
  });
});
