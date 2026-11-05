# Public 1.2.1 release verification and catalog handoff

Published on GitHub on 2026-11-05. The exact archive passed strict Plugin Validator checks, has a verified Community signature for DigitalRCS, matching manifest file hashes, and verified GitHub build provenance. No Grafana catalog update was submitted in this task; catalog approval is separate.

## Exact release values

- [GitHub release](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/tag/v1.2.1)
- [Signed ZIP](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.2.1/digitalrcs-intelligencegateway-panel-1.2.1.zip)
- [Immutable source tag](https://github.com/digitalrcs/grafana-intelligence-gateway/tree/v1.2.1)
- Source commit: `bb43800e6717b749e668a121dfe0b87bd9383b0f`
- SHA1: `8b85b838fd04f14513d588ee474f7411b5e931c6`
- SHA256: `a7e52fe6e9eeb6fae41eb29893dc9b0773ed010d186e05637dd2dd7fdb78134f`
- Plugin ID: `digitalrcs-intelligencegateway-panel` (unchanged).
- Grafana: 11.6 or later. Companion: 1.1.0 or later; use security-fixed 1.1.2 or newer.

## Validation

All 84 unit tests, clean dependency install, high-severity dependency audit, typecheck, lint, build and latest Grafana API compatibility checks passed. [Candidate CI](https://github.com/digitalrcs/grafana-intelligence-gateway/actions/runs/42093619410) passed browser checks on Grafana 11.6.16, 12.0.10, 12.2.10, 12.4.0, 12.4.14, 13.1.9 and 13.3.0. Browser contracts use isolated test responses; cloud CI skips the optional live-backend test.

Separate real LM Studio checks completed query assessment, frozen-evidence follow-up and images-only browser assessment using synthetic evidence. Both image labels, values and their difference were correct. No live Copilot tenant validation or general model-quality guarantee is claimed.

[Release verification](https://github.com/digitalrcs/grafana-intelligence-gateway/actions/runs/42094539807) checked the exact downloaded ZIP with the full official Plugin Validator in strict mode and verified provenance against the tag, source commit and release workflow. Local verification checked archive root, ID/version, SHA1, signed manifest and every file hash. Public source and wiki history scans found no secrets.

The immutable 1.2.0 tag and draft archive are retained for traceability. Its validator reported direct window.location access; 1.2.1 resolves that warning using Grafana locationService. Use 1.2.1 for installation.

## Installation and catalog update

Install the companion first, replace the panel directory, restart Grafana and fully reload the browser. Install only one panel edition per Grafana instance. Existing settings remain supported; public dashboard/selected-panel capture is removed. Select a real backend/model or Copilot Studio Direct Line agent before analysis.

For the existing Grafana listing, use **Submit Update** with the ZIP URL, immutable source-tag URL and SHA1 above. Use the actual ZIP URL, not the checksum file or GitHub source archive. Signing and GitHub publication are not catalog submission or approval.
