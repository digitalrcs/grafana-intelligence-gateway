# Grafana Intelligence Gateway 1.0.0

Initial catalog-review release of the DigitalRCS Grafana Intelligence Gateway panel.

## Highlights

- Turns Grafana DataFrames into focused AI-assisted assessments.
- Reuses another panel's query results through Grafana's supported Dashboard data source.
- Routes all provider traffic through the required DigitalRCS secure companion data source.
- Keeps credentials server-side in Grafana `secureJsonData`; no provider secret or endpoint is stored in panel/dashboard JSON.
- Supports secure model discovery, prompt templates, skills context, bounded data serialization, cancellation, Clear analysis, and actionable errors.
- Provides large-model controls: hard output cap up to 1,048,576 tokens, provider/model default mode, soft answer-length guidance, and configurable long response timeouts.
- Uses full-width numeric values above sliders so large limits remain readable in the Grafana settings sidebar.

## Reviewer environment

The repository includes Docker provisioning, sample CSV data, an example dashboard, and a deterministic credential-free AI provider. Reviewers can test model discovery, analysis, clearing, and re-analysis without an external account or API key.

## Security boundary

The required `digitalrcs-intelligencegateway-datasource` companion owns provider credentials, endpoint allowlisting, HTTPS policy, redirect blocking, body limits, timeouts, model policy, and token ceilings. The panel communicates only through Grafana's authenticated data-source resource API.

## Compatibility and validation

- Declared Grafana compatibility: `>=11.6.0`.
- Type checking, linting, unit tests, production build, metadata validation, API compatibility, and multi-version Grafana E2E are included in CI.
- The tagged release workflow produces a correctly rooted ZIP and a GitHub build-provenance attestation.
- The first public-review archive is intentionally unsigned. Grafana assigns the public signature level after review.

See [Grafana submission information](GRAFANA_SUBMISSION.md) and [certification readiness](CERTIFICATION.md) for the exact release evidence and review instructions.
