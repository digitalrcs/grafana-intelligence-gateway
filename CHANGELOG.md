# Changelog

## 1.1.2 - 2026-10-30

- Fix dashboard capture on Grafana 12.4.0 when body overflow belongs to the document viewport.
- Stop with an explicit error if scrolling stalls before the dashboard bottom, instead of composing an incomplete image.
- Add tall-dashboard browser regression coverage and pin Grafana 12.4.0 and 13.3.0 in CI alongside resolved versions.
- Companion data source requirement remains 1.1.0 or later.

## 1.1.1 - 2026-10-30

- Prepare the public-signing release after Grafana's review; plugin functionality and runtime dependencies are unchanged from 1.1.0.
- Update the development-only Grafana E2E helper and test synchronization for current Grafana versions; classify companion catalog diagnostics using the installed companion version rather than the panel version.
- Require a configured Grafana signing token before the release build and a signed manifest in the exact downloadable archive before release verification can succeed.
- Preserve archive checksum, build-provenance, and full plugin-validator verification. The generated manifest and validation results establish the actual signature status; this changelog does not claim catalog publication or certification.

## 1.1.0 - 2026-10-26

- Clearly label the supplied mock connection before analysis, show the selected AI instance/model, and provide a separate real-provider setup checklist. Mock responses are delivery receipts, not AI assessments.
- Keep image-capture panel titles left-aligned beside their checkboxes, with wrapping on narrow screens.
- Read capture labels from panel headings, not the surrounding panel body, and bound generated labels to 256 UTF-8 bytes without breaking Unicode characters.
- Add dashboard capture, selected-panel capture, and PNG/JPEG upload with removable previews and explicit image submission.
- Keep images out of saved dashboards and automatic analysis; clear pending images on success, Clear analysis, or provider/model change.
- Validate image dimensions, bytes, aggregate limits, model approval, and request size; strip hidden upload metadata by re-encoding pixels.
- Integrate companion capabilities for LM Studio, Open WebUI, optional Grafana LLM app, and the bounded Copilot Studio Direct Line preview. Corporate SSO/delegated authentication is not implemented.
- Document image limits, provider setup, capture caveats, enterprise authentication, and synthetic validation.
- Restrict the build to the plugin source so archived release evidence cannot become extra bundle entries.
- Patch the development signing dependency and host-external Moment dependency; retain the documented moderate React Router advisory assessment.
- Require companion data source 1.1.0 or newer for image and provider-capability features. Existing data-only analysis remains available.

## 1.0.1 - 2026-09-27

### Documentation

- Refresh the catalog and repository overview with local and hosted AI use cases, panel-data setup, and DigitalRCS branding.
- Replace outdated catalog screenshots with a genuine LM Studio assessment of synthetic dashboard data.
- Clarify the separate data and AI connections, data handling, and analysis controls.

### Maintenance

- Update Grafana E2E tooling for the Grafana 13.2 panel editor.
- Add a synthetic traffic-shift example and recorded LM Studio assessment; clearly identify the deterministic mock provider.
- Update affected transitive dependencies and use Node.js 22 in the release workflow.

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
