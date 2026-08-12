# Changelog

## Unreleased

- Made `digitalrcs-intelligencegateway-datasource` a required external plugin dependency.
- Removed direct browser provider, API-key, bearer-token, and Copilot transport paths from the panel.
- Added a credential-free deterministic provider to the provisioned Docker review environment.
- Added end-to-end coverage for completed analysis through the secure backend.
- Documented the companion data source's administrator-controlled insecure HTTP override.

- Added selection and runtime use of the `digitalrcs-intelligencegateway-datasource` secure companion.
- Added secure model discovery and buffered analysis through Grafana backend resources.
- Added an integrated Docker environment that mounts and provisions both plugins using `OPENAI_API_KEY` from the server environment.
- Changed Maximum output tokens to a slider supporting up to 1,048,576 tokens.
- Added a provider/model-default mode that omits the panel's `max_tokens` request field.
- Added a separate soft prompt instruction for the requested visible-answer length.
- Documented the secure companion data-source architecture and `jsonData`/`secureJsonData` provisioning contract.

- Added a Clear analysis control that removes generated output and errors and cancels an in-progress request without changing panel configuration or source data.

## 1.0.0 - 2026-08-11

- Initial release of Grafana Intelligence Gateway.
- Added OpenAI, LM Studio, custom OpenAI-compatible, and experimental Copilot Studio provider modes.
- Added DataFrame serialization, prompt templates, skills context, prompt preview, buffered and streaming responses.
- Added dashboard-data-source guidance, themed Markdown rendering, manual and debounced automatic analysis.
- Added CI, signing, release, provisioning, test, security, and wiki documentation.
