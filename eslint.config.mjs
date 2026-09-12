// ESLint flat config — the config `eslint@10` requires, and the one that
// replaces `.eslintrc.json`. Next-ShopFront#287.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS REPLACES, AND WHY IT WAS INVISIBLE
// ═══════════════════════════════════════════════════════════════════════════
//
// `.eslintrc.json` was `{ "extends": "next/core-web-vitals" }` — eslintrc
// format, which `eslint@10.10.0` (this repo's pinned devDependency since #229
// bumped eslint 8 -> 10 on 2026-09-08) removed support for entirely. Measured
// on dev @ 21956bf, `npm run lint` exited 1 with:
//
//   Invalid Options: Unknown options: useEslintrc, extensions,
//   resolvePluginsRelativeTo, rulePaths, ignorePath,
//   reportUnusedDisableDirectives
//
// having linted ZERO files. Nothing reported that, for two reasons:
// no workflow invoked lint (0 hits over 10 workflow files; control: 5 of
// them mention npm), and `next build` prints the identical crash as a
// NON-FATAL warning and completes exit 0.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE TWO BLOCKS BELOW THE SPREAD ARE NOT STYLE. BOTH ARE LOAD-BEARING.
// ═══════════════════════════════════════════════════════════════════════════
//
// Flat config alone does not make eslint 10 work here. Each block fixes a
// measured crash, and `infra/ci/__tests__/eslint-report.test.sh` proves the
// linter still runs — remove either one and lint dies again, silently,
// exactly the way it died before this file existed.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import * as espree from 'espree';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ── BLOCK 1 — react version, declared rather than detected ────────────────
// `eslint-plugin-react@7.37.5` (nested under eslint-config-next@16.3.4)
// autodetects the React version via `detectReactVersion()`, which calls
// `contextOrFilename.getFilename()` — an ESLint API removed in v10. Under
// eslint 10 that throws on the FIRST file linted:
//
//   TypeError: Error while loading rule 'react/display-name':
//   contextOrFilename.getFilename is not a function
//
// Declaring the version skips detection entirely. Read from the installed
// package rather than hardcoded, so a react bump cannot silently desync this
// from the tree — the classic way a pin becomes a lie.
const reactVersion = require('react/package.json').version;

// ── BLOCK 2 — a working parser for plain JS ───────────────────────────────
// `eslint-config-next` applies `next/dist/compiled/babel/eslint-parser` to
// `**/*.{js,jsx,mjs,ts,tsx,mts,cts}`, then overrides the TS extensions with
// typescript-eslint's parser. So .js/.jsx/.mjs/.cjs get Next's VENDORED babel
// parser — and `next@15.5.24`'s copy predates eslint 10:
//
//   TypeError: scopeManager.addGlobals is not a function
//
// 🚨 Bumping typescript-eslint does NOT fix this. 8.70.0 advertises
// `eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"` in its peer range and the crash is
// unchanged, because the failing parser is Next's, not typescript-eslint's.
// A declared peer range is not a working one. Measured both ways on dev.
//
// espree is ESLint's own default parser and a direct dependency of eslint, so
// it is present in every install without adding a dependency. It is a correct
// substitute HERE specifically because none of this repo's 18 plain-JS files
// contain JSX (control: 18 of 347 tracked files match `*.{js,jsx,mjs,cjs}`;
// 0 of them match a JSX-return pattern) — babel was only ever needed for JSX.
//
// When Next 16 lands (#265) its vendored parser is eslint-10 ready and this
// block becomes redundant rather than wrong; espree parses these files
// identically either way. Delete it then, and watch the suite stay green.
export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      'public/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...coreWebVitals,
  { settings: { react: { version: reactVersion } } },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { parser: espree, ecmaVersion: 'latest', sourceType: 'module' },
  },
];
