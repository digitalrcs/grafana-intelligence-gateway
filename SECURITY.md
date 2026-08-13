# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub Security Advisories for the DigitalRCS repository. Do not open a public issue containing credentials, exploitable dashboard content, or endpoint details.

## Credential storage

The required `digitalrcs-intelligencegateway-datasource` stores credentials in Grafana `secureJsonData`; only its Go backend receives decrypted values. The panel has no provider credential or endpoint fields and never adds authentication headers.

## Threat model

- Dashboard data, field labels, prompts, and model output are untrusted.
- Markdown is rendered with Grafana's sanitizer; the plugin does not use raw HTML, `eval`, or dynamic script loading.
- Administrators must control allowed AI endpoints, outbound network policy, data residency, provider retention, and prompt-injection risk.
- The companion backend fixes provider resource paths, validates provider policy, blocks redirects, bounds bodies and timeouts, enforces model/token limits, and sanitizes upstream errors. Network egress policy remains a recommended second SSRF boundary.
- Exported dashboards contain prompt text, data-source UIDs, and non-secret generation settings but no provider credentials.
