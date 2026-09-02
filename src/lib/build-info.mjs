/**
 * Build identity — the answer to "which commit is this storefront running?"
 *
 * WHY THIS EXISTS
 * ---------------
 * `shop.droplinked.com` server-renders every product URL in the public ACP
 * feed. Before this module the storefront had no endpoint of any kind that
 * reported its own build: `/api/health` 404'd, and the only truthful answer
 * lived in the ECS task definition's image tag — behind AWS credentials and
 * several API calls. So every incident that turned on "is the merged change
 * actually running?" could only be settled by whoever held AWS access, while
 * the cheap checks available to everyone else (PR merged? workflow green?
 * `rolloutState: COMPLETED`?) are exactly the ones that lie.
 *
 * This is the Next-ShopFront half of the pattern proven on apiv3 by
 * droplinked-backend #3705 / PR #3709, live on `GET /health` there.
 *
 * WHERE THE VALUE COMES FROM — AND THE TWO ROUTES DELIBERATELY REJECTED
 * --------------------------------------------------------------------
 * The commit is baked into the image at BUILD time and read back here:
 *
 *   deploy workflow (`github.sha`)
 *     --build-arg--> Dockerfile RUNNER-stage `ARG` --> `ENV` --> `process.env`
 *
 * 1. NOT read from the ECS task definition at runtime. That reintroduces the
 *    AWS dependency this module exists to remove, and describing a
 *    task-definition FAMILY resolves the LATEST REGISTERED revision rather
 *    than the one actually serving traffic — precisely the conflation behind
 *    the 2026-09-02 deploy incident, and the reason `main.yml` now carries
 *    forward from `services[0].taskDefinition`.
 *
 * 2. NOT read from the `.env` the deploy workflow writes, even though it
 *    already contains `SENTRY_RELEASE=${{ github.sha }}` — the exact value we
 *    want. That file is assembled in the GitHub runner and reaches the BUILDER
 *    stage through `COPY . .`; the RUNNER stage copies only
 *    `.next/standalone`, `.next/static` and `public`. A `.env`-sourced value
 *    would therefore be a build-time input at best and absent at worst, while
 *    looking in the Dockerfile exactly like a working one. (droplinked-backend
 *    #3709 rejected `SENTRY_RELEASE` for the same class of reason there:
 *    `ConfigModule.forRoot()` merges `.env` long after the module that reads
 *    it. Different mechanism, identical failure — inert while appearing
 *    functional.)
 *
 * The multi-stage build is the trap worth naming: `SENTRY_RELEASE` is declared
 * `ARG`/`ENV` in the BUILDER stage, and a `FROM` starts a stage with a fresh
 * environment. Copying that pattern for build identity would produce a value
 * that is present during `next build` and gone from `process.env` at runtime.
 * The ARGs added by this change are declared in the RUNNER stage for that
 * reason.
 *
 * FAIL-SOFT CONTRACT
 * ------------------
 * `/api/health` is intended to be probeable by CI, a canary, and eventually
 * the load balancer, so an exception raised on that path is a production
 * outage waiting to be adopted. Every function here is therefore total: pure
 * string work, no I/O, no async, no throw. An absent, empty, or unrecognisable
 * value degrades to the `unknown` sentinel and never to an error. A local
 * `docker build` with no `--build-arg`, `next dev`, and any image built before
 * this change all report `unknown` and stay healthy.
 *
 * The strict hex pattern is not decoration either: `/api/health` is
 * unauthenticated, so this module only ever echoes a value it has recognised
 * as a git object name. Anything else is reported as `unknown` rather than
 * reflected back to an anonymous caller.
 *
 * WHY .mjs AND NOT .ts
 * -------------------
 * This repo's `npm test` is `node --test 'src/__smoke__/*.test.mjs'` — Node's
 * built-in runner with no TypeScript transform in front of it. Keeping the
 * pure resolver as plain ESM lets the suite exercise THE REAL MODULE the route
 * handler imports, instead of a copy of its rules that can drift. `tsconfig`
 * already sets `allowJs: true`, so the TypeScript route handler imports it
 * with inferred types.
 */

/**
 * Reported in place of a field that could not be resolved. Never an error.
 * @type {string}
 */
export const UNKNOWN_BUILD_FIELD = 'unknown';

