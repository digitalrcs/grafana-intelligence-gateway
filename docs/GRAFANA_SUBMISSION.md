# Grafana submission reference — reviewed 1.1.0 baseline

Use **Submit Update** on the existing plugin submission. Submit the secure data source first, then the panel; they are separate packages. The historical fields below target the unsigned 1.1.0 release, not the 1.1.1 public-signing release. For 1.1.1, use its exact published archive, source tag, and newly verified checksum; do not reuse the 1.1.0 values. Preparing these fields does not update the portal or grant approval.

| Field                 | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin ID             | `digitalrcs-intelligencegateway-panel`                                                                                                  |
| Version               | `1.1.0`                                                                                                                                 |
| Type                  | Panel                                                                                                                                   |
| OS & Architecture     | Single (frontend-only archive)                                                                                                          |
| ZIP URL               | https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.1.0/digitalrcs-intelligencegateway-panel-1.1.0.zip      |
| Source URL            | https://github.com/digitalrcs/grafana-intelligence-gateway/tree/v1.1.0                                                                  |
| SHA1 asset            | https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.1.0/digitalrcs-intelligencegateway-panel-1.1.0.zip.sha1 |
| Provisioning provided | Yes                                                                                                                                     |
| Minimum Grafana       | 11.6.0; optional Grafana LLM app requires Grafana 13+                                                                                   |
| License               | Apache-2.0                                                                                                                              |

Copy the **hash value** from the SHA1 asset into Grafana's SHA1 field, not the checksum-file URL. Do not substitute GitHub's automatically generated source-code ZIP for the packaged plugin.

## Testing guidance

Install both Intelligence Gateway 1.1.0 packages side by side. Follow the [panel reviewer walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough) and [data-source test guide](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki/Testing-and-Review). The provisioned Docker environment uses a deterministic mock and synthetic traffic data without external credentials. Its labeled receipt verifies transport, not AI understanding.

Phase 1 checks the mock connection only. Before Phase 2, use an existing approved provider or coordinate suitable limited test API access privately with DigitalRCS through the existing Grafana review conversation. [Grafana may require test API access for more complex plugins](https://grafana.com/developers/plugin-tools/publish-a-plugin/provide-test-environment). No hosted service or credentials are currently bundled or promised; any access must be arranged and confirmed separately. Never publish credentials or private endpoint details. Completing the mock check does not complete real-provider review.

Verify all three input modes:

1. **Data only:** configure the panel's Queries using Grafana's Dashboard data source to reuse the source chart; select **Analyze** without attaching images.
2. **Images only:** enable vision on the secure AI data source and approve the model. In the panel, turn off **Include query data with images**; no source panel query is required. Capture or upload, review previews, then select **Analyze images**.
3. **Images and data:** enable **Include query data with images**, configure a source query, then explicitly send the reviewed images and bounded query results.

Confirm previews do not send inference requests, the Intelligence panels are excluded from capture, names wrap beside their checkboxes, Clear analysis removes queued images/results, and invalid images/model policies fail safely. Use a separate real provider with synthetic input to assess image understanding. Live validation of every provider and Microsoft tenant is not implied. Copilot Studio is a bounded Direct Line preview; delegated enterprise SSO is not implemented.

## Verify the exact release

```bash
gh release download v1.1.0 --repo digitalrcs/grafana-intelligence-gateway \
  --pattern 'digitalrcs-intelligencegateway-panel-1.1.0.zip*'
sha1sum digitalrcs-intelligencegateway-panel-1.1.0.zip
sha256sum digitalrcs-intelligencegateway-panel-1.1.0.zip
gh attestation verify digitalrcs-intelligencegateway-panel-1.1.0.zip \
  --repo digitalrcs/grafana-intelligence-gateway \
  --signer-workflow digitalrcs/grafana-intelligence-gateway/.github/workflows/release.yml \
  --source-ref refs/tags/v1.1.0
```

The Release workflow verifies the downloaded artifact, source-tag provenance, checksum, and full Grafana Plugin Validator output. Its evidence artifact records results and the validator image digest. Check those results rather than assuming the workflow configuration proves success.

The ZIP must contain one `digitalrcs-intelligencegateway-panel/` root, version 1.1.0, production module, catalog README, changelog, license, and all referenced image assets. Install the secure companion 1.1.0 or newer for image features.

The 1.1.0 release was an **unsigned review archive**. The 1.1.1 release workflow requires the signing credential and a signed manifest in the downloaded archive; inspect its manifest and validation results before claiming a signature level. Build provenance is not a Grafana signature, and signing does not by itself establish catalog publication or certification.

See [release notes](RELEASE_NOTES_1.1.0.md), [release validation](RELEASE_VALIDATION.md), and the [GitHub release](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/tag/v1.1.0). Portal submission remains a separate administrator action.
