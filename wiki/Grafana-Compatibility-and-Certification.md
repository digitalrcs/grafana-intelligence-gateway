# Grafana Compatibility and Certification

This page tracks the repository items used for Grafana plugin catalog review. Grafana reviews every submission individually; completing the checklist improves readiness but does not guarantee approval.

## Compatibility target

- Plugin ID: `digitalrcs-intelligencegateway-panel`
- Plugin type: panel
- Declared Grafana dependency: `>=10.4.0`
- Frontend: TypeScript, React, and Grafana public plugin APIs
- Backend binary: none
- License: Apache-2.0

The CI matrix builds, lints, type-checks, unit-tests, packages, validates metadata, and runs `@grafana/plugin-e2e` across supported Grafana Enterprise releases and a nightly image. The repository's GitHub Actions results are the compatibility authority.

## Repository readiness

| Requirement                                       | Repository evidence                                                      | Status                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| Public source repository                          | `https://github.com/digitalrcs/grafana-intelligence-gateway`             | Ready                          |
| Valid plugin ID/type and metadata                 | `src/plugin.json`                                                        | Ready                          |
| Clear description, keywords, author, links, logos | `src/plugin.json`                                                        | Ready                          |
| Catalog screenshots                               | `src/img/panel-assessment.png`, `src/img/configuration-ai-provider.png`  | Ready                          |
| README and setup guidance                         | `README.md` and this Wiki                                                | Ready                          |
| License                                           | `LICENSE` (Apache-2.0)                                                   | Ready                          |
| Versioned changelog                               | `CHANGELOG.md`                                                           | Ready                          |
| Provisioned test dashboard/data source            | `provisioning/` and `docker-compose.yaml`                                | Ready                          |
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

> Start the provisioned Grafana environment with `docker compose up`, open the provisioned Intelligence Gateway dashboard, and edit the panel. The panel is connected to the sample source panel through Grafana's Dashboard data source. Configure LM Studio at `http://localhost:1234/v1` or another OpenAI-compatible provider, load/select a model, and select Analyze. Verify that DataFrame context is sent and the Markdown assessment renders. No production credentials are required; panel option credentials are development-only and are documented as insecure frontend storage.

## Packaging requirements

The release ZIP must contain one explicit top-level directory named exactly `digitalrcs-intelligencegateway-panel`. That directory must contain `plugin.json`, `module.js`, README, CHANGELOG, LICENSE, images, and `MANIFEST.txt` when signed. Validate the exact ZIP rather than only the working directory.

On Windows, create the ZIP with a tool that stores portable forward-slash entry names. For example, run `tar -a -c -f plugin.zip digitalrcs-intelligencegateway-panel` from the directory containing the packaged plugin folder. Windows `Compress-Archive` can store backslash entry names that the Linux validator does not recognize as the required top-level directory.

## Manual submission steps

1. Confirm the GitHub Actions compatibility matrix passes on the exact release commit.
2. Confirm catalog screenshots and all metadata links render from the built plugin.
3. Add `GRAFANA_ACCESS_POLICY_TOKEN` only after Grafana grants a public signature level.
4. Create and push the semantic-version tag, for example `v1.0.0`.
5. Wait for the release workflow and inspect the draft release assets and provenance attestation.
6. Validate the release ZIP and its SHA1.
7. Publish the GitHub release.
8. Submit the ZIP URL, source URL, SHA1, testing guidance, and provisioning declaration through Grafana's Plugins Admin page.

Official references:

- [Publishing best practices](https://grafana.com/developers/plugin-tools/publish-a-plugin/publishing-best-practices)
- [Package a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin)
- [Sign a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- [Publish or update a plugin](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin)
- [Provide a test environment](https://grafana.com/developers/plugin-tools/publish-a-plugin/provide-test-environment)
