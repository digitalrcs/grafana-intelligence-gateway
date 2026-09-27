# Grafana catalog submission - version 1.0.1

Use the published, tagged release assets below to update the Grafana submission. This release includes the refreshed catalog README, DigitalRCS branding, and a genuine LM Studio assessment screenshot. The panel still requires the separately distributed Intelligence Gateway Secure AI data source.

## Submission values

| Grafana field           | Value                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin ID               | `digitalrcs-intelligencegateway-panel`                                                                                                    |
| Version                 | `1.0.1`                                                                                                                                   |
| Plugin type             | Panel                                                                                                                                     |
| OS & Architecture       | Single (frontend-only archive; no native binaries)                                                                                        |
| Archive URL             | `https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.0.1/digitalrcs-intelligencegateway-panel-1.0.1.zip`      |
| SHA1 checksum file      | `https://github.com/digitalrcs/grafana-intelligence-gateway/releases/download/v1.0.1/digitalrcs-intelligencegateway-panel-1.0.1.zip.sha1` |
| Source code URL         | `https://github.com/digitalrcs/grafana-intelligence-gateway/tree/v1.0.1`                                                                  |
| Provisioning provided   | Yes                                                                                                                                       |
| Minimum Grafana version | `11.6.0`                                                                                                                                  |
| License                 | Apache-2.0                                                                                                                                |
| Required plugin         | `digitalrcs-intelligencegateway-datasource`                                                                                               |

Copy the checksum value from the SHA1 file if the form expects a hash rather than a checksum-file URL. Use the plain GitHub source-tag URL above for source/provenance verification. Do not substitute the GitHub-generated source archive for the packaged plugin ZIP.

The [release page](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/tag/v1.0.1) contains publication status and verification details. Build provenance and a Grafana plugin signature are separate: the workflow attests the archive, while public signing requires Grafana to assign a signature level and a signing token to be configured. This repository currently has no signing token, so this is an unsigned review archive.

## Testing guidance

Install/build the required `digitalrcs-intelligencegateway-datasource` sibling plugin, then run `docker compose up --build` from the panel repository. At `http://localhost:3004`, open **Intelligence Gateway: traffic-shift walkthrough** and inspect the synthetic DC1/DC2 rates. Select **Analyze** and verify **MOCK MODE — no AI inference performed**. This verifies connectivity and rendering only. Use [Reviewer Walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough) to connect a real local or hosted model and verify that changed query data changes the assessment. The mock needs no credential; actual inference needs a configured provider.

Confirm model discovery, Dashboard data-source reuse, clear/refresh controls, prompt variables, and input/output limits. The catalog screenshot comes from a real LM Studio response to synthetic data; the [capture evidence](LIVE_REVIEW_EVIDENCE.md) records its configuration and limitations.

## Verify the downloaded archive

```bash
gh release download v1.0.1 --repo digitalrcs/grafana-intelligence-gateway \
  --pattern 'digitalrcs-intelligencegateway-panel-1.0.1.zip*'
sha1sum digitalrcs-intelligencegateway-panel-1.0.1.zip
sha256sum digitalrcs-intelligencegateway-panel-1.0.1.zip
gh attestation verify digitalrcs-intelligencegateway-panel-1.0.1.zip \
  --repo digitalrcs/grafana-intelligence-gateway
```

The SHA1 must match the checksum asset; provenance must verify for this exact ZIP. The archive must contain one `digitalrcs-intelligencegateway-panel/` directory with version `1.0.1`, the updated README, screenshot, plugin logo, changelog, license, and production module. Authenticated Grafana Plugin Validator provenance checks require `GITHUB_TOKEN`; without it, provenance may be skipped.

See [v1.0.1 release notes](RELEASE_NOTES_1.0.1.md), [certification readiness](CERTIFICATION.md), and the [historical v1.0.0 record](GRAFANA_SUBMISSION_1.0.0.md). Grafana catalog acceptance remains with Grafana's review team.
