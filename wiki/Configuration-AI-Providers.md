# Configuration: Secure AI Provider

The panel requires a configured **Intelligence Gateway Secure AI** data source. Provider URLs and credentials are configured only by a Grafana administrator in that data source; the panel stores only its UID and non-secret generation choices.

The data source supports OpenAI, LM Studio, and custom OpenAI-compatible chat-completions endpoints. Configure its default model, approved model list, timeout, administrator output-token ceiling, HTTPS policy, and API key or bearer token, then select **Save & test**.

In the panel:

- **Secure AI data source** selects the backend instance.
- **Model** can be typed or loaded securely. The backend returns only administrator-approved models.
- **Maximum output tokens** is a request cap from 64 to 1,048,576; the backend administrator ceiling still wins.
- **Provider/model default output limit** omits the panel cap, but the backend still applies its ceiling.
- **Requested answer max tokens (soft)** adds a concision instruction that models can only approximate.
- **Response timeout** cancels the browser-side wait from 10 to 600 seconds; the backend also enforces its configured deadline.

See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) and the [data-source configuration guide](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki/Configuration).
