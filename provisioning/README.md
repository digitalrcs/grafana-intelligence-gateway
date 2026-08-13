# Local provisioning

The Docker environment provisions:

- `TestData DB` for the dashboard's CSV source panel.
- `Intelligence Gateway Secure AI` (`intelligence-gateway-secure`) for server-side provider access.
- A dashboard whose Intelligence Gateway panel reads the CSV source through Grafana's Dashboard data source and sends
  the constructed prompt through the secure AI data source.

Before starting Grafana, build both sibling plugins:

```powershell
cd C:\Data\GrafanaAIPlugin\digitalrcs-intelligencegateway-datasource
npm run build
go run github.com/magefile/mage@v1.17.2 -v build:linux

cd C:\Data\GrafanaAIPlugin\digitalrcs-intelligencegateway-panel
npm run build
docker compose up --build
```

Open <http://localhost:3004>. Compose starts a deterministic mock provider, so model discovery, health checks, and live
analysis work without an external account or credential. This environment is for review and automated testing only.
