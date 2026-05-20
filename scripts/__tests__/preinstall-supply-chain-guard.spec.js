/* eslint-disable */
'use strict';

// Tests can run two ways:
//   1) `node --test scripts/__tests__/preinstall-supply-chain-guard.spec.js`
//      (matches the repo's existing `npm test` runner)
//   2) `npx jest scripts/__tests__/preinstall-supply-chain-guard.spec.js`
//      (only if jest is wired up at some later point)
//
// To stay runner-agnostic we use plain assertions + a tiny shim that
// recognises either `node:test`'s `test()` or a globally-injected
// jest `test()` / `describe()` pair.

const assert = require('node:assert/strict');

let test;
let describe;
try {
  // node:test path (Node 18+).
  const nodeTest = require('node:test');
  test = nodeTest.test;
  describe = nodeTest.describe || ((_label, fn) => fn());
} catch (_err) {
  // Jest path.
  test = global.test;
  describe = global.describe;
}

const { scanLockfile } = require('../preinstall-supply-chain-guard');

describe('preinstall-supply-chain-guard scanLockfile', () => {
  test('clean lockfile passes with no blocks', () => {
    const lock = {
      packages: {
        '': { name: 'next-shopfront', version: '0.1.0' },
        'node_modules/lodash': { name: 'lodash', version: '4.17.21' },
        'node_modules/next': { name: 'next', version: '15.5.18' },
        'node_modules/@droplinked_inc/web3': {
          name: '@droplinked_inc/web3',
          version: '1.0.0',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });

  test('allows lodash 4.17.x and 4.18.x (vetted) but blocks 4.18.2+ / 4.19.x / 5.x', () => {
    const allowed = {
      packages: {
        'node_modules/lodash-old': { name: 'lodash', version: '4.17.21' },
        'node_modules/lodash-vetted-min': { name: 'lodash', version: '4.18.0' },
        'node_modules/lodash-vetted-max': { name: 'lodash', version: '4.18.1' },
      },
    };
    assert.deepEqual(scanLockfile(allowed), []);

    const blocked = {
      packages: {
        'node_modules/lodash-patch-bump': { name: 'lodash', version: '4.18.2' },
        'node_modules/lodash-minor-bump': { name: 'lodash', version: '4.19.0' },
        'node_modules/lodash-major-bump': { name: 'lodash', version: '5.0.0' },
      },
    };
    const blocks = scanLockfile(blocked);
    assert.equal(blocks.length, 3);
    for (const b of blocks) {
      assert.match(b.reason, /OpenJS-reboot-vetted 4\.18\.1 ceiling/);
    }
  });

  test('blocks bare droplinked-* names (squatters)', () => {
    const lock = {
      packages: {
        'node_modules/droplinked-sdk': {
          name: 'droplinked-sdk',
          version: '0.1.0',
        },
        'node_modules/droplinked-utils': {
          name: 'droplinked-utils',
          version: '9.9.9',
        },
      },
    };
    const blocks = scanLockfile(lock);
    assert.equal(blocks.length, 2);
    assert.deepEqual(
      blocks.map((b) => b.name).sort(),
      ['droplinked-sdk', 'droplinked-utils']
    );
    for (const b of blocks) {
      assert.match(b.reason, /@droplinked_inc/);
    }
  });

  test('does NOT block scoped @droplinked_inc/* packages', () => {
    const lock = {
      packages: {
        'node_modules/@droplinked_inc/sdk': {
          name: '@droplinked_inc/sdk',
          version: '1.0.0',
        },
        'node_modules/@droplinked_inc/web3': {
          name: '@droplinked_inc/web3',
          version: '2.3.4',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });

  test('blocks fs@0.0.1-security typo-squat', () => {
    const lock = {
      packages: {
        'node_modules/fs': { name: 'fs', version: '0.0.1-security' },
      },
    };
    const blocks = scanLockfile(lock);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].name, 'fs');
    assert.match(blocks[0].reason, /typo-squat/);
  });

  test('npm v6 dependencies tree shape is also scanned', () => {
    const lock = {
      dependencies: {
        lodash: { version: '4.18.1' },
        next: {
          version: '15.5.18',
          dependencies: {
            'droplinked-evil': { version: '1.0.0' },
          },
        },
      },
    };
    const blocks = scanLockfile(lock);
    const names = blocks.map((b) => b.name).sort();
    assert.deepEqual(names, ['droplinked-evil']);
  });

  test('allows other lodash 4.17.x versions', () => {
    const lock = {
      packages: {
        'node_modules/lodash': { name: 'lodash', version: '4.17.21' },
        'node_modules/x/node_modules/lodash': {
          name: 'lodash',
          version: '4.17.20',
        },
      },
    };
    assert.deepEqual(scanLockfile(lock), []);
  });
});
