# Security Considerations

Panel options are dashboard JSON, not secure secret storage. Masked fields remain retrievable. Do not save production credentials or export dashboards containing tokens.

Dashboard values and labels may contain prompt injection. Models should be instructed to treat them as untrusted evidence. Grafana's Markdown renderer is used instead of raw HTML, and the plugin uses no `eval` or dynamic script injection.

Administrators remain responsible for provider terms, data retention/residency, personal data, outbound endpoints, key scope, quotas, and user access. The companion data source adds `secureJsonData`, provider/model policy, timeouts, payload caps, logging controls, redirect blocking, and server-side rate limits. Network egress policy and provider budgets remain important independent controls.

See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for installation, provisioning, enforced policies, and the reason a panel cannot directly read another data source's decrypted secrets.
