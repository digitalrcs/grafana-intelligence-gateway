# Grafana compatibility and certification readiness

The maintained certification checklist, submission values, testing guidance, and release procedure are published in the [Grafana Compatibility and Certification Wiki page](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Grafana-Compatibility-and-Certification).

Repository evidence:

- `src/plugin.json`: catalog metadata, links, logos, compatibility declaration, and screenshots.
- `src/plugin.json`: declares `digitalrcs-intelligencegateway-datasource` as a required external plugin.
- `src/img/`: catalog image assets packaged with the plugin.
- `provisioning/`: sample dashboard and TestData data source for reviewers.
- `testdata/mock-provider/`: deterministic credential-free AI provider used by Docker and E2E review.
- `.github/workflows/ci.yml`: build, validation, and multi-version E2E testing.
- `.github/workflows/release.yml`: tagged release packaging, optional public signing, and provenance attestation.
- `README.md`, `CHANGELOG.md`, `LICENSE`, `SECURITY.md`: required user and legal documentation.

External steps remain: the companion data source must be accepted/published first, Grafana must assign the appropriate public signature level, the repository secret `GRAFANA_ACCESS_POLICY_TOKEN` must then be configured, and a tagged panel release must be submitted through Grafana's Plugins Admin page. Grafana approval is always a manual decision and cannot be guaranteed by repository checks.

The companion secure data source is distributed and reviewed as its own plugin. Its catalog evidence and deterministic reviewer instructions are maintained in the [data-source certification checklist](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/blob/main/CERTIFICATION.md) and [data-source wiki](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki).
