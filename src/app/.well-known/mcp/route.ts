import { NextResponse } from 'next/server'

/**
 * MCP discovery manifest served at /.well-known/mcp.
 *
 * Each tool definition includes a short `description`, an extended
 * `description_long` (usage guidance for autonomous agents), and an
 * `examples` array (input + expected-output shape) so an agent can learn
 * the surface from this document alone without a separate doc round-trip.
 */

export async function GET(request: Request) {
  const host = request.headers.get('host') ?? 'droplinked.com'
  const base = `https://${host}`

  const tools = [
    {
      name: 'list_products',
      endpoint: `${base}/api/mcp/tools/list_products`,
      method: 'POST',
      description: 'List affiliate-available products.',
      description_long:
        'Returns a paginated list of products that have affiliate commissions enabled. Supports filtering by `store` (shop URL slug), `category` (one of the storefront category enums), and free-text `q`. Use this to populate a browsable catalogue or to find candidate products to share. Pair with `get_affiliate_link` once the user picks a product.',
      input_schema: {
        type: 'object',
        properties: {
          store: { type: 'string', description: 'Optional shop URL slug to scope results.' },
          category: { type: 'string', description: 'Optional category filter; see get_categories.' },
          q: { type: 'string', description: 'Optional free-text search.' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      examples: [
        {
          input: { category: 'apparel', limit: 5 },
          output_shape: { data: '[{id,title,price,commission}]', page: 1, totalPages: 'number' },
        },
        {
          input: { q: 'hoodie', store: 'roomours' },
          output_shape: { data: '[Product]' },
        },
      ],
    },
    {
      name: 'get_product',
      endpoint: `${base}/api/mcp/tools/get_product`,
      method: 'POST',
      description: 'Fetch product details by id or slug.',
      description_long:
        'Returns the full public-facing product record. `id_or_slug` may be either the MongoDB ObjectId hex or the URL slug; the API resolves both. Use after `list_products` to fetch full descriptions, image galleries, and SKU variants.',
      input_schema: {
        type: 'object',
        required: ['id_or_slug'],
        properties: {
          id_or_slug: { type: 'string', description: 'Product ObjectId or URL slug.' },
        },
      },
      examples: [
        { input: { id_or_slug: '6710abc...' }, output_shape: { id: 'string', title: 'string', variants: 'array' } },
      ],
    },
    {
      name: 'get_affiliate_link',
      endpoint: `${base}/api/mcp/tools/get_affiliate_link`,
      method: 'POST',
      description: 'Generate affiliate-tagged checkout URL.',
      description_long:
        'Returns a shareable URL that attributes any resulting purchase to the supplied `affiliate_code`. `affiliate_code` is 3-64 chars of [A-Za-z0-9_-]; the apiv3 backend resolves it to the registered affiliate at checkout time. No upstream call — pure URL synthesis, safe to call at high frequency.',
      input_schema: {
        type: 'object',
        required: ['product_id', 'affiliate_code'],
        properties: {
          product_id: { type: 'string' },
          affiliate_code: { type: 'string', pattern: '^[A-Za-z0-9_-]{3,64}$' },
        },
      },
      examples: [
        {
          input: { product_id: '6710abc', affiliate_code: 'ali_2026' },
          output_shape: { url: 'https://droplinked.com/p/6710abc?aff=ali_2026' },
        },
      ],
    },
    {
      name: 'search_stores',
      endpoint: `${base}/api/mcp/tools/search_stores`,
      method: 'POST',
      description: 'Search storefronts by name or slug. (apiv3 endpoint pending — currently stubbed.)',
      description_long:
        "Returns up to `limit` storefronts matching the query string. When the apiv3 endpoint is unavailable the tool returns `{stub: true, data: []}` so agents can detect the placeholder and fall back. Treat results as best-effort discovery hints, not an authoritative catalogue.",
      input_schema: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', maxLength: 128 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      },
      examples: [
        { input: { q: 'roomours' }, output_shape: { stub: 'boolean', data: '[Store]' } },
      ],
    },
    {
      name: 'get_categories',
      endpoint: `${base}/api/mcp/tools/get_categories`,
      method: 'POST',
      description: 'List the supported product categories.',
      description_long:
        'Returns the canonical list of category slugs accepted by `list_products`. Use this to render a category filter or to validate user input before calling `list_products`. The list is currently sourced from a static enum and rarely changes.',
      input_schema: { type: 'object', properties: {} },
      examples: [
        {
          input: {},
          output_shape: {
            categories: ['apparel', 'accessories', 'home', '...'],
            source: 'static-enum',
          },
        },
      ],
    },
  ]

  return NextResponse.json({
    mcp_version: '0.1',
    server_name: 'droplinked-storefront',
    description: 'Droplinked storefront MCP server — query products, inventory, affiliate links.',
    capabilities: { tools: true, resources: false, prompts: false },
    tools,
    rate_limits: { per_minute: 60, per_hour: 1000 },
    auth: { type: 'none', note: 'Public read-only; writes require API key.' },
  })
}
