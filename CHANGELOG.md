# Changelog

## Unreleased

## 1.0.0 - 2026-08-13

### Security

- Routes all model discovery and analysis through the required `digitalrcs-intelligencegateway-datasource` companion plugin.
- Stores provider credentials only in the companion data source's Grafana `secureJsonData`; the panel has no browser-side API-key, bearer-token, provider-URL, or direct provider transport.
- Documents the backend endpoint policy, HTTPS default, administrator-controlled insecure HTTP override, and prompt-injection boundary.

### Features

- Analyzes Grafana DataFrames with system instructions, user templates, skills context, and bounded recent-row serialization.
- Reuses another panel's official query results through Grafana's Dashboard data source.
- Provides secure model discovery, manual and debounced automatic analysis, cancellation, and Clear analysis.
- Supports a hard output cap up to 1,048,576 tokens, provider/model-default mode, a soft visible-answer limit, and long configurable timeouts.
- Places full-width numeric values above sliders so all supported digits remain visible in Grafana's settings sidebar.
- Renders sanitized, theme-aware Markdown and actionable provider, timeout, empty-data, and token-exhaustion errors.

### Review and operations

- Includes deterministic credential-free provider provisioning, sample CSV data, an example dashboard, and reviewer instructions.
- Adds type checking, linting, unit tests, metadata validation, compatibility checks, and multi-version Grafana E2E coverage.
- Adds automated tagged release packaging and GitHub build-provenance attestation.
