# Development and testing

Read EDITION.md and AGENTS.md. Requires Node.js 22+, Docker and the secure companion build. Never modify .config or change the plugin ID/type.

Run npm ci, npm run typecheck, npm run lint, npm run test:ci and npm run build. The public edition guard rejects cross-panel capture code. Set INTELLIGENCE_GATEWAY_DATASOURCE_DIST to the shared companion dist directory, then run docker compose up -d --build. The isolated public stack binds only 127.0.0.1:3005.

## User setup

The provisioned Intelligence Gateway dashboard starts with no AI data source or model selected. Configure a real backend in Grafana Connections, select it in the panel, then connect query evidence or review uploaded images. See [setup](SETUP.md). Keep secrets in the companion’s secure fields.

## Automated tests

Run npm run e2e against the dedicated local test instance. Tests create temporary data sources and dashboards, intercept only their browser-side inference responses, and delete the temporary resources afterward. They never provision a simulated provider into the normal application. Unit doubles and browser contract responses verify behavior, not backend inference. Use the multi-version GitHub Actions matrix for compatibility.

The optional live-backend.spec.ts test requires LIVE_AI_DATASOURCE_UID and LIVE_AI_MODEL to identify an explicitly configured real backend. It sends synthetic query evidence and verifies a completed answer. Without those variables it is skipped. Do not put credentials into these variables or checked-in files.

Cover data-only, images-only, combined evidence, preview without inference, explicit image submission, clear/cancellation, limits, baseline comparisons, snapshot conversations, exports and responsive layout. Real vision and Copilot tenant behavior require their own approved end-to-end checks.

The CSV sample under testdata is a test input. npm run sync:test-data updates tests/fixtures/dashboard.json, not the normal starter dashboard.

## Rebuilt code still looks unchanged

Rebuild the production bundle, restart the isolated Grafana instance after replacing plugins, and reload the entire browser page. Dashboard Refresh does not reload JavaScript. Preserve unrelated Grafana instances. Verify the loaded plugin versions and actual rendered controls before claiming an upgrade succeeded.

## Release

Use the compatible pinned companion revision in CI. Validate the final source, signed archive, provenance and public-download digest before release; passing tests does not imply catalog approval. See [submission gates](GRAFANA_SUBMISSION.md).
