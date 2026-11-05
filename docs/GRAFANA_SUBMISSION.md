# Public 1.2.0 submission preparation

Public 1.2.0 is an unreleased source candidate. Uploading source and the wiki to GitHub does not sign a plugin, publish a release archive, or submit a Grafana catalog update.

- Plugin ID: `digitalrcs-intelligencegateway-panel` (unchanged).
- Type: frontend-only panel; minimum Grafana: 11.6.0.
- Required companion: `digitalrcs-intelligencegateway-datasource` 1.1.0 or later; use security-fixed 1.1.2 or later.
- Public scope: query-data analysis and explicitly submitted PNG/JPEG uploads. No dashboard or selected-panel capture.

## Remaining release steps

1. Confirm organization-admin access, plugin ownership, and applicable public signature authorization. Pass the public-edition guard, typecheck, lint, unit tests, production build, and supported-version browser matrix on the exact release commit. See [validation](../VALIDATION.md).
2. Verify data-only, images-only, and combined analysis, preview without inference, absent capture controls, removal/clear, and vision policy. Use the deterministic mock for transport and an approved real vision provider with synthetic evidence for understanding.
3. Create an immutable version tag only after release checks pass. Build and sign through the release workflow.
4. Inspect the exact downloaded ZIP: plugin root, version, manifest/signature, SHA1, build provenance, and full Plugin Validator results.
5. Record the actual published ZIP URL, immutable source-tag URL, and 40-character SHA1 value here. Those values are pending; do not reuse 1.1.2 values for 1.2.0.
6. Use **Submit Update** for the existing Grafana listing. Portal submission and catalog approval are separate actions.

Follow the [reviewer walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough). The mock returns a fixed receipt, not AI inference. No hosted credentials are bundled. Restart Grafana after installation and reload the browser.

See [public changes](RELEASE_NOTES_1.2.0.md) and the [historical 1.1.2 handoff](GRAFANA_SUBMISSION_1.1.2.md).
