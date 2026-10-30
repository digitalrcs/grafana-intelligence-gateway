# Analyze dashboard images

Image analysis adds visual context to an Intelligence Gateway assessment. Capture the dashboard, choose individual panels, or attach PNG/JPEG images, review the previews, and explicitly send them to a vision-capable model through the required secure data source.

This guide covers panel **1.1.0**, which requires companion data source **1.1.0 or later**. Version 1.0.1 predates image support. Check both release notes before upgrading, install the companion first, and restart Grafana after installation. Copilot Studio has a bounded **Direct Line preview adapter**, not an SSO integration or a tenant-certified connection; see [enterprise integration notes](../wiki/Copilot-Studio-Notes.md). The Current View Exporter plugin does not need to be installed.

## Choose the evidence

| Mode                | Queries                                                   | Image setting and action                                                                                       | Sent to the provider                                                 |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Data only**       | Use this panel's queries or **Dashboard → Source panel**. | Leave images unattached; select **Analyze**.                                                                   | Prompt and bounded query context.                                    |
| **Images only**     | No query results or Dashboard source are required.        | Turn **Include query data with images** off, prepare previews, choose **Use images**, then **Analyze images**. | Prompt, image labels/metadata, and the reviewed images.              |
| **Data and images** | Connect the query results needed for precise values.      | Leave **Include query data with images** on; prepare previews and explicitly select **Analyze images**.        | Prompt, this panel's bounded query context, and the reviewed images. |

Every mode requires **AI provider → Secure AI data source**. That is the model connection, not the panel's **Queries** data source. Choosing the secure AI instance does not automatically import other panels' measurements. Images-only assessment works even when **When no data arrives** is set to **Block**, provided images are attached.

## Before you start

- Configure `digitalrcs-intelligencegateway-datasource` and select it in the panel's secure AI data-source setting.
- Ask the data-source administrator to turn on **Enable image analysis** under **Image analysis policy** (`enableVision`, off by default), select an approved vision-capable model, include it in the normal model allow-list, and add it to **Allowed vision models** (`allowedVisionModels`). The vision list must be a subset of the allowed models. The backend rejects an enabled configuration with an empty vision allow-list. Model discovery alone does not establish that a model can read images.
- Use synthetic or approved non-sensitive images first. A screenshot may contain names, identifiers, internal addresses, queries, or customer information that was not included in the panel's query-data selection.
- Confirm that the provider, model, processing location, and retention policy are approved for the data classification. Permission to view a dashboard is not necessarily permission to send it to an AI service.

## Capture, review, and send

1. Open the dashboard containing the Intelligence Gateway panel. Set the intended time range and filters, and let the source panels finish rendering.
2. Select **Images** to open **Image inputs**.
3. Choose an input method:

   | Control                     | What it adds                                                                                                                                                                    |
   | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | **Capture dashboard**       | Images of the dashboard panels available to the capture process. Intelligence Gateway panels are excluded by default to avoid feeding previous assessments back into the model. |
   | **Capture selected panels** | Images of the panels you select, for a focused assessment and smaller request.                                                                                                  |
   | **Add images**              | One or more local PNG or JPEG files, such as an approved diagram or earlier dashboard capture.                                                                                  |

4. Inspect every preview. Remove unwanted images, check that chart labels are legible, and read any capture warnings. A preview is the evidence of what will be sent; a hidden or failed panel must not be assumed to be present.
5. Select **Use images** to close the preview. This does **not** send them.
6. Set the assessment prompt and select **Analyze images**. Only this explicit action submits the prepared images with the request.
7. Review the response against the original charts. Models can misread axes, units, small text, legends, or missing data. Treat numerical estimates from pixels as estimates, not as a substitute for the underlying measurements.

**Clear analysis** cancels an active request and removes the displayed assessment, errors, and all pending images without changing source measurements. Use an image's **Remove** button or **Remove all images** to discard staged images without sending them. After a successful image assessment, attachments are released; capture or attach again for a subsequent image request. Auto-analysis pauses while the image dialog is open or attachments are present, and never submits images automatically.

The existing prompt and query-data settings continue to apply. Capturing another panel adds its rendered image; it does not fetch that panel's underlying DataFrames. Continue using Grafana's **Dashboard** data source when the assessment also needs another panel's query data.

## What a dashboard capture means

