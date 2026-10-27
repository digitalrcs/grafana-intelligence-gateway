# Security Considerations

Panel options are dashboard JSON, so the panel contains no credential or provider-URL fields. Credentials are accepted only by the required companion data source and stored in Grafana `secureJsonData`. Panel 1.1.0 requires companion 1.1.0 or later.

Dashboard values and labels may contain prompt injection. Models should be instructed to treat them as untrusted evidence. Grafana's Markdown renderer is used instead of raw HTML, and the plugin uses no `eval` or dynamic script injection.

In 1.1.0, dashboard captures and uploaded images are also untrusted evidence. A screenshot can disclose visible information from panels beyond the selected query source. Review each preview, obtain approval for the provider and data classification, and select **Analyze images** explicitly. Image submission is never automatic. Uploads are decoded and re-encoded from pixels to strip hidden EXIF/GPS metadata; visible secrets still require removal before upload.

Images exist only in memory and are not saved in dashboard JSON, local storage, or a server-side image library. Clearing local state does not recall data already sent to a provider or delete its retained copies. The companion rejects arbitrary remote image URLs and enforces image count, decoded bytes, pixels, encoded request size, and administrator-approved vision models.

Copilot Studio's Direct Line preview uses a secured channel, not the dashboard viewer's identity. It does not implement corporate SSO or interactive sign-in. Use only an approved assessment-only agent: the plugin cannot disable or police tools configured by the agent owner. See [Copilot Studio and Enterprise Authentication](Copilot-Studio-Notes).

Administrators remain responsible for provider terms, data retention/residency, personal data, outbound endpoints, key scope, quotas, and user access. The companion data source adds `secureJsonData`, provider/model policy, timeouts, payload caps, logging controls, redirect blocking, and server-side rate limits. Network egress policy and provider budgets remain important independent controls.

See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for installation, provisioning, enforced policies, and the reason a panel cannot directly read another data source's decrypted secrets.
