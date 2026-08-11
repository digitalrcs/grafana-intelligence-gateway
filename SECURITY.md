# Security policy

## Reporting

Please report suspected vulnerabilities privately through GitHub Security Advisories for the DigitalRCS repository. Do not open a public issue containing credentials, exploitable dashboard content, or endpoint details.

## Credential storage

Version 1 is frontend-only. Values entered into API key and token options are masked in the editor but stored in dashboard JSON. They are not protected by Grafana `secureJsonData`. Production deployments should use a backend/data-source proxy and restricted secrets.

## Threat model

- Dashboard data, field labels, prompts, and model output are untrusted.
- Markdown is rendered with Grafana's sanitizer; the plugin does not use raw HTML, `eval`, or dynamic script loading.
- Administrators must control allowed AI endpoints, outbound network policy, data residency, provider retention, and prompt-injection risk.
- Exported dashboards must be inspected and scrubbed before sharing.
