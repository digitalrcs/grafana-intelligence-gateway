# Configuration: Secure AI Provider

Panel 1.1.0 requires a configured **Intelligence Gateway Secure AI** data-source instance from companion plugin **1.1.0 or later**. Provider URLs and credentials are configured in that data source, not in the panel. The panel stores the instance UID and non-secret analysis settings.

**Secure AI data source** selects the model connection. **Queries → Dashboard** separately selects another panel's measurements. Both are used for data-only or combined assessment; an images-only assessment still needs the secure AI instance but does not need query results.

## Provider choices

| Provider                               | Example base URL                                                           | Credential and model requirements                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| OpenAI                                 | `https://api.openai.com/v1`                                                | Secure API key; approved Chat Completions model accepting the adapter's generation parameters.                    |
| LM Studio                              | `https://lmstudio.example.com/v1`                                          | Exact loaded model ID; secure credential only if the server requires one.                                         |
| Open WebUI                             | `https://openwebui.example.com` or `https://openwebui.example.com/api`     | Approved API credential; exact model ID exposed to that credential.                                               |
| Grafana LLM app                        | `https://grafana.example.com/api/plugins/grafana-llm-app/resources/llm/v1` | Dedicated Grafana service-account bearer token; `base` or `large` alias configured by the app administrator.      |
| Custom OpenAI-compatible               | `https://ai.example.com/v1`                                                | Compatible `/models` and `/chat/completions` endpoints; approved model and credentials.                           |
| Copilot Studio Direct Line **preview** | `https://directline.botframework.com/v3/directline`                        | Secure Direct Line channel secret; descriptive agent alias. Not enterprise SSO or delegated Entra authentication. |

For each instance, configure the default model, approved model list, timeout, administrator output ceiling, HTTPS/network policy, and only the required secure credential. Select **Save & test**. A successful health check does not prove inference quality or image understanding.

OpenAI-compatible adapters use buffered Chat Completions with `max_tokens` and, when configured, `temperature`. Models requiring other parameter names, unsupported temperature settings, or the Responses API need a different adapter. A discovered model is not automatically compatible. See [Image Analysis](Image-Analysis) for exact vision requirements and provider limitations.

The **Grafana LLM app is optional** and not required for the other five choices. App 1.2.0 requires Grafana 13 and has an upstream two-minute timeout. Its dedicated service-account token is not the viewing user's SSO identity.

Copilot's agent owns model choice, tools, temperature, and output-token policy. Direct Line does not enforce the panel's temperature or hard output limit. The preview requires a compatible correlated reply/completion contract and tenant-approved secured channel. See [Copilot Studio Notes](Copilot-Studio-Notes); mock coverage is not enterprise-tenant validation.

## Panel controls

- **Secure AI data source** selects the backend instance.
- **Model** can be typed or loaded securely. The backend returns only administrator-approved models or agent aliases.
- **Maximum output tokens** is a request cap from 64 to 1,048,576 where supported; the smaller panel/admin limit applies. The range does not imply model support for its maximum.
- **Provider/model default output limit** omits only the panel cap; it does not remove the backend ceiling or make output unlimited.
- **Requested answer max tokens (soft)** adds an approximate concision instruction, not a hard limit on visible text or reasoning.
- **Response timeout** cancels the browser wait from 10 to 600 seconds; backend, proxy, and provider deadlines can be shorter.

Reasoning models can consume their output budget before producing a visible answer. Increase both relevant hard caps within approved budgets, not only the data-source ceiling. For example, a suitable local model may be tested with 8,192 output tokens, a 500-token soft answer target, and 300-second panel/backend deadlines. These values are examples, not guarantees or a separate reasoning-effort control.

Credentials belong in `secureJsonData`, never dashboard options, prompts, images, or arbitrary JSON query results. See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) and the [data-source configuration guide](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki/Configuration).
