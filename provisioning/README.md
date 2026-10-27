# Local provisioning

The Docker environment provisions:

- `TestData DB` for the dashboard's CSV source panel.
- `DEMO ONLY - Mock AI (no inference)` (`intelligence-gateway-secure`) for a fixed mock receipt through the secure backend. No model or analysis is bundled.
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

The introduction **Mock demo: no AI analysis** describes this supplied default. Read the analysis panel's current **AI connection label** after changing settings; a static introduction is not the active provider status. The mock's non-secret `jsonData.reviewMock: true` marks its demo purpose, not an authentication or policy bypass.

| Component                                              | Purpose                                                                            |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| TestData source panel                                  | Supplies synthetic CSV rows and renders the chart.                                 |
| Analysis panel **Queries → Dashboard**                 | Shares those query rows. Not the AI connection; optional for images-only analysis. |
| Analysis panel **AI provider → Secure AI data source** | Selects the secure instance and model used for assessment.                         |
| Supplied mock instance                                 | Returns a fixed connectivity receipt, never inference.                             |

## Phase 1: verify the mock path

Check that the analysis panel names **DEMO ONLY - Mock AI (no inference)** and shows **Mock connection — no AI analysis**. Select **Analyze** and expect the labeled mock receipt. Changing the chart does not change that fixed receipt into an analysis.

## Phase 2: configure a separate real provider

1. Open **Connections → Data sources → Add new data source** and choose **Intelligence Gateway Secure AI**. Create a new instance; retain the supplied mock for automated tests.
2. Configure the real provider's server-reachable base URL, model and allow-list, and required secure credential. For LM Studio on the Docker Desktop host, use `http://host.docker.internal:1234/v1`, not container `localhost`. For another host, enable approved server-network access and firewall routing. Prefer HTTPS; use the explicit HTTP exception only in a trusted lab.
3. Select **Save & test**. It checks access, not answer quality or vision.
4. Edit the analysis panel's **AI provider** settings and select the new secure instance plus an approved model. **Queries → Dashboard** remains the separate evidence connection for data-only or combined analysis; it is unnecessary for images-only use.
5. Confirm the panel's AI connection label names the new instance/model, then analyze approved synthetic evidence. Keep administrator output, timeout, payload, model, and network policies in force. A local reasoning model may need matching 8,192-token panel/backend caps and 300-second deadlines with a soft 500-token answer target; these are bounded examples, not universal model support.

Follow the [real-provider quickstart](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough#phase-2-connect-a-real-provider) to assess the synthetic traffic and test changed input. No live vision capability is implied by the mock checks. This environment is for review and automated testing only; never point the full E2E suite at a real provider.
