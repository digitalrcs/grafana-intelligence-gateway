# Grafana Intelligence Gateway

Grafana Intelligence Gateway is DigitalRCS's AI assessment panel for Grafana. It converts query DataFrames and dashboard time context into structured prompts and renders provider responses as theme-aware Markdown.

The required companion `digitalrcs-intelligencegateway-datasource` stores secrets in Grafana `secureJsonData` and enforces provider, model, token, timeout, payload, and rate policies server-side. The panel has no credential or direct provider transport fields.

![Grafana Intelligence Gateway assessment](images/panel-assessment.png)

Start with [Panel Setup and Configuration](Panel-Setup-and-Configuration). It covers the complete dashboard-data connection, provider setup, every panel option, realistic example values, and the first analysis. Then use the provider-specific and prompt guides as needed.

## Pages

- Installation
- Panel Setup and Configuration
- Configuration (AI Providers)
- Connecting Data from Other Panels
- Prompt Engineering Guide
- LM Studio Setup
- OpenAI Setup
- Development and Contributing
- Security Considerations
- Secure Backend and Secret Storage
- Grafana Compatibility and Certification
- Roadmap