/**
 * Characters of the commit reported on `/api/health`.
 *
 * Nine, matching apiv3's `/health` and `mcp.droplinked.com/healthz` so one
 * comparison works across all three services. Still a prefix of the full
 * `github.sha` the image is tagged with, so
 * `curl -s https://shop.droplinked.com/api/health | jq -r .commit` compares
 * against `git rev-parse main | cut -c1-9` without further work.
 * @type {number}
 */
export const SHORT_SHA_LENGTH = 9;

/** A git object name: 7-40 hex characters. Anything else is not a commit. */
const GIT_SHA_PATTERN = /^[0-9a-fA-F]{7,40}$/;

/**
 * Env keys consulted for the build commit, in precedence order.
 *
 * `BUILD_COMMIT_SHA` is the whole contract: a Docker `ARG`/`ENV` pair on the
 * RUNNER stage, fed from the deploy workflow's `github.sha`. A Docker `ENV` is
 * in `process.env` from the first instruction of the process, which is what
 * makes it readable at module load.
 *
 * Deliberately a one-element list, asserted by the smoke suite: a future edit
 * that reaches for an AWS lookup, or for the softer-looking `SENTRY_RELEASE`
 * that the deploy already writes into `.env`, fails the suite rather than
 * silently shipping a value that is inert in the runner stage.
 * @type {readonly string[]}
 */
export const COMMIT_ENV_KEYS = ['BUILD_COMMIT_SHA'];

/**
 * Env keys consulted for the build timestamp, in precedence order.
 * @type {readonly string[]}
 */
export const BUILT_AT_ENV_KEYS = ['BUILD_TIME'];

/**
 * @typedef {object} BuildInfo
 * @property {string} commit  Abbreviated build commit, or `'unknown'`.
 * @property {string} builtAt ISO-8601 build timestamp, or `'unknown'`.
 */

/**
 * First key in `keys` whose value is a non-blank string, trimmed; `''` if none.
 *
 * Absent and empty are the SAME case on purpose. `ENV FOO=${FOO}` with an empty
 * `ARG` default sets the variable to the empty string rather than leaving it
 * unset, so a local build produces `BUILD_COMMIT_SHA=''` — which must degrade
 * to the sentinel exactly like a missing key.
 *
 * @param {Record<string, string | undefined>} env
 * @param {readonly string[]} keys
 * @returns {string}
 */
function firstNonEmpty(env, keys) {
  for (const key of keys) {
    const raw = env[key];
    if (typeof raw === 'string' && raw.trim() !== '') {
      return raw.trim();
    }
  }
  return '';
}

/**
 * Normalises a raw build commit to a short lowercase SHA, or the sentinel.
 *
 * Total: any input that is not a recognisable git object name yields
 * `'unknown'`.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCommit(raw) {
  if (typeof raw !== 'string' || !GIT_SHA_PATTERN.test(raw)) {
    return UNKNOWN_BUILD_FIELD;
  }
  return raw.toLowerCase().slice(0, SHORT_SHA_LENGTH);
}

/**
 * Normalises a raw build timestamp to ISO-8601, or the sentinel.
 *
 * Total: an unparseable or out-of-range value yields `'unknown'`.
 * `toISOString()` throws only on an invalid Date, which is excluded first.
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBuiltAt(raw) {
  if (typeof raw !== 'string' || raw === '') {
    return UNKNOWN_BUILD_FIELD;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return UNKNOWN_BUILD_FIELD;
  }
  return parsed.toISOString();
}

/**
 * Resolves the build identity from an environment. Pure, synchronous, total.
 *
 * Exported separately from `BUILD_INFO` so the resolution rules can be tested
 * against any environment without reloading modules.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {BuildInfo}
 */
export function resolveBuildInfo(env = process.env) {
  try {
    return Object.freeze({
      commit: normalizeCommit(firstNonEmpty(env, COMMIT_ENV_KEYS)),
      builtAt: normalizeBuiltAt(firstNonEmpty(env, BUILT_AT_ENV_KEYS)),
    });
  } catch {
    // Unreachable by construction (pure string work). Kept because this value
    // is computed at module load: a throw here would fail the whole route
    // module, not merely one request. Degrade, never crash.
    return Object.freeze({
      commit: UNKNOWN_BUILD_FIELD,
      builtAt: UNKNOWN_BUILD_FIELD,
    });
  }
}

/**
 * The running build's identity, resolved ONCE when this module is first
 * evaluated. `/api/health` reads a frozen object off the heap, so the probe
 * stays synchronous and allocation-free regardless of request volume.
 * @type {BuildInfo}
 */
export const BUILD_INFO = resolveBuildInfo();
