# Grafana Intelligence Gateway 1.0.1

This maintenance release improves the catalog description and setup guidance for analyzing panel query data with local or hosted AI models.

- Rewrites the catalog README around practical use cases, the two data-source connections, and a concise setup guide.
- Adds the official DigitalRCS logo and a real LM Studio assessment of synthetic panel data; replaces outdated catalog screenshots.
- Updates the catalog description and documentation link.
- Includes the synthetic traffic-shift walkthrough and clear labeling of the deterministic mock provider.
- Updates Grafana E2E tooling for Grafana 13.2, patches affected transitive dependencies, and uses Node.js 22 for release builds.

The analysis behavior and secure companion data-source requirement are unchanged. Requires Grafana 11.6 or later. Restart Grafana after installing the updated plugin metadata.

## Grafana submission

- [Packaged plugin ZIP](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.0.1/digitalrcs-intelligencegateway-panel-1.0.1.zip)
- [SHA1 checksum file](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.0.1/digitalrcs-intelligencegateway-panel-1.0.1.zip.sha1)
- [Tagged source code](https://github.com/digitalrcs/grafana-intelligence-gateway/tree/v1.0.1)
- [Setup and testing guidance](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/v1.0.1/docs/GRAFANA_SUBMISSION.md)

The archive has GitHub build provenance. It is unsigned for Grafana review; an attestation is not a Grafana plugin signature or catalog approval.
