# Grafana Compatibility and Certification

This page tracks the repository items used for Grafana plugin catalog review. Grafana reviews every submission individually; completing the checklist improves readiness but does not guarantee approval.

## Compatibility target

- Plugin ID: `digitalrcs-intelligencegateway-panel`
- Plugin type: panel
- Declared Grafana dependency: `>=11.6.0`
- Frontend: TypeScript, React, and Grafana public plugin APIs
- Backend binary: none
- Required external plugin: `digitalrcs-intelligencegateway-datasource`
- License: Apache-2.0

The CI matrix builds, lints, type-checks, unit-tests, packages, validates metadata, and runs `@grafana/plugin-e2e` across supported released Grafana Enterprise versions. The repository's GitHub Actions results are the compatibility authority.

## Repository readiness

| Requirement                                       | Repository evidence                                                      | Status                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| Public source repository                          | `https://github.com/digitalrcs/grafana-intelligence-gateway`             | Ready                          |
| Valid plugin ID/type and metadata                 | `src/plugin.json`                                                        | Ready                          |
| Required plugin dependency declared               | `dependencies.plugins` in `src/plugin.json`                              | Ready; publish data source first |
| Clear description, keywords, author, links, logos | `src/plugin.json`                                                        | Ready                          |
| Catalog screenshots                               | `src/img/panel-assessment.png`, `src/img/configuration-ai-provider.png`; secure flow evidence in `docs/images/production-secure-analysis.png` | Ready |
| README and setup guidance                         | `README.md` and this Wiki                                                | Ready                          |
| License                                           | `LICENSE` (Apache-2.0)                                                   | Ready                          |
| Versioned changelog                               | `CHANGELOG.md`                                                           | Ready                          |
| Provisioned deterministic test environment        | `provisioning/`, `testdata/mock-provider/`, and `docker-compose.yaml`     | Ready; no external credential required |
| Unit and E2E tests                                | `src/**/*.test.ts` and `tests/panel.spec.ts`                             | Ready                          |
| Multi-version compatibility CI                    | `.github/workflows/ci.yml`                                               | Configured; verify per release |
| Release packaging workflow                        | `.github/workflows/release.yml`                                          | Ready                          |
| Build provenance attestation                      | Release workflow has `id-token`, `attestations`, and `attestation: true` | Ready when a tag is released   |
| Public plugin signature                           | Requires Grafana review/signature assignment and repository secret       | External/manual step           |
| Grafana submission                                | Requires released ZIP URL, SHA1, source URL, and testing guidance        | External/manual step           |

## Release and validation procedure

Run locally before tagging:

```bash
npm ci
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

The release workflow is triggered by tags matching `v*`. It uses Grafana's `build-plugin` action to build, package, validate, optionally sign, and attest the release artifact.

Do not add public-signing settings until Grafana assigns the plugin a public signature level. When Grafana provides the access policy, save it as the repository secret `GRAFANA_ACCESS_POLICY_TOKEN`; never commit it.

## Submission values

Use these values in Grafana's **Submit New Plugin** form after publishing the GitHub draft release:

| Form field            | Value/source                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| OS & Architecture     | Single; this is a frontend-only plugin with no platform binaries.      |
| URL                   | Direct URL of the packaged plugin ZIP from the GitHub release.         |
| Source code URL       | `https://github.com/digitalrcs/grafana-intelligence-gateway`           |
| SHA1                  | SHA1 asset generated with the release, matching the submitted ZIP.     |
| Testing guidance      | Use the text below and link this Wiki.                                 |
| Provisioning provided | Yes; `docker compose up` loads the dashboard and TestData data source. |

Suggested testing guidance:

> Install/build the required `digitalrcs-intelligencegateway-datasource` sibling plugin, then run `docker compose up --build` from the panel repository. Open the provisioned Intelligence Gateway CSV dashboard at `http://localhost:3004`. The environment starts a deterministic credential-free mock provider and provisions the secure data-source UID `intelligence-gateway-secure`. Edit panel 2, confirm **Server-side credentials enabled**, load `review-model`, and select **Analyze**. Verify the response begins `Review environment response:` and the CSV source contains DC1 and DC2. No external API account or credential is required.

## Packaging requirements

The release ZIP must contain one explicit top-level directory named exactly `digitalrcs-intelligencegateway-panel`. That directory must contain `plugin.json`, `module.js`, README, CHANGELOG, LICENSE, images, and `MANIFEST.txt` when signed. Validate the exact ZIP rather than only the working directory.

On Windows, create the ZIP with a tool that stores portable forward-slash entry names. For example, run `tar -a -c -f plugin.zip digitalrcs-intelligencegateway-panel` from the directory containing the packaged plugin folder. Windows `Compress-Archive` can store backslash entry names that the Linux validator does not recognize as the required top-level directory.

## Manual submission steps

1. Confirm the GitHub Actions compatibility matrix passes on the exact release commit.
2. Submit and publish the required data source first; the panel declares it as an external plugin dependency.
3. Confirm catalog screenshots and all metadata links render from the built plugin.
4. Add `GRAFANA_ACCESS_POLICY_TOKEN` only after Grafana grants a public signature level.
5. Create and push the semantic-version tag, for example `v1.0.0`.
6. Wait for the release workflow and inspect the draft release assets and provenance attestation.
7. Validate the release ZIP and its SHA1.
8. Publish the GitHub release.
9. Submit the ZIP URL, version-tag source URL, SHA1 value, testing guidance, and provisioning declaration through Grafana's Plugins Admin page.

Official references:

- [Publishing best practices](https://grafana.com/developers/plugin-tools/publish-a-plugin/publishing-best-practices)
- [Package a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- [Publish or update a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin)
- [Provide a test environment](https://grafana.com/developers/plugin-tools/publish-a-plugin/provide-test-environment)
