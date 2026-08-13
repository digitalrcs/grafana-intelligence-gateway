# LM Studio Setup

1. Load a model and start LM Studio's API server.
2. In Grafana, add an **Intelligence Gateway Secure AI** data source.
3. Set **Provider** to `LM Studio`.
4. Enter a URL reachable from the Grafana server. With Docker Desktop this is commonly `http://host.docker.internal:1234/v1`; container `localhost` means the Grafana container itself.
5. For plain HTTP on a trusted local network, explicitly enable **Allow insecure HTTP**. Prefer HTTPS whenever possible.
6. Set the exact **Default model** ID and include it in **Allowed models**.
7. LM Studio commonly needs no credential. Leave API key and bearer token empty unless your server requires one.
8. Select **Save & test**.
9. Edit the panel, select this secure data source, choose **Load models securely**, select the approved model, and run **Analyze**.

Large local models can take several minutes. Keep the panel timeout at or below 600 seconds and align it with the data-source timeout. Reasoning tokens may consume the output ceiling before visible text is produced, so use a sufficiently large administrator and panel cap.
