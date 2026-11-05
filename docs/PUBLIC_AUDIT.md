> Historical candidate audit. See [current release verification](GRAFANA_SUBMISSION.md) for completed gates and published 1.2.1 artifact values.

# Public edition audit — 2026-11-05

## Repository and edition boundary

Public repository: https://github.com/digitalrcs/grafana-intelligence-gateway

Companion: https://github.com/digitalrcs/grafana-intelligence-gateway-datasource

The inspected public remote is public, Wiki-enabled and administrator-accessible. Its main branch and both local edition bases were 54eea10b15167d6917203295979fc9ba63b6f0ba. The existing latest release is v1.1.2. The public split was initially uncommitted; this change preserves it in an isolated review branch. Private publishing remains disabled with push URL DISABLED-PRIVATE-EDITION and no release workflow. No private workspace was modified. No separate private GitHub remote is configured in that edition.

The private edition's only tracked src differences from the common public base were README and plugin metadata. Public 1.2.0 removes the dashboard/selected-panel capture implementation and html-to-image; query analysis and PNG/JPEG uploads remain. Existing public history already includes capture code. It is inaccurate to call that formerly published code secret or claim history was purged. The same plugin ID prevents installing both editions side by side and does not create a new catalog listing.

## Security checks and scope

Checksum-verified Gitleaks 8.30.1 scanned all fetched public branches/tags (65 commits), the candidate file snapshot and the existing Wiki history (19 commits), using redacted reports: zero findings. Pattern checks found a maintainer filesystem path in provisioning instructions; this and edition-specific local paths were replaced with portable instructions. Existing screenshots were inspected as a contact sheet; no new images or private assets were imported.

The panel's options contain a secure data-source UID and non-secret model/prompt settings, not credentials. Transport uses the selected companion's backend resources. PNG/JPEG inputs are bounded and re-encoded; images stay in memory. Credentials remain the companion's responsibility in Grafana secureJsonData. This audit does not prove absence of every possible secret, inspect every historical release binary or private account setting, or establish a fresh security certification of the companion.

Added ignores for local environment files, keys and confidential overrides. Removed signing-token exposure from ordinary CI and removed unrelated provider-key forwarding from the synthetic fixture. Release retains its signing gate and now checks the edition before invoking release tooling. Test hosting binds only 127.0.0.1:3005; the existing demo was not changed.

## Validation

- Clean npm ci: passed (1,233 packages installed).
- Edition guard, TypeScript and production webpack build: passed.
- Unit suite: 63/63 passed across 9 suites.
- ESLint: zero errors, 11 existing deprecation warnings.
- Dependency audit: 0 critical, 0 high, 16 moderate and 7 low findings. These include development-tool dependency chains and Grafana dependency trees. No forced major downgrades were applied; review and resolve or document applicability before release.
- Shared companion v1.1.2 archive: GitHub provenance verification passed. CI now pins its source commit 6fe5d34d7a7dd0e479deaee4ffc2f86384a3a780.
- Official plugin validator completed on the local candidate ZIP with exit 0 but warnings: missing MANIFEST.txt (unsigned candidate) and React 19 compatibility skipped because react-detect was killed after about 60 seconds. This is not a clean release-validation pass. This run did not supply a sourceCodeUri; repeat against the exact final source and signed ZIP.
- Validator image: grafana/plugin-validator-cli@sha256:f8a617d97355dd27b1df39cec6a6483ea60e8f38293ae9c3fe33a5b831049261.

## Browser validation

Browser plugin unavailable; used the existing @grafana/plugin-e2e / Playwright Chromium suite against Grafana 13.3.0 at http://127.0.0.1:3005 with synthetic data and a deterministic mock provider. Desktop 1440x1000 and narrow-screen checks exercise preview, removal, explicit images-only and combined analysis, persistence boundaries, data-only analysis and provider settings.

The initial run had 8 passes and 3 failures caused by optional Grafana page-history 404 diagnostics. Official Grafana v13.3.0 UserStorage source treats missing storage as empty. The existing exact-origin/path/method/status/body classifier was extended only to grafana-page-history, with negative checks for mismatched bodies/methods/statuses. Unexpected errors retain their source URL and still fail tests. See the final browser outcome below; mock transport is not proof of real model vision quality.

## Release blockers

Do not submit yet. Establish the supported-version matrix and real-provider evidence; resolve/document dependency advisories; repeat full validator checks on the final signed release artifact; confirm Grafana organization-admin access, plugin ownership and applicable Community/Commercial signature authorization; build and verify an immutable signed archive and public-download hashes/provenance. A GitHub signing-secret name exists, but its value, validity and account grant were not inspected.

Follow [the current submission handoff](GRAFANA_SUBMISSION.md). No release tag, public release, signing request or Grafana submission was performed by this audit. Historical approval statements are not carried forward as proof of this candidate's approval.

Final browser result: 11/11 passed on Grafana 13.3.0 after the diagnostic fix. Final TypeScript and lint checks passed (11 existing lint warnings). Other Grafana versions and a real vision provider were not exercised in this audit.

Final validator follow-up: after caching its pinned react-detect package, the full official validator completed against source commit c436feca5049ee6ec79bdca051a6c2b7d2788130 and the exact candidate ZIP (SHA256 62d92e58a4399fb3392a6b6eb69bad26ce4620d9b4e1034c45d0e304ca2e3968). Exit 0; the only remaining warning was the missing signature. React compatibility completed successfully. The initial timeout is resolved, not waived. Later documentation/screenshot-evidence edits do not change the candidate bundle; a release still requires fresh final-source/archive verification.

Cloud checks on c436fec: build/lint/unit, Grafana API compatibility, bundle comparison and version resolution passed. Six-version browser CI (11.6.16, 12.0.10, 12.2.10, 12.4.14, 13.1.9, 13.3.0) was running at this checkpoint. Final publication scan covered 66 source commits and 20 Wiki commits with zero findings.

Screenshot evidence now disables transition animations so the modal is captured fully visible; the upload-preview regression and authentication were rerun successfully (2/2). Public synthetic screenshot added to the image guide. No product behavior changed in this follow-up.

## Documentation publication follow-up — 2026-11-05

The public-readiness branch is incorporated into main with expanded upload-only user guides, 1.2.0 release notes, historical evidence labels, and synchronized wiki pages. The local documentation pass reran TypeScript, ESLint (11 existing warnings), all 63 unit tests and the production build successfully before incorporating the readiness branch. Its newer source/test fixes and exact-source evidence above are preserved. No new release tag, signing, or portal submission is included.
