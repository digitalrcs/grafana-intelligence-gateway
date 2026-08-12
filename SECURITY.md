# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub Security Advisories for the DigitalRCS repository. Do not open a public issue containing credentials, exploitable dashboard content, or endpoint details.

## Credential storage

Production deployments should install `digitalrcs-intelligencegateway-datasource` and select that instance in the panel. Grafana encrypts its `secureJsonData`, and only the companion Go backend receives the decrypted value. Direct API-key and token fields remain for development but are stored in dashboard JSON despite being masked in the editor.

## Threat model

- Dashboard data, field labels, prompts, and model output are untrusted.
- Markdown is rendered with Grafana's sanitizer; the plugin does not use raw HTML, `eval`, or dynamic script loading.
- Administrators must control allowed AI endpoints, outbound network policy, data residency, provider retention, and prompt-injection risk.
- The companion backend fixes provider resource paths, validates provider policy, blocks redirects, bounds bodies and timeouts, enforces model/token limits, and sanitizes upstream errors. Network egress policy remains a recommended second SSRF boundary.
- Exported dashboards must be inspected and scrubbed before sharing.
