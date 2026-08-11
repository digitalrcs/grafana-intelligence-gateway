# LM Studio Setup

1. Load a model in LM Studio.
2. Start the local API server.
3. Enable CORS for the Grafana origin.
4. Select **LM Studio** in panel options.
5. Use `http://localhost:1234/v1` unless LM Studio reports another URL.
6. Enter the loaded model identifier; an API key is normally unnecessary.
7. Keep **Reasoning effort** set to **None** unless you deliberately want a reasoning model to spend part of the output-token budget on hidden reasoning. If you enable reasoning, increase **Maximum output tokens** accordingly.
8. **Response timeout** defaults to 300 seconds. Increase it for large or slow local models. A timeout cancels the browser request and displays a specific timeout message in the panel.

HTTPS Grafana pages may block plain HTTP endpoints as mixed content. Use a local TLS proxy or a Grafana backend proxy if needed. In remote Grafana deployments, remember that browser `localhost` is the viewer's workstation.
