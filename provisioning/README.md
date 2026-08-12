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
$env:OPENAI_API_KEY = "your-development-test-key"
docker compose up --build
```

Open <http://localhost:3004>. The secret is expanded into `secureJsonData` by Grafana provisioning and is not stored in
the dashboard or repository. If `OPENAI_API_KEY` is unset, Grafana and the selector still load, but live analysis and the
data-source health check report that provider authentication is missing.
