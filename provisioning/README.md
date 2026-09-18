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

Open <http://localhost:3004> and choose **Intelligence Gateway: traffic-shift walkthrough**. Compose starts a deterministic mock provider: model discovery, health checks, and the request/response path work without an external account or credential, but **no AI inference or data analysis occurs**. The response explicitly says **MOCK MODE**.

Follow the [Reviewer Walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough) to connect a separate real provider, assess the synthetic traffic, and test changed input. This environment is for review and automated testing only.
