# Grafana Intelligence Gateway

AI-assisted assessment panel for Grafana DataFrames. Configure OpenAI, LM Studio, a custom OpenAI-compatible endpoint, or experimental Copilot Studio messaging; then connect query results and select **Analyze**.

For another panel's data, use Grafana's built-in **Dashboard** data source. The panel reads only its own official `data.series` input.

## Important security note

This frontend-only panel cannot store secrets with `secureJsonData`. Masked key fields are still serialized in dashboard JSON. Use restricted development credentials only and add a backend/data-source proxy before production use.

Do not return secrets through a JSON/CSV data source query: query results are browser-visible DataFrames. See the repository Wiki's Secure Backend and Secret Storage page for the companion data-source contract.

Full documentation: <https://github.com/DigitalRCS/grafana-intelligence-gateway>
