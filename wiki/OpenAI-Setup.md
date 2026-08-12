# OpenAI Setup

Select **OpenAI**, keep the base URL `https://api.openai.com/v1`, and enter an available chat-completions model. Limit output tokens and begin with a low temperature for repeatable operational assessments.

The frontend-only release cannot secure an OpenAI key. Use only a restricted development key. Production deployments should proxy OpenAI through a Grafana backend that reads `secureJsonData`, enforces an endpoint allow-list, and applies budgets and audit policy.

See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for the companion data-source contract. A generic JSON data-source result cannot safely provide the key because the result is visible in the browser.
