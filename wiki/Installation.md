# Installation

Panel **1.1.0** requires **Grafana 11.6 or later** and **`digitalrcs-intelligencegateway-datasource` 1.1.0 or later**. Install the companion first. The optional Grafana LLM app has its own requirements: app 1.2.0 requires Grafana 13. The Current View Exporter plugin is not required for image capture.

## Development

Use Node.js 22, the declared npm version, Go 1.26.10 or later as required by the companion's `go.mod`, Mage, Docker, and Docker Compose. Keep the panel and companion data-source repositories as sibling directories.

```powershell
cd digitalrcs-intelligencegateway-datasource
npm install
npm run build
go run github.com/magefile/mage@v1.17.2 -v build:linux

cd ..\digitalrcs-intelligencegateway-panel
npm install
npm run build
docker compose up --build
```

Open `http://localhost:3004`. The development Compose configuration mounts both unsigned plugins, starts a credential-free deterministic mock provider, provisions the secure data source, and loads a dashboard that sends CSV panel data through it.

## Built artifact

Obtain the matching companion and panel archives from their release pages and follow the artifact and signature instructions for that exact version. Install the companion first. The plugin IDs are `digitalrcs-intelligencegateway-datasource` and `digitalrcs-intelligencegateway-panel`. Restart Grafana after installing a build or changing either `plugin.json`, then fully reload the browser page.

Verify release checksums and provenance against the downloaded archives. A provenance attestation establishes build origin; it is not a Grafana plugin signature or catalog approval. Do not assume a release is signed or approved solely because source code or release documentation exists. Use the [compatibility and certification guide](Grafana-Compatibility-and-Certification) for the recorded release status. Do not enable unsigned-plugin loading in production as a substitute for signing.

When upgrading from 1.0.1, retain the secure AI instance and existing data-only workflow. Image support is optional and the backend vision policy is off by default. To enable it, approve a vision-capable model in both model lists, then use [Image Analysis](Image-Analysis). Review provider and network policy before sending new types of evidence.

Private instances can be signed with `npm run sign -- --rootUrls https://grafana.example.com/`. Catalog releases must meet Grafana's publishing and signature criteria.

If an old UI remains after a verified installation, use a full-page reload or a fresh private session to compare. Dashboard Refresh reloads data, not plugin code. For same-version local builds, follow [cache guidance](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/main/docs/DEVELOPMENT.md#rebuilt-code-still-looks-unchanged); do not clear unrelated browser credentials or weaken server settings.
