# Grafana Intelligence Gateway 1.1.0

Version 1.1.0 adds reviewed image evidence to the Intelligence Gateway panel and expands provider choices through the required secure companion. Existing data-only assessments remain available.

## Requirements

- Grafana 11.6 or later.
- `digitalrcs-intelligencegateway-datasource` **1.1.0 or later**, installed before the panel. Companion 1.0.1 does not implement the image/provider contract required by this release.
- A configured Secure AI data-source instance and an administrator-approved model or agent alias.
- For images, an enabled backend vision policy and a genuinely vision-capable model in both the ordinary and vision allow-lists.
- The Grafana LLM app is optional. The documented app 1.2.0 integration requires Grafana 13 or later. The Current View Exporter plugin is not required.

## What is new

- **Three evidence modes:** analyze query data only, images only without query results, or query data and images together.
- **Three image inputs:** capture the rendered dashboard, capture selected panels, or attach multiple PNG/JPEG files.
- **Review before sending:** image previews, individual removal, and remove-all controls. **Use images** stages attachments; only **Analyze images** submits them.
- **Clear and cancellation:** **Clear analysis** cancels the active request and removes the answer, errors, and pending images without changing measurements. Successful image assessments release their attachments; capture again for the next image request.
- **Secure provider choices:** OpenAI, LM Studio, Open WebUI, custom OpenAI-compatible Chat Completions, the optional Grafana LLM app, and Copilot Studio Direct Line **preview**, configured in the companion backend.
- **Capture robustness:** panel headings are used instead of full panel body text, generated image names are bounded safely, and selection labels stay beside their checkboxes and wrap on narrow screens.
- **Operational guidance:** clearer distinctions among output-budget exhaustion, reasoning-only responses, timeout, image-policy rejection, and provider incompatibility, with setup examples and troubleshooting documentation.
- **Unambiguous demo setup:** the supplied **DEMO ONLY - Mock AI (no inference)** connection is labeled as a fixed receipt, not a model. A current AI connection notice and two-phase quickstart distinguish the mock from a separately configured real provider and distinguish query evidence from the AI connection.

## Choose the workflow

| Mode            | Setup                                                                                         | Action                                  |
| --------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| Data only       | Connect query results; leave images unattached.                                               | **Analyze**                             |
| Images only     | No query results required. Turn **Include query data with images** off and review the images. | **Use images**, then **Analyze images** |
| Data and images | Connect query results; leave **Include query data with images** on and review the images.     | **Use images**, then **Analyze images** |

**AI provider → Secure AI data source** selects the model connection in every mode. **Queries → Dashboard → Source panel** separately supplies another panel's measurements. Capturing a panel sends its appearance, not its underlying DataFrames.

## Security and compatibility boundaries

Credentials remain in the companion's Grafana `secureJsonData`. Images remain in browser memory until explicitly submitted and are not saved in dashboard JSON. Automatic analysis is data-only and pauses while image input is open or staged. Clear/remove controls cannot retract already-submitted provider data.

The backend validates image content, model policy, payload limits, deadlines, and allowed routes. PNG/JPEG limits are 8 images, 4 MiB decoded file size each, 12 MiB combined, 4,096 pixels per side, 16 million pixels per image, and 32 million combined. Image-request JSON is capped at 18 MiB; non-image content remains subject to the 1 MiB text limit. Providers may impose lower limits.

Dashboard capture uses rendered content. It does not deliberately refresh queries, but scrolling can cause Grafana to load previously unseen panels. Collapsed, inaccessible, cross-origin, or failed panels may be missing. Inspect every preview; uploaded metadata removal is not redaction of sensitive pixels.

Chat Completions adapters send `max_tokens` and, when configured, `temperature`; select models that accept those parameters. Responses-only models and separate reasoning-effort controls are not supported. Reasoning can consume the output cap before a visible answer. The lower panel/admin cap applies, provider defaults are not unlimited, and the soft answer target is approximate. Proxy/provider deadlines can be shorter than either DigitalRCS timeout; Grafana LLM app 1.2.0 has a two-minute upstream timeout.

Copilot Studio is a bounded **Direct Line preview**, with secured channel credentials, isolated conversations, correlated response polling, and multipart image uploads. It is **not** corporate SSO, delegated Entra, on-behalf-of, or app-only Direct-to-Engine integration. It requires a compatible published-agent completion contract and tenant approval. The agent owns model, temperature, token, and tool policy. Mock/contract coverage is not live enterprise-tenant validation or certification.

## Upgrade notes

1. Back up Grafana configuration and review both repositories' release instructions.
2. Verify the exact companion and panel archives, checksums, signature status, and provenance. Install the companion first, then the panel.
3. Restart Grafana and fully reload the browser page. A dashboard data refresh does not reload plugin JavaScript. Do not overwrite a published release with rebuilt files under the same version.
4. Retain existing data-only settings. Image analysis is optional and disabled by default in the backend; enable it only after approving the model and data classification.
5. Validate the chosen provider with approved synthetic input. Model discovery and mock receipts prove neither answer quality nor visual understanding.

For persistent stale controls in a local preview, see [cache guidance](DEVELOPMENT.md#rebuilt-code-still-looks-unchanged). Do not weaken production plugin-signature policy or clear unrelated browser credentials to solve caching.

## Documentation and release evidence

- [Complete setup guide](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration)
- [Image-analysis guide](IMAGE_ANALYSIS.md)
- [Provider configuration](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Configuration-AI-Providers)
- [Copilot Studio boundaries](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Copilot-Studio-Notes)
- [Release and Grafana submission evidence](GRAFANA_SUBMISSION.md)

These notes describe the 1.1.0 changes; they do not by themselves establish publication, a successful release pipeline, signing, provenance verification, or Grafana catalog approval. Use the exact final release artifacts and recorded validation results for those determinations. A build-provenance attestation proves build origin, not a Grafana signature or certification.
