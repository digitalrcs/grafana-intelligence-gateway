# Development and local setup

This guide covers the development environment and release workflow. For product setup, see the [user documentation](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki).

## Requirements

Use Node.js 22 and the npm version declared in `package.json`, Docker, and Docker Compose. The scaffold CLI supports Linux/macOS; use WSL for scaffolding on Windows.

The integrated environment expects the companion [secure AI data source](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource) in the sibling `../digitalrcs-intelligencegateway-datasource` directory. Build its frontend and Linux backend first, following that repository's instructions.

## Run locally

From the panel repository:

```bash
npm install
npm run dev
```

In a second terminal:

```bash
docker compose up
```

Open <http://localhost:3004>. Compose mounts both plugins, provisions an AI data source and sample dashboard, and starts a credential-free mock provider. The mock returns a fixed connectivity receipt; it does not analyze data. Use a configured model endpoint for actual analysis.

The development container enables anonymous Admin access. Do not use that configuration for a production deployment.

The sample dashboard uses the synthetic [traffic-shift fixture](../testdata/reviewer-traffic.csv). Run `npm run sync:test-data` after replacing the fixture, then restart Grafana. The script embeds the CSV into Grafana TestData's **CSV Content** query and updates the dashboard time range. The original `testdata/datasource.csv` is preserved separately.

For LM Studio outside the Grafana container, configure a server-reachable address such as `host.docker.internal`. Prefer HTTPS; any HTTP exception must be explicitly enabled in the companion data source and confined to a trusted environment.

## Build and test

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

E2E tests require the provisioned Grafana and mock provider to be running. Use the multi-version GitHub Actions matrix for compatibility checks.

The webpack build packages **`src/README.md`** as `dist/README.md`; the root README is the repository landing page. Keep their product descriptions consistent. Catalog screenshots and SVG plugin icons are copied from the paths declared in `src/plugin.json`. Restart Grafana after changes to plugin metadata.

The catalog analysis screenshot is an unchanged copy of [the recorded live LM Studio capture](images/reviewer-live-assessment.png). The [DigitalRCS logo](images/digitalrcs-logo.webp) is the original asset from [digitalrcs.com](https://digitalrcs.com/assets/images/digitalrcs-logo.webp), retrieved September 27, 2026.

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
- `src/utils/aiClient.ts`: secure data-source transport and response/error handling.
- `src/utils/dataFrames.ts`: bounded serialization of panel query data.
- `src/utils/prompt.ts`: prompt-template construction.
- `src/module.ts`: panel option registration.
- `provisioning/dashboards/dashboard.json`: local development dashboard.
- `examples/dashboard.json`: importable configuration example.
- `wiki/`: source for the published GitHub Wiki.

See [Contributing](../CONTRIBUTING.md) and [Security](../SECURITY.md).
