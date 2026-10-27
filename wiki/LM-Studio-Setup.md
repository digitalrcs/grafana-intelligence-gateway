# LM Studio Setup

Use panel and secure companion **1.1.0 or later** together. The Grafana LLM app is not required for LM Studio.

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

For a suitable local reasoning model, a bounded test example is **Maximum output tokens** `8192` in both panel and data source, a **Requested answer max tokens (soft)** target of `500`, and `300`-second panel/backend deadlines. These are not universal model capabilities. The smaller hard cap applies; selecting provider defaults is not unlimited. There is no separate reasoning-effort control. A model that finishes reasoning without a visible answer needs different investigation from a network timeout.

## Images

Load a model that actually supports vision. In the companion, turn on **Enable image analysis** and add its exact ID to **Allowed vision models**, as well as **Allowed models**. Finding an ID in the model list does not verify vision support.

Choose the evidence in the panel:

- **Data only:** connect **Queries → Dashboard → Source panel**, leave images unattached, and select **Analyze**.
- **Images only:** no query results required; turn **Include query data with images** off, preview captures or uploads, then select **Use images → Analyze images**.
- **Data and images:** connect query results, leave **Include query data with images** on, preview the images, and explicitly select **Analyze images**.

Use a synthetic image with known visual facts to verify the response. A model-list request, successful text completion, or mock receipt is not a vision test. See [Image Analysis](Image-Analysis) and [LM Studio's OpenAI-compatible API documentation](https://lmstudio.ai/docs/developer/openai-compat).