Capture reuses the current-view exporter's browser-rendered capture approach. It is not a Grafana public snapshot, a new dashboard render on another server, or a print job. It does not deliberately refresh the dashboard, change the time range, or rerun data-source queries.

A full-dashboard capture may scroll to panels below the fold. Grafana may perform its normal initial queries when lazy panels first become visible; third-party panels may also have their own loading behavior. There is no universal zero-query guarantee. Prefer selected, already-rendered panels when even initial loading is unacceptable. Collapsed rows, inaccessible content, cross-origin embedded content, and panels that fail to render may be absent or incomplete. Inspect the capture warnings and previews before sending.

Large captures may need to be split or reduced to fit the image limits. Smaller groups of panels usually preserve more readable labels than one very tall image.

Uploaded images are decoded and rasterized before submission to strip embedded metadata such as EXIF/GPS fields. JPEGs can be re-encoded. Review the resulting preview: removing metadata does not redact names, addresses, or other sensitive information visible in the pixels.

## Limits

These are application safety limits, not promises about a provider's model context window. A provider can impose lower limits.

| Limit                                                | Maximum      |
| ---------------------------------------------------- | ------------ |
| Images in one request                                | 8            |
| Decoded file size per image                          | 4 MiB        |
| Combined decoded file size                           | 12 MiB       |
| Width or height per image                            | 4,096 pixels |
| Pixels per image                                     | 16,000,000   |
| Combined pixels                                      | 32,000,000   |
| Image-request JSON body, including base64 and prompt | 18 MiB       |
| Accepted input formats                               | PNG and JPEG |

The backend checks image type, decoded content, size, dimensions, and the administrator's vision-model allow-list. Input is sent as validated inline image data, not an arbitrary remote image URL or provider file identifier. Base64 transport is larger than the decoded image; reverse proxies and Grafana request limits must also accommodate the request.

Text-only request bodies are limited to 1 MiB. For image requests, the serialized text, messages, model, and other non-image settings must still fit within 1 MiB; images do not provide a way to bypass the text limit. The 18 MiB image-body ceiling applies to both the incoming request and the rebuilt provider request.

Image tokens contribute to the model's input/context budget. **Maximum output tokens** limits generated output where supported; it does not make image input unlimited. If a request is rejected, use fewer images, crop or resize them locally, or select a suitably configured vision model. Do not bypass the backend's limits.

## Provider setup

Configure providers in the **secure companion data source**, not in panel options. `jsonData` holds non-secret settings; API credentials belong in `secureJsonData`. Never put an API key, Grafana token, or SSO token in a dashboard, a prompt, an image, or a plain JSON data source.

| Provider                          | Example base URL                                                           | Model selection                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| OpenAI (`openai`)                 | `https://api.openai.com/v1`                                                | An approved vision-capable Chat Completions model accepting the adapter's generation parameters |
| LM Studio (`lmstudio`)            | `https://lmstudio.example.com/v1`                                          | Exact identifier of a loaded vision-capable model                                               |
| Custom (`custom`)                 | `https://ai.example.com/v1`                                                | An approved model on a compatible Chat Completions endpoint supporting inline image parts       |
| Open WebUI (`openwebui`)          | `https://openwebui.example.com` or `https://openwebui.example.com/api`     | Exact model identifier available to the configured API credential                               |
| Grafana LLM app (`grafana-llm`)   | `https://grafana.example.com/api/plugins/grafana-llm-app/resources/llm/v1` | `base` or `large`, mapped to a vision-capable model by the Grafana LLM app administrator        |
| Copilot Studio (`copilot-studio`) | `https://directline.botframework.com/v3/directline`                        | A local alias for the published agent, not a selectable foundation model                        |

For an instance served under a subpath, include it in the Grafana base URL, for example `https://grafana.example.com/grafana/api/plugins/grafana-llm-app/resources/llm/v1`. Use the server-reachable endpoint, not a browser-only hostname. HTTPS and the companion's network policy apply; do not turn off TLS validation to make a connection work.

### OpenAI and custom Chat Completions endpoints

The adapter uses buffered Chat Completions with `max_tokens` and, when configured, `temperature`. Use a model that accepts those parameters and structured image parts. A provider's model list is not a compatibility guarantee: newer reasoning models can require different parameter names or disallow temperature, and Responses-only models are not supported by this adapter. A custom provider must also support its documented `/models` and `/chat/completions` routes. See the [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).

### LM Studio

