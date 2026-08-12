# Installation

## Development

Use Node.js 22+, npm, Go 1.26.5+, Mage, Docker, and Docker Compose. Keep the panel and companion data-source repositories as sibling directories.

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

Install the signed data-source release first, followed by the signed panel release. The plugin IDs are `digitalrcs-intelligencegateway-datasource` and `digitalrcs-intelligencegateway-panel`. Restart Grafana after installing a build or changing either `plugin.json`.

Private instances can be signed with `npm run sign -- --rootUrls https://grafana.example.com/`. Catalog releases must meet Grafana's publishing and signature criteria.
