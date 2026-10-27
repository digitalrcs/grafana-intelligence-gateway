# OpenAI Setup

With panel and companion **1.1.0 or later**, configure an **Intelligence Gateway Secure AI** data source with provider `openai`, base URL `https://api.openai.com/v1`, an approved Chat Completions model, and the API key in `secureJsonData`. Then select that data source in the panel and securely load or enter an allowed model. The Grafana LLM app is not required for this direct adapter.

The panel sends the prompt and generation choices through Grafana's backend resource API. The key remains encrypted on the Grafana server. The companion applies the lower of the panel output cap and administrator ceiling and sanitizes upstream errors.

The adapter uses buffered Chat Completions with `max_tokens` and, when configured, `temperature`. Select a model that accepts those parameters. Newer reasoning models may require other parameter names or reject temperature; Responses-only models are not supported. Discovery does not guarantee compatibility. See [OpenAI's Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).

For images, select a compatible vision model, enable image analysis in the companion, and approve it in both model allow-lists. Review every capture or upload before **Analyze images**. Images-only use needs no query results; combined use separately connects **Queries → Dashboard** and enables **Include query data with images**. See [Image Analysis](Image-Analysis).

Reasoning can consume generated tokens before a visible answer. The hard cap is not an exact visible-answer length; the soft answer target is only a prompt instruction. Provider defaults do not bypass the administrator ceiling. Keep model, context, rate, and organization cost limits in force. See [OpenAI's token-counting guide](https://developers.openai.com/api/docs/guides/token-counting).

The panel contains no direct OpenAI or credential mode. See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for installation and provisioning.
