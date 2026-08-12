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
$env:OPENAI_API_KEY = "your-development-test-key"
docker compose up --build
```

Open `http://localhost:3004`. The development Compose configuration mounts both unsigned plugins, provisions the secure data source, and loads a dashboard that sends CSV panel data through it. The key comes from the server environment and is not committed.

## Built artifact

Install both signed release artifacts for production. The plugin IDs are `digitalrcs-intelligencegateway-panel` and `digitalrcs-intelligencegateway-datasource`. Restart Grafana after installing a build or changing either `plugin.json`.

Private instances can be signed with `npm run sign -- --rootUrls https://grafana.example.com/`. Catalog releases must meet Grafana's publishing and signature criteria.
