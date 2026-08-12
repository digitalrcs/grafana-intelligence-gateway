# Changelog

## Unreleased

- Changed Maximum output tokens to a slider supporting up to 1,048,576 tokens.
- Added a provider/model-default mode that omits the panel's `max_tokens` request field.
- Added a separate soft prompt instruction for the requested visible-answer length.
- Documented the secure companion data-source architecture and `jsonData`/`secureJsonData` provisioning contract.

## Unreleased

- Added a Clear analysis control that removes generated output and errors and cancels an in-progress request without changing panel configuration or source data.

## 1.0.0 - 2026-08-11

- Initial release of Grafana Intelligence Gateway.
- Added OpenAI, LM Studio, custom OpenAI-compatible, and experimental Copilot Studio provider modes.
- Added DataFrame serialization, prompt templates, skills context, prompt preview, buffered and streaming responses.
- Added dashboard-data-source guidance, themed Markdown rendering, manual and debounced automatic analysis.
- Added CI, signing, release, provisioning, test, security, and wiki documentation.

## 1.0.0 (Unreleased)

Initial release.
