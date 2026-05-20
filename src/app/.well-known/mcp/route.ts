import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const host = request.headers.get('host') ?? 'droplinked.com'
  const base = `https://${host}`
  return NextResponse.json({
    mcp_version: '0.1', server_name: 'droplinked-storefront',
    description: 'Droplinked storefront MCP server — query products, inventory, affiliate links.',
    capabilities: { tools: true, resources: false, prompts: false },
    tools: [
      { name: 'list_products', endpoint: `${base}/api/mcp/tools/list_products`, description: 'List affiliate-available products.' },
      { name: 'get_product', endpoint: `${base}/api/mcp/tools/get_product`, description: 'Fetch product details by id or slug.' },
      { name: 'get_affiliate_link', endpoint: `${base}/api/mcp/tools/get_affiliate_link`, description: 'Generate affiliate-tagged checkout URL.' },
    ],
    rate_limits: { per_minute: 60, per_hour: 1000 },
    auth: { type: 'none', note: 'Public read-only; writes require API key.' },
  })
}
