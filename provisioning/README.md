# Local Grafana setup

The public stack runs on loopback port 3005. It provisions an unconfigured Intelligence Gateway panel and Grafana TestData for optional local query experiments. It does not provision an AI backend or select a model.

Build the panel and the shared secure companion first. Set INTELLIGENCE_GATEWAY_DATASOURCE_DIST to the companion dist directory if it is not beside this repository, then run docker compose up -d --build.

Open http://localhost:3005 and the **Intelligence Gateway** dashboard. Add a real **Intelligence Gateway Secure AI** instance under **Connections → Data sources**, configure its provider and credentials, and select **Save & test**. In the panel, select it under **1. Connect AI** and choose the model or Copilot agent alias. Configure query results or upload reviewed images before analysis.

For LM Studio on the Docker Desktop host, use http://host.docker.internal:1234/v1 if that is where your server runs. Container localhost is not the host. HTTPS is preferred; an HTTP-only trusted lab requires the companion's explicit insecure-HTTP setting. No backend address, credential or model is bundled.

Browser test dashboards and response fixtures live under tests/ and are created temporarily by Playwright, never installed as the user’s AI backend. See [development](../docs/DEVELOPMENT.md).
