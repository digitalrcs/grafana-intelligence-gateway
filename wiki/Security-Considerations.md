# Security Considerations

Panel options are dashboard JSON, not secure secret storage. Masked fields remain retrievable. Do not save production credentials or export dashboards containing tokens.

Dashboard values and labels may contain prompt injection. Models should be instructed to treat them as untrusted evidence. Grafana's Markdown renderer is used instead of raw HTML, and the plugin uses no `eval` or dynamic script injection.

Administrators remain responsible for provider terms, data retention/residency, personal data, outbound endpoints, CORS, key scope, quotas, and user access. The planned backend should add `secureJsonData`, endpoint allow-listing, timeouts, payload caps, logging controls, and server-side rate limits.
