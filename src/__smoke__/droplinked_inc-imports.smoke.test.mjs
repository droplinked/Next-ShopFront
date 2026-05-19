/**
 * Supply-chain smoke test for @droplinked_inc/web3.
 *
 * Verifies the published tarball is importable, exports the expected
 * surface, and pure helpers execute without throwing. Catches
 * publish-pipeline regressions (bad ESM extensions, missing exports,
 * runtime-time errors) before they reach a Next-ShopFront user.
 *
 * Runner: Node's built-in test runner (this repo has no jest/vitest).
 * Invoke directly:
 *   node --test src/__smoke__/droplinked_inc-imports.smoke.test.mjs
 *
 * Companion smokes:
 *   - droplinked-checkout : @droplinked_inc/ui-kit  (vitest)
 *   - droplinked-shop-builder : @droplinked_inc/editor-core (jest)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as Web3 from '@droplinked_inc/web3';

test('@droplinked_inc/web3 imports cleanly and exposes the expected public surface', () => {
  assert.ok(Web3, 'module is defined');
  for (const name of [
    // enums / constants
    'Chain',
    'Network',
    'ZERO_ADDRESS',
    // ABIs
    'ERC20_ABI',
    'SHOP_ABI',
    'DEPLOYER_ABI',
    'AIRDROP_ABI',
    // encoders
    'encodeErc20Transfer',
    'assertCalldataAllowed',
    'PACKAGE_SELECTOR_ALLOWLIST',
    // signing
    'buildPurchaseTypedData',
    'DROPLINKED_TYPED_DATA_NAME',
    // contracts + providers + facade
    'ShopContract',
    'Erc20Contract',
    'EvmProviderShim',
    'DropWeb3',
    // errors (spot-check)
    'ChainError',
    'WalletError',
    'SignatureVerificationError',
  ]) {
    assert.ok(name in Web3, `expected export "${name}" missing from @droplinked_inc/web3`);
  }

  // Chain enum should at least have POLYGON + BASE — the two primary
  // payment chains for droplinked.
  assert.equal(Web3.Chain.POLYGON, 'POLYGON');
  assert.equal(Web3.Chain.BASE, 'BASE');
});

test('encodeErc20Transfer produces a selector-prefixed EncodedCall', () => {
  const recipient = '0x000000000000000000000000000000000000dEaD';
  const encoded = Web3.encodeErc20Transfer({ to: recipient, amount: 1n });
  assert.equal(typeof encoded, 'object');
  assert.equal(typeof encoded.calldata, 'string');
  assert.ok(encoded.calldata.startsWith('0x'), 'calldata is 0x-prefixed');
  assert.ok(encoded.calldata.length >= 10, 'calldata contains at least a 4-byte selector');
  assert.equal(typeof encoded.selector, 'string');
  assert.ok(encoded.selector.startsWith('0x'), 'selector is 0x-prefixed');
  assert.equal(encoded.functionName, 'transfer');
});

test('EvmProviderShim constructs against a chain+network without throwing', () => {
  // Constructor smoke only — we do NOT touch the chain.
  assert.doesNotThrow(() => {
    const shim = new Web3.EvmProviderShim({
      chain: Web3.Chain.POLYGON,
      network: Web3.Network.MAINNET,
    });
    assert.equal(shim.chain, Web3.Chain.POLYGON);
    assert.equal(shim.network, Web3.Network.MAINNET);
  });
});
