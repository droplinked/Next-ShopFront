# Security Policy

Droplinked takes the security of our software, infrastructure, and the funds and
data of merchants and shoppers seriously. We appreciate responsible disclosure
from the security research community.

## How to report a security issue

Please report suspected vulnerabilities by email:

- **Primary:** security@droplinked.com
- **Backup:** ali@droplinked.com

Please **do not** open public GitHub issues, Discord posts, or social-media
threads for suspected vulnerabilities — coordinate privately first.

When possible, include:

- A clear description of the issue and its impact
- Steps to reproduce (proof-of-concept, request/response, transaction hash, etc.)
- Affected component(s), endpoint(s), contract address(es), or commit SHA
- Your name / handle for recognition (optional)

If the issue is sensitive, request our PGP key in your first email and we will
send one back before you share details.

## Response SLA

- **Acknowledgement:** within **72 hours** of receipt
- **Initial triage and severity assessment:** within **7 days**
- **Status updates:** at least every **14 days** while the report is open
- **Fix target (severity-dependent):**
  - Critical: hours-to-days
  - High: ~2 weeks
  - Medium: next release train
  - Low: backlog

We will coordinate a public disclosure timeline with you before publishing any
advisory or fix notes.

## Scope

### In scope

- Production services under `*.droplinked.com` (including `service.droplinked.com`, `web3.droplinked.com`, `3rdp.droplinked.com`, `dev.droplinked.com` and the public storefront network)
- Smart contracts deployed by Droplinked on Ethereum, Base, Polygon, BSC, Solana, and any chain explicitly listed in our public documentation
- Source code in the following repositories:
  - `droplinked/droplinked-backend`
  - `droplinked/3rdp-integration-services`
  - `droplinked/web3-integration-services`
  - `droplinked/droplinked-shopfront`
  - `droplinked/droplinked-checkout`
  - `droplinked/droplinked-shop-builder`
  - `droplinked/Next-ShopFront`
- Authentication, authorization, payment, and on-chain settlement flows
- PII / customer-data handling and merchant isolation

### Out of scope

- Denial-of-service via volumetric attacks
- Findings against staging / preview deployments that do not affect production
- Issues already tracked in public GitHub issues or in our audit-prep package
- Vulnerabilities requiring physical access to a victim's device, social
  engineering of staff, or compromised third-party accounts
- Missing security headers / cookie flags with no demonstrated impact
- Reports generated solely by automated scanners without manual validation
- Self-XSS, clickjacking on pages with no sensitive actions, CSRF on logout
- Third-party services we depend on (Stripe, PayPal, Sentry, Vercel, AWS, etc.) — report directly to them

## Safe harbor

We will not pursue legal action against researchers who:

1. Make a good-faith effort to comply with this policy
2. Do not access, modify, or destroy data beyond what is necessary to
   demonstrate the vulnerability
3. Do not exfiltrate or disclose user data
4. Give us a reasonable window to fix the issue before public disclosure
5. Do not exploit the issue for any purpose other than reporting it

## Recognition policy

We do **not currently operate a paid bug bounty program**. We do offer:

- Public recognition (with your consent) in `SECURITY-ACK.md`
- Linked credit in release notes / CHANGELOG when relevant
- Swag and discretionary token-of-thanks for impactful reports

We may launch a formal bounty program in the future; existing reporters will be
notified and remain eligible for recognition.

## Related documents

- External audit-prep package: `audit-prep-2026-05-19/SCOPE.md` (shared with
  prospective auditors under NDA — contact security@droplinked.com to request)
- General security posture and rotation runbooks are maintained internally and
  available to vetted auditors under NDA.

---

_Last updated: 2026-05-19_
