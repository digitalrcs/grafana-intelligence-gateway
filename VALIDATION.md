# Public candidate validation

See [the current audit](docs/PUBLIC_AUDIT.md) for verified results, limitations and remaining gates. Version 1.2.0 remains an unreleased candidate.

## Release reliability follow-up — 2026-11-05

- Fixed an ambiguous fingerprint stream: each serialized value is length-prefixed and frame/field/value counts preserve structural boundaries. This remains a non-cryptographic change detector.
- Counters now report null increase and reset counts without a valid adjacent nonnegative sample pair, and expose `adjacentPairs` coverage. Tests cover empty, singleton, missing/non-finite, negative and truncated samples, and distinguish observed zero increase.
- Replaced direct configuration access in the connection link with Grafana's base-URL helper to preserve subpath handling without the latest-runtime configuration type incompatibility.
- Separately exercised real image inference through the secure companion and the existing LM Studio model using a generated synthetic PNG. The model correctly returned ALPHA 80, BETA 40 and ALPHA as larger. The temporary source was removed. This is a narrow live image check, not a general vision-quality guarantee or Copilot tenant test.

## Real-backend setup cleanup — 2026-11-05

- Removed the bundled mock server, Docker service, default AI data source, demo dashboard content and mock-specific UI. Normal provisioning now opens an unconfigured panel; analysis requires a selected AI connection and model or Copilot agent alias. Existing provider integrations and assessment capabilities remain available.
- Replaced large connection banners with compact status and setup guidance. Evidence, sharing and follow-up controls are expandable. Updated repository, catalog, setup and reviewer documentation.
- TypeScript and production build passed. Unit tests: 74 passed across 10 suites, including missing-connection blocking. The reduced count reflects replacement of obsolete mock-banner tests. ESLint: zero errors, 12 deprecation warnings. Whitespace checks passed.
- Grafana 13.3.0 on isolated loopback port 3005: final Chromium suite 14 passed, one opt-in live test skipped. Browser-only response contracts cover assessment, baseline, export and PNG/JPEG workflows without starting an AI simulator. The image fixture explicitly supplies capabilities; these tests do not establish live vision support.
- Separately, the opt-in live test and authentication passed against the existing LM Studio backend using `qwen3.5-9b-uncensored-hauhaucs-aggressive`: a synthetic query assessment and frozen-evidence follow-up completed without intercepted responses or uncaught page errors. This checks integration, not factual accuracy. The temporary connection and dashboard were removed afterward.
- Reviewed the fresh setup and live assessment screenshots, plus desktop and narrow workflow screenshots. Browser plugin unavailable; used the repository's Playwright tooling. The earlier baseline test needed its collapsed Share assessment section opened before downloading.
- Removed the obsolete demo container and data source from the public preview. Shared/private Grafana instances were not changed. Copilot tenant inference and live image inference were not exercised; existing Direct Line preview limitations still apply. No signing, publication or catalog submission was performed.

## Assessment workflow additions — 2026-11-05

The results in this section predate the real-backend setup cleanup below; references to the removed demo describe historical validation only.

- Added evidence/freshness details, task presets, bounded numeric summaries, supplied-query baseline comparison, frozen-text follow-ups and opt-in evidence exports. Setup is organized into six numbered sections; see [setup](docs/SETUP.md).
- TypeScript, production webpack build, public-edition guard and whitespace checks passed. ESLint has zero errors and 12 deprecation warnings (including the established Grafana Select API used across the supported versions).
- Unit suite: 78 tests passed across 10 suites. Covers valid bounded JSON, sampling counts, nulls/counter resets, compatible/ambiguous baseline fields, frozen evidence, stale-data detection, cancellation, automatic-analysis pause/resume and preserving literal query values during variable substitution. The evidence suite was rerun after preserving field descriptions: 9/9 passed.
- Chromium on Grafana 13.3.0, loopback port 3005: final full suite 13/13 passed. Grafana 11.6.16 used separate storage on loopback port 3006: full suite 13/13 passed; the final prompt/evidence adjustments also passed the focused workflow rerun (3/3 including authentication).
- Desktop 1440×1000 and dashboard viewport 390×844 were checked. Setup, preset selection, stale warnings, snapshot follow-up payloads, exported Markdown, baseline arithmetic, image workflows and clearing passed. No unexpected console/page errors occurred in the observed workflows; the existing exact-response classifier records known Grafana optional-configuration diagnostics.
- Browser plugin unavailable: used the repository’s `@grafana/plugin-e2e` Playwright tests. Initial failures exposed a native dropdown layout issue (replaced with Grafana Select), an unapplied text-editor change (test now blurs the input), and narrow host-editor interception (narrow testing now uses the dashboard, not Grafana’s split editor). An initial startup network-idle timeout did not recur in the serial full run.
- All inference tests used synthetic query data and the explicitly labeled deterministic mock. These verify transport and workflow, not real-model assessment quality. No signing, public release, Wiki publication or catalog submission was performed. Intermediate Grafana versions and latest development images were not exercised in this change.
