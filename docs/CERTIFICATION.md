# Grafana compatibility and certification readiness

The maintained certification checklist, submission values, testing guidance, and release procedure are published in the [Grafana Compatibility and Certification Wiki page](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Grafana-Compatibility-and-Certification).

Repository evidence:

- `src/plugin.json`: catalog metadata, links, logos, compatibility declaration, and screenshots.
- `src/plugin.json`: declares `digitalrcs-intelligencegateway-datasource` as a required external plugin.
- `src/img/`: catalog image assets packaged with the plugin.
- `provisioning/`: sample dashboard and TestData data source for reviewers.
- `testdata/mock-provider/`: deterministic credential-free AI provider used by Docker and E2E review.
- `.github/workflows/ci.yml`: build, validation, and multi-version E2E testing.
- `.github/workflows/release.yml`: tagged release packaging, required signing credential and manifest checks, and provenance attestation.
- `README.md`, `CHANGELOG.md`, `LICENSE`, `SECURITY.md`: required user and legal documentation.

Grafana's review response permits signing both plugins. Configure the repository secret `GRAFANA_ACCESS_POLICY_TOKEN`, verify both signed release archives, and update the existing submissions through Grafana's Plugins Admin page, coordinating the companion data source before the dependent panel. The actual manifests establish the signature levels; signing and repository checks do not themselves establish catalog publication or certification.

For the release-specific URLs, checksums, provenance verification commands, and text to paste into the Grafana submission form, see [GRAFANA_SUBMISSION.md](GRAFANA_SUBMISSION.md). Do not submit a branch build or GitHub source-code archive; submit the ZIP produced by the tagged Release workflow.

The companion secure data source is distributed and reviewed as its own plugin. Its catalog evidence and deterministic reviewer instructions are maintained in the [data-source certification checklist](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/blob/main/CERTIFICATION.md) and [data-source wiki](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki).
