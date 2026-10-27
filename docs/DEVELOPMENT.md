# Development and local setup

This guide covers the development environment and release workflow. For product setup, see the [user documentation](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki).

## Requirements

Use Node.js 22 and the npm version declared in `package.json`, Docker, and Docker Compose. The scaffold CLI supports Linux/macOS; use WSL for scaffolding on Windows.

The integrated environment expects the companion [secure AI data source](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource) in the sibling `../digitalrcs-intelligencegateway-datasource` directory. Panel 1.1.0 requires companion 1.1.0 or later. Build its frontend and Linux backend first, following that repository's instructions. Grafana 11.6 or later is required; the optional Grafana LLM app can impose a higher minimum (app 1.2.0 requires Grafana 13).

## Run locally

The default Compose image is `Dockerfile.review`: Grafana's official entrypoint in production application mode, with only the two review plugin IDs explicitly allowed unsigned. It does not inject the scaffold's live-reload script. This is a local review fixture, not a hardened public service; never expose anonymous administrator access. To explicitly use scaffold hot reload for local development, set `GRAFANA_DOCKERFILE=Dockerfile`, `GRAFANA_APP_MODE=development`, and `DEVELOPMENT=true`; do not use that profile for release validation or as a cache workaround.

From the panel repository:

```bash
npm install
npm run dev
```

In a second terminal:

```bash
docker compose up
```

Open <http://localhost:3004>. Compose mounts both plugins, provisions **DEMO ONLY - Mock AI (no inference)** and a sample dashboard, and starts a credential-free mock provider. This supplied default returns a fixed connectivity receipt: no model runs and no data or image analysis occurs. The dashboard introduction describes the supplied default; read the analysis panel's current AI connection label after changing providers. Follow the [two-phase quickstart](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough#phase-2-connect-a-real-provider) to create a separate real-provider instance. Keep the mock for automated tests.

The development container enables anonymous Admin access. Do not use that configuration for a production deployment.

The sample dashboard uses the synthetic [traffic-shift fixture](../testdata/reviewer-traffic.csv). Run `npm run sync:test-data` after replacing the fixture, then restart Grafana. The script embeds the CSV into Grafana TestData's **CSV Content** query and updates the dashboard time range. The original `testdata/datasource.csv` is preserved separately.

For LM Studio on the Docker Desktop host, use `http://host.docker.internal:1234/v1`; container `localhost` means the Grafana container. Another host requires an address reachable from Grafana, approved LM Studio network access, and firewall routing. Prefer HTTPS; any HTTP exception must be explicitly enabled in the companion and confined to a trusted environment. The exception does not bypass model, redirect, payload, timeout, or other network policy.

## Build and test

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

E2E tests require the provisioned Grafana and mock provider to be running. Use the multi-version GitHub Actions matrix for compatibility checks.

Image tests require version-compatible builds of both repositories (1.1.0 or later). The provisioned `review-model` is explicitly vision-enabled only for the deterministic mock; its image-count receipt proves transport, not visual understanding. Tests cover preview without inference, selected/dashboard capture, upload, explicit submission, exclusion of Intelligence Gateway panels, cancellation, clear, and checkbox-label alignment at desktop and narrow sizes. Validate data-only, images-only with no query results, and combined requests separately. Follow [Image Analysis](IMAGE_ANALYSIS.md) for limits and provider setup.

Use the compatible companion revision selected by the CI/release workflow. Do not pair panel 1.1.0 with the pre-image 1.0.1 backend or skip tests to make an incompatible pair appear supported. Run the multi-version matrix against the release pair before claiming supported-version compatibility. Never point the full E2E suite at an instance configured to call a real provider; use the dedicated mock environment. Preview-only regression checks can be selected separately and must block inference requests.

The webpack build packages **`src/README.md`** as `dist/README.md`; the root README is the repository landing page. Keep their product descriptions consistent. Catalog screenshots and SVG plugin icons are copied from the paths declared in `src/plugin.json`. Restart Grafana after changes to plugin metadata.

The catalog analysis screenshot is an unchanged copy of [the recorded live LM Studio capture](images/reviewer-live-assessment.png). The [DigitalRCS logo](images/digitalrcs-logo.webp) is the original asset from [digitalrcs.com](https://digitalrcs.com/assets/images/digitalrcs-logo.webp), retrieved September 27, 2026.

### Rebuilt code still looks unchanged

Grafana can keep a plugin loaded for the lifetime of a page, and filesystem plugin URLs can use the plugin version as their cache key. Rebuilding the same development version may therefore leave an existing tab using older JavaScript even after refreshing dashboard data. Verify the exact served `module.js` against the built file before diagnosing a new code defect. In browser developer tools, temporarily enable **Network → Disable cache** and reload the whole page with the tools open, or compare in a fresh private browser session. Do not clear all site data or credentials as a first step. For repeatable deployment checks, use a unique prerelease version in the isolated preview's metadata, restart that preview server, and reload the page; never modify an already published release tag or archive. The dashboard Refresh button refreshes data, not the plugin runtime.

In Grafana 13.1.1, the [plugin loader](https://github.com/grafana/grafana/blob/v13.1.1/public/app/features/plugins/loader/pluginInfoCache.ts) adds `?_cache=<plugin version>` to filesystem module URLs. Changing files without changing that version reuses the URL; the module hash serves integrity checking, not a separate cache key. A new release version plus a Grafana restart and full-page reload is the durable upgrade path. Do not switch a production server to development mode solely to bypass cache: that mode also changes [unsigned-plugin handling](https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-sign/).

## Signing and releases

CI builds, tests, packages, and validates metadata. Signing runs when `GRAFANA_ACCESS_POLICY_TOKEN` is configured. The tagged release workflow uses `grafana/plugin-actions/build-plugin` and generates GitHub build-provenance attestation.

For private signing:

```bash
export GRAFANA_ACCESS_POLICY_TOKEN="..."
npm run build
npm run sign -- --rootUrls https://grafana.example.com/
```

For catalog publication, see [Compatibility and Certification](CERTIFICATION.md) and the existing [submission handoff](GRAFANA_SUBMISSION.md). Keep source tags and release artifacts immutable. A catalog README change must be included in a newly packaged submission; changing GitHub's README alone does not update the catalog.

The [reviewer walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough) and [live evidence](LIVE_REVIEW_EVIDENCE.md) describe the synthetic scenario, deterministic mock, and real-provider checks.

## Source map

- `src/components/IntelligenceGatewayPanel.tsx`: analysis lifecycle and runtime controls.
- `src/components/ImageInputs.tsx`: in-memory image preview and capture controls; no inference transport.
- `src/vision/`: bounded capture/import utilities, isolated Grafana DOM adapter, and exporter provenance.
- `src/utils/aiClient.ts`: secure data-source transport and response/error handling.
- `src/utils/dataFrames.ts`: bounded serialization of panel query data.
- `src/utils/prompt.ts`: prompt-template construction.
- `src/module.ts`: panel option registration.
- `provisioning/dashboards/dashboard.json`: local development dashboard.
- `examples/dashboard.json`: importable configuration example.
- `wiki/`: source for the published GitHub Wiki.

See [Contributing](../CONTRIBUTING.md) and [Security](../SECURITY.md).
