# Grafana catalog submission - version 1.0.0

This page is the release handoff for the first public review of `digitalrcs-intelligencegateway-panel`. Replace the three `PENDING RELEASE WORKFLOW` values only with outputs from the successful tagged GitHub Release workflow.

## Submission form values

| Grafana field | Value |
| --- | --- |
| Plugin ID | `digitalrcs-intelligencegateway-panel` |
| Version | `1.0.0` |
| Plugin type | Panel |
| OS & Architecture | Single (frontend-only archive; no native binaries) |
| Archive URL | `PENDING RELEASE WORKFLOW` |
| SHA1 | `PENDING RELEASE WORKFLOW` |
| Source code URL | `https://github.com/DigitalRCS/grafana-intelligence-gateway` |
| Provisioning provided | Yes |
| Minimum Grafana version | `11.6.0` |
| License | Apache-2.0 |
| Required plugin | `digitalrcs-intelligencegateway-datasource` |
| Provenance attestation | `PENDING RELEASE WORKFLOW` |

Use the public repository URL above for **Source code URL**. Do not use a local path, branch archive, Wiki URL, or release asset URL in that field. The archive URL must point directly to `digitalrcs-intelligencegateway-panel-1.0.0.zip` attached to the published GitHub release.

## Testing guidance to paste into Grafana

Install the required `digitalrcs-intelligencegateway-datasource` companion first. The repository's Docker Compose environment mounts both plugins and provisions a credential-free deterministic AI provider, a secure data-source instance, sample CSV-backed dashboard data, and an Intelligence Gateway panel. Build the companion frontend and backend as documented, run `docker compose up`, open `http://localhost:3004`, select the provisioned dashboard, and click **Analyze**. Confirm that an assessment appears, **Clear analysis** removes it, and **Refresh assessment** produces another result. In the panel editor, verify secure model loading, Dashboard data-source reuse, the full-width 1,048,576-token control, timeout settings, and empty-data behavior. No external account or API key is needed for this review path.

## Release procedure

1. Merge the catalog-readiness pull request and ensure all required checks pass on `main`.
2. Confirm the required companion data source has a published, non-draft, non-prerelease release and is submitted or accepted before the panel.
3. Create tag `v1.0.0` on the exact reviewed commit and push the tag.
4. Wait for `.github/workflows/release.yml` to complete successfully.
5. Publish the GitHub draft release as a normal release, not a prerelease.
6. Copy the generated ZIP URL and SHA1 from the release assets into the table above.
7. Verify the ZIP is the subject of a GitHub provenance attestation before submitting it.

## Provenance verification

The Release workflow grants only the required job permissions and invokes `grafana/plugin-actions/build-plugin@build-plugin/v1.2.0` with `attestation: true`. GitHub creates the attestation for the generated release ZIP by digest.

After the release is published:

```bash
gh release download v1.0.0 --pattern "digitalrcs-intelligencegateway-panel-1.0.0.zip*"
sha1sum digitalrcs-intelligencegateway-panel-1.0.0.zip
sha256sum digitalrcs-intelligencegateway-panel-1.0.0.zip
gh attestation verify digitalrcs-intelligencegateway-panel-1.0.0.zip \
  --repo DigitalRCS/grafana-intelligence-gateway
```

The SHA1 must match the `.sha1` release asset. The SHA256 verified by `gh attestation verify` must match the downloaded ZIP. Record the attestation URL shown by GitHub in the submission table.

## Final compliance gate

- Release tag resolves to the reviewed `main` commit.
- Release workflow and all supported-version CI jobs pass.
- Release is public, published, and not marked prerelease.
- ZIP has exactly one top-level directory named `digitalrcs-intelligencegateway-panel`.
- Packaged `plugin.json` reports ID `digitalrcs-intelligencegateway-panel`, version `1.0.0`, and Grafana dependency `>=11.6.0`.
- ZIP contains `README.md`, `CHANGELOG.md`, `LICENSE`, catalog screenshots, logo, production `module.js`, and source map.
- Grafana Plugin Validator reports no blocking errors. `unsigned-plugin` is expected for the first public review because Grafana assigns the public signature level after approval.
- GitHub provenance verification succeeds for the exact submitted ZIP.
- The source code field is the canonical public GitHub repository URL.
- The secure companion data source is available to the reviewer and its credentials remain in `secureJsonData`.

Do not claim Grafana certification or catalog acceptance until Grafana completes its automated and manual review.
