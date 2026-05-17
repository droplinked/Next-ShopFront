import type { Page, Route } from '@playwright/test';

/**
 * Web3-specific network mocks.
 *
 * Use ALONGSIDE helpers/network.ts (which handles Stripe/Sentry/analytics).
 * This file specifically handles:
 *   - JSON-RPC nodes (Alchemy, Infura, public RPCs)
 *   - WalletConnect relay (wss://relay.walletconnect.com)
 *   - Coinbase Wallet SDK + Smart Wallet (keys.coinbase.com, go.cb-w.com)
 *   - Reown / Web3Modal bridges
 *   - Token metadata APIs
 *
 * Use only on Web3-enabled projects; omit for Web2 SaaS.
 */

export interface Web3MockOptions {
  chainId?: number;
  blockNumber?: number;
  defaultBalanceWei?: string;
  /**
   * Custom JSON-RPC method overrides.
   * Key: method name (e.g. 'eth_call'), value: response or function.
   */
  rpcOverrides?: Record<string, unknown | ((params: any) => unknown)>;
}

const DEFAULT_CHAIN_ID = 8453; // Base mainnet
const DEFAULT_BLOCK = 0x1000000;

export async function mockWeb3Network(
  page: Page,
  options: Web3MockOptions = {},
): Promise<void> {
  const chainId = options.chainId ?? DEFAULT_CHAIN_ID;
  const chainIdHex = `0x${chainId.toString(16)}`;
  const blockHex = `0x${(options.blockNumber ?? DEFAULT_BLOCK).toString(16)}`;
  const balanceHex = options.defaultBalanceWei ?? '0x16345785d8a0000'; // 0.1 ETH

  const defaultRpc: Record<string, unknown> = {
    eth_chainId: chainIdHex,
    eth_blockNumber: blockHex,
    eth_gasPrice: '0x3b9aca00',
    eth_getBalance: balanceHex,
    eth_call: '0x',
    eth_estimateGas: '0x5208',
    eth_sendRawTransaction: '0x' + 'aa'.repeat(32),
    eth_getTransactionCount: '0x0',
    eth_getCode: '0x',
    net_version: String(chainId),
  };

  // ─── JSON-RPC endpoints (Alchemy, Infura, public RPCs, base.org) ───
  await page.route(
    /(alchemy|infura|alchemyapi|drpc\.org|publicnode\.com|base\.org|mainnet\.base\.org|sepolia\.base\.org|ankr\.com|quiknode|llamarpc|cloudflare-eth)/i,
    async (route: Route) => {
      const req = route.request();
      if (req.method() !== 'POST') {
        await route.fulfill({ status: 200, body: '{}' });
        return;
      }
      let body: any = {};
      try {
        body = JSON.parse(req.postData() ?? '{}');
      } catch {/* ignore */}
      const { method, id = 1 } = body;
      const override = options.rpcOverrides?.[method];
      const result = typeof override === 'function' ? override(body.params) : (override ?? defaultRpc[method]);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jsonrpc: '2.0', id, result: result ?? null }),
      });
    },
  );

  // ─── WalletConnect relay (HTTP polyfill — WSS is more complex; see note below) ───
  await page.route(
    /relay\.walletconnect\.(com|org)|verify\.walletconnect\.(com|org)|pulse\.walletconnect/i,
    async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    },
  );

  // ─── Coinbase Wallet + Smart Wallet ───
  await page.route(
    /(keys\.coinbase\.com|go\.cb-w\.com|api\.developer\.coinbase\.com|api\.wallet\.coinbase\.com)/i,
    async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    },
  );

  // ─── Reown / Web3Modal cloud ───
  await page.route(
    /(cloud\.reown\.com|api\.web3modal|secure\.web3modal|secure-mobile\.walletconnect)/i,
    async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    },
  );

  // ─── Token metadata APIs (CoinGecko, etc) ───
  await page.route(
    /(coingecko\.com|coinmarketcap\.com|defillama\.com)/i,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ prices: { usd: 1.0 } }),
      });
    },
  );
}

/**
 * NOTE on WalletConnect WSS:
 *
 * Playwright can't intercept native WebSocket traffic the same way it routes
 * HTTP. If your tests need to interact with WalletConnect's relay protocol,
 * the cleaner approach is to mock at the SDK boundary (the wagmi/viem connector
 * layer) rather than the wire. The HTTP polyfill above handles WalletConnect's
 * verify/pulse HTTP endpoints — usually enough for "wallet modal opens, user
 * cancels" coverage.
 *
 * For deeper WC integration tests, use a real testnet wallet + a real WC relay
 * in a dedicated e2e suite (not the mobile regression suite).
 */
