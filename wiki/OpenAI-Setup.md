# OpenAI Setup

For production, configure an **Intelligence Gateway Secure AI** data source with provider `openai`, base URL `https://api.openai.com/v1`, an allowed chat-completions model, and the API key in `secureJsonData`. Then select that data source in the panel and securely load or enter an allowed model.

The panel sends the prompt and generation choices through Grafana's backend resource API. The key remains encrypted on the Grafana server. The companion applies the lower of the panel output cap and administrator ceiling and sanitizes upstream errors.

The panel contains no direct OpenAI or credential mode. See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for installation and provisioning.