LM Studio documents image input on its OpenAI-compatible Chat Completions endpoint. Load a vision model, enable its server, and use its exact model ID in the default model, allowed models, and vision allow-list. Text-only models are not made vision-capable by adding their names to a list. A trusted local development HTTP setup requires the companion's explicit HTTP option and an address allowed by its network policy. See [LM Studio compatibility documentation](https://lmstudio.ai/docs/developer/openai-compat).

### Open WebUI

Use an administrator-approved API credential in a secure credential field. The adapter normalizes the instance root to `/api`, uses model discovery, and sends Chat Completions requests through Open WebUI. The selected underlying model and any configured filters must preserve image content. This integration does not request Open WebUI tool IDs or enable autonomous actions. See [Open WebUI API documentation](https://docs.openwebui.com/reference/api-endpoints/).

Use a maintained, security-patched deployment. In particular, image handling in Open WebUI versions through 0.9.5 is affected by [GHSA-wch8-mhj5-9frg](https://github.com/open-webui/open-webui/security/advisories/GHSA-wch8-mhj5-9frg); 0.9.6 contains that fix. This minimum fix is not a claim that an older release is otherwise fully patched.

### Grafana LLM app

Grafana LLM is an **app plugin**, `grafana-llm-app`, not a query data source. The DigitalRCS companion provides the provider adapter. Install and enable the app, configure an approved upstream vision model there, then select **Grafana LLM app** in the DigitalRCS data source. The inspected Grafana LLM app release 1.2.0 requires Grafana 13 or later. Other provider choices do not by themselves require installing this app. See the [Grafana LLM catalog entry](https://grafana.com/grafana/plugins/grafana-llm-app/).

For the backend connection, a Grafana administrator supplies a dedicated **Grafana service-account token** in `secureJsonData.bearerToken`. This token is not an OpenAI key, a Grafana Cloud access-policy token, or the user's SSO browser session. The service account must belong to the target Grafana organization. Requests run as that service account; they do not impersonate the dashboard viewer.

Where Grafana Enterprise/Cloud custom RBAC roles are available, the narrowly scoped resource permission is:

```json
{
  "action": "plugins.app:access",
  "scope": "plugins:id:grafana-llm-app"
}
```

Merely sending supplied prompts/images to this app does not require plugin installation, plugin-settings write, dashboard-write, or data-source-query permissions for that service account. An administrator still has to install/configure the app separately. Review inherited basic-role permissions as well; a Viewer role in Grafana OSS has broader built-in access and is not equivalent to the scoped custom role. Scope permissions to the app, rotate/expire the token under local policy, and restrict who can use the DigitalRCS data source. See [Grafana RBAC actions and scopes](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/custom-role-actions-scopes/) and [service accounts](https://grafana.com/docs/grafana/latest/administration/service-accounts/).

The app's `base`/`large` names are aliases. In the DigitalRCS vision allow-list, enter the alias that maps to the approved vision model, for example `large`. Keep that mapping under administrator control. The inspected app's upstream client has a two-minute timeout; increasing the DigitalRCS timeout cannot override it. These behaviors are visible in the released [model mapping](https://github.com/grafana/grafana-llm-app/blob/v1.2.0/packages/grafana-llm-app/pkg/plugin/llm_provider.go) and [provider client](https://github.com/grafana/grafana-llm-app/blob/v1.2.0/packages/grafana-llm-app/pkg/plugin/openai_provider.go).

Grafana's frontend `@grafana/llm` message type is text-only in that release. The backend adapter sends structured text/image parts to the app resource endpoint instead. Its underlying request decoder supports those parts, but actual image interpretation still depends on the configured model and provider. See the [released resource handler](https://github.com/grafana/grafana-llm-app/blob/v1.2.0/packages/grafana-llm-app/pkg/plugin/resources.go) and [multipart message decoder](https://github.com/sashabaranov/go-openai/blob/v1.43.0/chat.go).

### Copilot Studio preview

Use only an administrator-approved, published agent with secured Direct Line channel access. The channel secret belongs in `secureJsonData.directLineSecret`; it is not an Entra user token and cannot complete a corporate SSO sign-in. Microsoft documents secret-based service access separately from agent user authentication in [web channel security](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-web-security). Do not disable agent authentication to make this adapter work.

Each assessment exchanges the secret for a short-lived conversation token, starts a new isolated conversation, sends the prompt and validated images, and polls for correlated bot replies within the configured timeout and token lifetime. Images are uploaded as actual PNG/JPEG bytes in multipart form data, not public URLs. Redirects, returned stream URLs, response attachment URLs, and interactive sign-in actions are never followed. **Save & test** exchanges and discards a token without sending a prompt or starting an agent conversation; it does not prove that the agent permits the requested assessment.

The agent owns its model, instructions, temperature, output-token policy, and tools. The model field is a local agent alias; the panel's temperature and maximum-output-token controls are not enforced by Direct Line. Role-labeled prompt messages become plain request context, not privileged system instructions. Configure an assessment-only agent and approve its behavior before use.

The preview adapter requires bot replies with the submitted activity's `replyToId` and an explicit readiness hint (`acceptingInput` or `expectingInput`), or a correlated `endOfConversation`. It collects text until that signal and fails rather than presenting an early progress message as a completed answer. Microsoft notes that Direct Line has no universal final-response marker; this deliberately narrower compatibility contract must be tested against the published agent. OAuth/sign-in cards report unsupported interactive authentication; absent completion signals, expired tokens, empty/non-text output, and timeouts are separate failure cases. See [Microsoft's response-correlation guidance](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/conversational-agents-performance-testing-direct-line).

The adapter has deterministic protocol/mock coverage, not a live enterprise-tenant validation or certification. File uploads and the approved channel must be enabled on the agent. Follow [Copilot Studio Notes](../wiki/Copilot-Studio-Notes.md) for exact setup, supported regions, limitations, and delegated-auth options still awaiting implementation and tenant approval.

## Reasoning, answer length, and deadlines

For Chat Completions adapters, the hard output request is the smaller of the panel's **Maximum output tokens** and the data source's administrator ceiling. Selecting **Provider/model default output limit** omits only the panel cap; it does not remove the administrator limit or make the request unlimited. The slider's maximum is not a promise that the selected model accepts that many tokens.

On reasoning models, generated tokens can be consumed before any visible final answer appears. Raising only the backend ceiling will not change a smaller panel request. A bounded local-model example is an 8,192-token panel cap and administrator ceiling, a soft visible-answer target of 500 tokens, and 300-second panel/backend deadlines. Tune those values to the actual model; they are not universal recommendations. **Requested answer max tokens (soft)** is an approximate prompt instruction, not a second hard cap. The plugin does not expose a separate reasoning-effort control. See [OpenAI's token-counting guidance](https://developers.openai.com/api/docs/guides/token-counting) for the distinction between visible and total output.

Timeout and output-budget failures are different. Use the most restrictive applicable panel, backend, reverse-proxy, and upstream deadline when planning a request; increasing only one cannot override another. The Grafana LLM app and Copilot limitations above still apply. A reasoning-only error is not evidence that the image was missing. Conversely, a model that returns text successfully has not necessarily understood the image.

## Privacy and validation boundaries

Pending images live in browser memory and are not saved in dashboard JSON or browser persistent storage. Capture, upload selection, preview, and **Use images** do not submit them to the AI provider. **Analyze images** sends the images, prompt, and configured query context through the secure companion. Once sent, the provider's retention, logging, and deletion policies apply; **Clear analysis** cannot retract a submitted request or delete upstream copies.

Do not include secrets in screenshots. Do not authorize a production rollout based only on a successful connection test. Validate with synthetic, non-sensitive images that have known visual facts, then verify the model actually describes those facts. Deterministic/mock and contract tests prove payload handling and controls, not visual understanding. A text-model completion or a successful model-list request is not evidence of vision support.

Capture errors, model-policy rejections, unsupported image/model responses, timeout, and output truncation should be investigated separately. Record the provider/app/model versions, image count and dimensions, configured limits, and sanitized error—not image bytes, credentials, or confidential prompt content. Images and model output are untrusted content; an assessment is not authorization to execute instructions found inside an image.

For a managed enterprise deployment, follow [Copilot Studio and enterprise authentication notes](../wiki/Copilot-Studio-Notes.md) before considering Microsoft agent integration. No tenant-specific permission, data-sharing approval, or Copilot connectivity is implied by this feature.

## Grafana 12.4 dashboard capture

Use panel 1.1.2 or later for tall dashboards on Grafana 12.4.0. This fixes document scrolling so lower panels can be visited. A stalled scroll reports an error instead of producing an incomplete image. Existing size limits and partial-capture warnings still apply. Companion 1.1.0 or later remains required; updating Current View Exporter alone does not update this panel.
